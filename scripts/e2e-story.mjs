// Plays the whole demo story against a running hub and its two college nodes, and prints PASS/FAIL per step.
// Usage: node scripts/e2e-story.mjs [hub-url]      (default http://localhost:3000)
// Reads DEMO_STAGE_KEY, NODE_*_URL, NODE_*_HUB_TOKEN, NODE_*_VIEWER_SECRET from .env.local (or the environment).
import { existsSync, readFileSync } from "node:fs";

const HUB = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "");
const env = { ...process.env };
// For the deployed run pass the Vercel env file: node scripts/e2e-story.mjs https://oddyssey-nu.vercel.app .env.vercel.production
const ENV_FILE = process.argv[3] ?? ".env.local";
for (const file of [ENV_FILE, ".env.local"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && env[m[1]] === undefined) env[m[1]] = m[2];
  }
}
const STAGE = env.DEMO_STAGE_KEY;
const NODE = { ngit: env.NEXT_PUBLIC_NODE_NGIT_URL ?? env.NODE_NGIT_URL, rce: env.NEXT_PUBLIC_NODE_RCE_URL ?? env.NODE_RCE_URL };
const ADMIN = { ngit: env.NODE_NGIT_ADMIN_PASSWORD, rce: env.NODE_RCE_ADMIN_PASSWORD };

class Jar {
  cookies = new Map();
  async req(path, { method = "GET", json, headers = {}, base = HUB } = {}) {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { ...(json ? { "content-type": "application/json" } : {}), cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "), ...headers },
      body: json ? JSON.stringify(json) : undefined,
    });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      this.cookies.set(pair.slice(0, i), pair.slice(i + 1));
    }
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }
}

const results = [];
let t0 = Date.now();
async function step(name, fn) {
  const started = Date.now();
  try {
    const note = await fn();
    results.push({ name, ok: true, ms: Date.now() - started });
    console.log(`PASS  ${name}  (${Date.now() - started} ms)${note ? `  ${note}` : ""}`);
  } catch (e) {
    results.push({ name, ok: false, ms: Date.now() - started });
    console.log(`FAIL  ${name}  ${e instanceof Error ? e.message : e}`);
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const stageHeaders = { "x-stage-key": STAGE };
const tokenOf = (link) => link.split("/h/")[1];

const aman = new Jar();
let introId;
let target;

await step("both colleges online", async () => {
  const r = await new Jar().req("/api/fed/health");
  assert(r.ok && r.data.nodes.every((n) => n.status === "online"), `status: ${JSON.stringify(r.data.nodes?.map((n) => [n.id, n.status]))}`);
  return r.data.nodes.map((n) => `${n.id}=${n.latencyMs}ms`).join(" ");
});

await step("reset demo under 10 s", async () => {
  const s = Date.now();
  const r = await new Jar().req("/api/fed/admin/reset", { method: "POST", headers: stageHeaders });
  assert(r.ok, `reset failed: ${JSON.stringify(r.data)}`);
  assert(Date.now() - s < 10000, `took ${Date.now() - s} ms`);
  return `${r.data.people} people, ${r.data.edges} edges`;
});

let viewer;
await step("Aman picks his persona", async () => {
  const p = await aman.req("/api/fed/persona", { method: "POST", json: { story_key: "aman" } });
  assert(p.ok, JSON.stringify(p.data));
  const s = await aman.req("/api/fed/session");
  assert(s.data.session?.storyKey === "aman", "session not set");
  viewer = s.data.viewer;
  assert(viewer.ngit && viewer.rce, "missing viewer tokens");
  return `ledger ${s.data.ledger.points} pts / ${s.data.ledger.karz} karz`;
});

await step("Mirror: Priya on top, matches from both colleges", async () => {
  const r = await aman.req("/api/fed/mirror");
  assert(r.ok, JSON.stringify(r.data));
  const top = r.data.matches[0];
  assert(top.percent >= 90, `top match only ${top.percent}%`);
  assert(/ML Engineer/.test(top.label) && /FinStack/.test(top.label), `top is ${top.label}`);
  const nodes = new Set(r.data.matches.map((m) => m.node));
  assert(nodes.has("ngit") && nodes.has("rce"), `only ${[...nodes]}`);
  assert(!/Priya/.test(JSON.stringify(r.data)), "a name leaked through the hub");
  return `${r.data.matches.length} matches, top ${top.percent}% ${top.sharedTrait}`;
});

await step("Bridge: best 39.6% vs shortest 12%", async () => {
  const t = await aman.req("/api/fed/targets?q=FinStack");
  target = t.data.targets.find((x) => /Hiring Manager/.test(x.title ?? ""));
  assert(target, "Hiring Manager not found");
  const r = await aman.req(`/api/fed/route?target=${target.pid}`);
  assert(r.data.status === "ok", JSON.stringify(r.data));
  assert(Math.abs(r.data.best.prob - 0.396) < 0.0015, `best ${r.data.best.prob}`);
  assert(Math.abs(r.data.shortest.prob - 0.12) < 0.0015, `shortest ${r.data.shortest.prob}`);
  assert(r.data.best.path.length === 4, `best path has ${r.data.best.path.length} people`);
});

await step("Aman sends the intro (ask stays on NGIT's server)", async () => {
  const r = await aman.req("/api/fed/intro", { method: "POST", json: { target: target.pid, trust_step: "call" } });
  assert(r.ok && r.data.intro_id, JSON.stringify(r.data));
  introId = r.data.intro_id;
  const ask = await fetch(`${viewer.ngit.url}/public/asks`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-setu-viewer": viewer.ngit.token },
    body: JSON.stringify({ intro_id: introId, text: "Hi, I am a 3rd-year ECE student. Could you spare 15 minutes?", work_url: null }),
  });
  assert(ask.ok, `node refused the ask: ${ask.status}`);
  const state = await aman.req(`/api/fed/intro/${introId}`);
  assert(!JSON.stringify(state.data).includes("15 minutes"), "ask text reached the hub");
  return `chance ${Math.round(r.data.prob * 1000) / 10}%`;
});

async function inbox(key) {
  const r = await new Jar().req(`/api/fed/inbox?as=${key}`);
  assert(r.ok, `${key} inbox: ${JSON.stringify(r.data)}`);
  const waiting = r.data.items.find((i) => i.status === "sent");
  assert(waiting, `${key} has nothing waiting`);
  return tokenOf(waiting.link);
}
async function act(key, accept, response, note) {
  const token = await inbox(key);
  const jar = new Jar();
  const ctx = await jar.req(`/api/fed/hop/${token}`);
  assert(ctx.ok, `hop context: ${JSON.stringify(ctx.data)}`);
  if (note && ctx.data.read) {
    await fetch(`${ctx.data.read.url}/public/asks/${ctx.data.intro.id}/notes`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-setu-viewer": ctx.data.read.token },
      body: JSON.stringify({ text: note }),
    });
  }
  const r = await jar.req(`/api/fed/hop/${token}`, { method: "POST", json: { accept, ...(response ? { response } : {}) } });
  assert(r.ok, `${key} act: ${JSON.stringify(r.data)}`);
  return { ctx: ctx.data, result: r.data };
}

