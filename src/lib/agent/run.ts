import type Anthropic from "@anthropic-ai/sdk";
import type { MatchResponse } from "@/lib/scoring/response";
import {
  MAX_DRAFTS,
  checkDrafts,
  sanitizeUntrusted,
  type AgentMatch,
  type CheckedDraft,
  type RawDraft,
  type Rejection,
} from "./guardrails";
import { SYSTEM_PROMPT, USER_PROMPT } from "./prompt";
import { TOOLS, matchSummary } from "./tools";

/** Hard limits: the agent can neither loop forever nor spend without bound. */
export const MAX_TURNS = 6;
export const MAX_TOOL_CALLS = 8;
export const MAX_OUTPUT_TOKENS = 6000;

export type AgentStatus = "ok" | "refused" | "invalid" | "limit" | "error";

export type AgentResult = {
  status: AgentStatus;
  drafts: CheckedDraft[];
  rejected: Rejection[];
  turns: number;
  toolCalls: number;
  inputTokens: number;
  outputTokens: number;
};

export type AgentDeps = {
  model: string;
  create: (params: Anthropic.MessageCreateParamsNonStreaming) => Promise<Anthropic.Message>;
  /** Already sanitised summary of the student's own journey. */
  getJourney: () => Promise<unknown>;
  getMatches: () => Promise<{ ok: true; body: MatchResponse } | { ok: false; error: string }>;
};

const json = (value: unknown) => JSON.stringify(value);

/**
 * Tool-using loop that drafts first messages. It reads (journey, matches) and proposes
 * (submit_drafts); it can never send anything. Every proposal passes the guardrails.
 */
export async function runDraftAgent(deps: AgentDeps): Promise<AgentResult> {
  const result: AgentResult = { status: "error", drafts: [], rejected: [], turns: 0, toolCalls: 0, inputTokens: 0, outputTokens: 0 };

  const allowed = new Map<string, AgentMatch>();
  let bridgeBlocked = false;
  let retried = false;

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: USER_PROMPT }];

  while (result.turns < MAX_TURNS) {
    result.turns += 1;
    const response = await deps.create({
      model: deps.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      output_config: { effort: "medium" },
      messages,
    });
    result.inputTokens += response.usage?.input_tokens ?? 0;
    result.outputTokens += response.usage?.output_tokens ?? 0;

    if (response.stop_reason === "refusal") return { ...result, status: "refused" };
    if (response.stop_reason === "max_tokens") return { ...result, status: "limit" };

    // Keep the whole assistant turn, including thinking blocks, so the model can continue.
    messages.push({ role: "assistant", content: response.content });

    const calls = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (calls.length === 0) return { ...result, status: "invalid" };

    const results: Anthropic.ToolResultBlockParam[] = [];
    let finished = false;

    for (const call of calls) {
      result.toolCalls += 1;
      if (result.toolCalls > MAX_TOOL_CALLS) return { ...result, status: "limit" };
      const reply = (content: string, isError = false): Anthropic.ToolResultBlockParam => ({
        type: "tool_result",
        tool_use_id: call.id,
        content,
        ...(isError ? { is_error: true } : {}),
      });

      if (call.name === "get_my_journey") {
        results.push(reply(json(await deps.getJourney())));
      } else if (call.name === "find_matches") {
        const found = await deps.getMatches();
        if (!found.ok) {
          results.push(reply(json({ error: found.error }), true));
          continue;
        }
        bridgeBlocked = found.body.bridgeBlocked;
        const top = found.body.matches.slice(0, 5);
        for (const m of top) {
          allowed.set(m.id, {
            id: m.id,
            displayName: sanitizeUntrusted(m.displayName, 80),
            firstLine: sanitizeUntrusted(m.firstLine, 160),
            routes: m.routes,
          });
        }
        const summary = matchSummary(top).map((s) => ({ ...s, first_line: allowed.get(s.id)?.firstLine ?? s.first_line }));
        results.push(reply(json({ total_matches: found.body.total, bridge_available: !found.body.bridgeBlocked, matches: summary })));
      } else if (call.name === "submit_drafts") {
        const raw = ((call.input as { drafts?: RawDraft[] }).drafts ?? []).slice(0, MAX_DRAFTS + 3);
        const { accepted, rejected } = checkDrafts(raw, allowed, { bridgeBlocked });

        if (accepted.length === 0 && rejected.length > 0 && !retried && result.turns < MAX_TURNS) {
          // One chance to fix the problems the guardrails found.
          retried = true;
          results.push(reply(json({ problems: rejected.map((r) => r.reason), instruction: "Fix these and call submit_drafts again." }), true));
        } else {
          result.drafts = accepted;
          result.rejected = rejected;
          finished = true;
          results.push(reply("Received."));
        }
      } else {
        results.push(reply(json({ error: "Unknown tool." }), true));
      }
    }

    if (finished) return { ...result, status: "ok" };
    messages.push({ role: "user", content: results });
  }

  return { ...result, status: "limit" };
}
