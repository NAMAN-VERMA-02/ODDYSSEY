import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import type { Match } from "@/lib/scoring";
import type { MatchResponse } from "@/lib/scoring/response";
import { MAX_TOOL_CALLS, MAX_TURNS, runDraftAgent, type AgentDeps } from "./run";

const match = (id: string, over: Partial<Match> = {}): Match => ({
  id,
  displayName: `Senior ${id}`,
  batch: 2024,
  branch: "CSE",
  semester: 5,
  score: 80,
  rarityBonus: 4,
  sharedTraits: ["tier", "backlogs"],
  firstLine: "You also had 1 backlog in semester 5.",
  routes: [
    { type: "direct", hops: 1, rank: 80 },
    { type: "via_senior", hops: 2, rank: 48, company: "Cognizant", contactCount: 3 },
  ],
  rank: 80,
  ...over,
});

const body = (bridgeBlocked = false): MatchResponse => ({
  semester: 5,
  total: 2,
  bridgeBlocked,
  routeMap: { total: 2, branches: [] },
  matches: [match("a"), match("b")],
});

type Turn = Anthropic.ContentBlock[] | { stop: "refusal" | "max_tokens" };

function use(id: string, name: string, input: unknown): Anthropic.ToolUseBlock {
  return { type: "tool_use", id, name, input } as Anthropic.ToolUseBlock;
}

/** A scripted model: each call to create() returns the next turn. */
function script(turns: Turn[]) {
  const calls: Anthropic.MessageCreateParamsNonStreaming[] = [];
  let i = 0;
  const create: AgentDeps["create"] = async (params) => {
    calls.push(JSON.parse(JSON.stringify(params)));
    const turn = turns[Math.min(i++, turns.length - 1)];
    const stop = Array.isArray(turn) ? (turn.some((b) => b.type === "tool_use") ? "tool_use" : "end_turn") : turn.stop;
    return {
      id: `m${i}`,
      type: "message",
      role: "assistant",
      model: "test",
      content: Array.isArray(turn) ? turn : [],
      stop_reason: stop,
      usage: { input_tokens: 100, output_tokens: 50 },
    } as unknown as Anthropic.Message;
  };
  return { create, calls };
}

const deps = (create: AgentDeps["create"], over: Partial<AgentDeps> = {}): AgentDeps => ({
  model: "test-model",
  create,
  getJourney: async () => ({ goal: { target: "SDE at Cognizant" }, semesters: [] }),
  getMatches: async () => ({ ok: true, body: body() }),
  ...over,
});

const good = {
  drafts: [
    { match_id: "a", route: "bridge", message: "How did you prepare for the online test?", why: "Shares a backlog" },
  ],
};

describe("runDraftAgent", () => {
  it("reads the journey and matches, then submits checked drafts", async () => {
    const { create, calls } = script([
      [use("t1", "get_my_journey", {})],
      [use("t2", "find_matches", {})],
      [use("t3", "submit_drafts", good)],
    ]);
    const r = await runDraftAgent(deps(create));
    expect(r.status).toBe("ok");
    expect(r.turns).toBe(3);
    expect(r.toolCalls).toBe(3);
    expect(r.drafts).toHaveLength(1);
    expect(r.drafts[0].route).toBe("bridge");
    expect(r.drafts[0].targetCompany).toBe("Cognizant");
    expect(r.drafts[0].message.startsWith("You also had 1 backlog")).toBe(true);
    expect(r.inputTokens).toBe(300);
    // Tool results go back in a single user message.
    const last = calls[2].messages.at(-1)!;
    expect(last.role).toBe("user");
  });

  it("offers only read tools plus submit, and never a send tool", async () => {
    const { create, calls } = script([[use("t1", "submit_drafts", { drafts: [] })]]);
    await runDraftAgent(deps(create));
    expect((calls[0].tools ?? []).map((t) => ("name" in t ? t.name : "")).sort()).toEqual(["find_matches", "get_my_journey", "submit_drafts"]);
  });

  it("gives the model one chance to fix rejected drafts", async () => {
    const bad = { drafts: [{ match_id: "a", route: "direct", message: "Can you refer me please?", why: "x" }] };
    const { create } = script([
      [use("t1", "find_matches", {})],
      [use("t2", "submit_drafts", bad)],
      [use("t3", "submit_drafts", good)],
    ]);
    const r = await runDraftAgent(deps(create));
    expect(r.status).toBe("ok");
    expect(r.drafts).toHaveLength(1);
  });

  it("stops after a second failed attempt and reports why", async () => {
    const bad = { drafts: [{ match_id: "a", route: "direct", message: "Can you refer me please?", why: "x" }] };
    const { create } = script([[use("t1", "find_matches", {})], [use("t2", "submit_drafts", bad)], [use("t3", "submit_drafts", bad)]]);
    const r = await runDraftAgent(deps(create));
    expect(r.status).toBe("ok");
    expect(r.drafts).toEqual([]);
    expect(r.rejected[0].reason).toMatch(/never for a referral/);
  });

  it("rejects drafts for seniors that find_matches never returned", async () => {
    const forged = { drafts: [{ match_id: "not-a-match", route: "direct", message: "Hello there?", why: "x" }] };
    const { create } = script([[use("t1", "find_matches", {})], [use("t2", "submit_drafts", forged)], [use("t3", "submit_drafts", forged)]]);
    const r = await runDraftAgent(deps(create));
    expect(r.drafts).toEqual([]);
  });

  it("does not offer a bridge when the student already has one open", async () => {
    const { create } = script([[use("t1", "find_matches", {})], [use("t2", "submit_drafts", good)], [use("t3", "submit_drafts", good)]]);
    const r = await runDraftAgent(deps(create, { getMatches: async () => ({ ok: true, body: body(true) }) }));
    expect(r.drafts).toEqual([]);
  });

  it("reports a refusal and a missing submission", async () => {
    expect((await runDraftAgent(deps(script([{ stop: "refusal" }]).create))).status).toBe("refused");
    expect((await runDraftAgent(deps(script([[{ type: "text", text: "done", citations: null } as Anthropic.TextBlock]]).create))).status).toBe("invalid");
  });

  it("is cut off by the turn and tool-call limits", async () => {
    const loop = script([[use("t", "get_my_journey", {})]]);
    const r = await runDraftAgent(deps(loop.create));
    expect(r.status).toBe("limit");
    expect(r.turns).toBeLessThanOrEqual(MAX_TURNS);
    expect(r.toolCalls).toBeLessThanOrEqual(MAX_TOOL_CALLS + 1);

    const many = script([Array.from({ length: MAX_TOOL_CALLS + 2 }, (_, i) => use(`t${i}`, "get_my_journey", {}))]);
    expect((await runDraftAgent(deps(many.create))).status).toBe("limit");
  });

  it("passes tool errors back to the model instead of crashing", async () => {
    const { create, calls } = script([[use("t1", "find_matches", {})], [use("t2", "submit_drafts", { drafts: [] })]]);
    const r = await runDraftAgent(deps(create, { getMatches: async () => ({ ok: false, error: "Share your journey first." }) }));
    expect(r.status).toBe("ok");
    const toolResult = JSON.stringify(calls[1].messages.at(-1));
    expect(toolResult).toContain("is_error");
  });
});