await step("Rohan says yes with a note; the hop page can read the ask from NGIT", async () => {
  const { ctx } = await act("rohan", true, undefined, "I know Aman. Passing this on.");
  assert(ctx.read?.node === "ngit", "no direct read path to the requester's node");
  const ask = await fetch(`${ctx.read.url}/public/asks/${ctx.intro.id}`, { headers: { "x-setu-viewer": ctx.read.token } });
  assert(ask.ok && (await ask.json()).text.includes("15 minutes"), "Rohan cannot read the ask");
});

await step("Vikram declines silently; Setu re-routes via Priya at 37.8%", async () => {
  await act("vikram", false);
  const s = await aman.req(`/api/fed/intro/${introId}`);
  assert(s.data.intro.status === "in_progress", `status ${s.data.intro.status}`);
  assert(Math.abs(s.data.intro.success_prob - 0.378) < 0.0015, `prob ${s.data.intro.success_prob}`);
  const sent = s.data.hops.find((h) => h.status === "sent");
  const priya = s.data.people.find((p) => p.pid === sent.to_pid);
  assert(priya?.company === "FinStack" && priya.node === "ngit", "new hop is not the NGIT alum");
  assert(!JSON.stringify(s.data).toLowerCase().includes("vikram"), "the decliner is identifiable");
});

await step("Priya says yes", async () => {
  await act("priya", true);
});

await step("Meera picks a 15-minute call; intro delivered", async () => {
  await act("meera", true, "call");
  const s = await aman.req(`/api/fed/intro/${introId}`);
  assert(s.data.intro.status === "delivered" && s.data.intro.response === "call", `${s.data.intro.status}/${s.data.intro.response}`);
});

await step("Aman reads the names straight from the colleges", async () => {
  const s = await aman.req(`/api/fed/intro/${introId}`);
  const accepted = s.data.hops.filter((h) => h.status === "accepted").map((h) => h.to_pid);
  const names = {};
  for (const node of ["ngit", "rce"]) {
    const pids = accepted.filter((p) => p.startsWith(`${node}_`));
    if (!pids.length) continue;
    const r = await fetch(`${s.data.viewer[node].url}/public/cards`, { method: "POST", headers: { "content-type": "application/json", "x-setu-viewer": s.data.viewer[node].token }, body: JSON.stringify({ pids }) });
    for (const c of await r.json()) if (c.name) names[c.pid] = c.name;
  }
  assert(Object.keys(names).length === accepted.length, `names for ${Object.keys(names).length} of ${accepted.length}`);
  assert(Object.values(names).some((n) => n.includes("Meera")), "Meera's name was not revealed");
  return Object.values(names).join(", ");
});

await step("Hire: +100 to everyone who said yes", async () => {
  const before = (await aman.req("/api/fed/session")).data.ledger;
  const r = await new Jar().req(`/api/fed/intro/${introId}/hire`, { method: "POST", headers: stageHeaders });
  assert(r.ok && r.data.helpers === 3, JSON.stringify(r.data));
  const lb = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/fed_leaderboard?select=pid,points,score&order=score.desc&limit=8`, { headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` } }).then((x) => x.json());
  assert(lb.length > 0, "leaderboard unreadable");
  return `Aman still ${before.score}; top score ${lb[0].score}`;
});

async function adminAccess(node, on) {
  const r = await fetch(`${NODE[node]}/admin/hub-access`, { method: "POST", headers: { "content-type": "application/json", "x-admin-password": ADMIN[node] ?? "admin" }, body: JSON.stringify({ on }) });
  assert(r.ok, `admin toggle failed: ${r.status}`);
}
await step("Kill switch: RCE off, then on", async () => {
  if (!ADMIN.rce) return "skipped (no NODE_RCE_ADMIN_PASSWORD in .env.local; node admin password needed)";
  await adminAccess("rce", false);
  await new Jar().req("/api/fed/health");
  const off = await aman.req(`/api/fed/route?target=${target.pid}`);
  assert(off.data.status === "target_offline", `expected target_offline, got ${off.data.status}`);
  const m = await aman.req("/api/fed/mirror");
  assert(m.data.matches.every((x) => x.node !== "rce"), "RCE people still shown");
  const s = Date.now();
  await adminAccess("rce", true);
  let back = false;
  while (Date.now() - s < 3000 && !back) {
    await new Jar().req("/api/fed/health");
    back = (await aman.req(`/api/fed/route?target=${target.pid}`)).data.status === "ok";
  }
  assert(back, "RCE did not come back within 3 s");
  return `back in ${Date.now() - s} ms`;
});

await step("A judge joins from a phone and sees their Mirror", async () => {
  const judge = new Jar();
  const j = await fetch(`${NODE.ngit}/public/join`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: HUB },
    body: JSON.stringify({ name: "Test Judge", role: "student", branch: "ECE", sem: 5, cgpa: 7.3, internship: false, projects: 2, hackathons: 1, skills: ["python", "ml"], goal: "ML engineer at a fintech", open_to_intros: true, on_leaderboard: true, is_18_plus: true }),
  });
  const body = await j.json();
  assert(j.ok && body.pid, `node refused: ${JSON.stringify(body)}`);
  const reg = await judge.req("/api/fed/register", { method: "POST", json: { pid: body.pid, node: "ngit" } });
  assert(reg.ok, JSON.stringify(reg.data));
  const m = await judge.req("/api/fed/mirror");
  assert(m.ok && m.data.matches.length > 0, "judge Mirror is empty");
  return `${m.data.matches.length} matches`;
});

await step("Ask Setu returns a trace from both colleges", async () => {
  const r = await new Jar().req("/api/fed/ask", { method: "POST", json: { question: "NGIT ke kaunse alumni fintech ML mein madad kar sakte hain?" } });
  assert(r.ok, JSON.stringify(r.data));
  const nodes = new Set(r.data.trace.map((t) => t.node));
  assert(nodes.has("ngit") && nodes.has("rce"), `trace only covers ${[...nodes]}`);
  assert(r.data.trace.every((t) => t.identifyingFields === 0), "a tool call reported identifying fields");
  return `${r.data.mode} mode, ${r.data.trace.length} calls, ${r.data.cards.length} cards`;
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} steps passed in ${Math.round((Date.now() - t0) / 1000)} s`);
process.exit(failed.length ? 1 : 0);
