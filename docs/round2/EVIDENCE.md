# Evidence for every claim

Each row: what you say on stage, how to prove it in under a minute, and what backs it. Re-run the scripts the same day you present.

| Claim | Show it | Backed by |
|---|---|---|
| "The hub never sees a name." | `/live/privacy`: raw hub rows beside the college's own console. Counter "identifying fields received by the hub" reads 0. | `scripts/privacy-probe.mjs`: reads every row of all 11 `fed_*` tables with the public key (1,271 rows) and finds no name, email or phone. A vitest guard fails the build if a `fed_` column is named like identifying data. |
| "Names and messages go from the college straight to the browser." | Open the browser network tab on the intro screen: name requests go to `setu-node-*.onrender.com`, not to the hub. | `scripts/e2e-story.mjs` step "Aman sends the intro": the ask text is checked to be absent from every hub response. |
| "Names appear only after someone says yes." | On the live intro screen, waiting people read "NGIT ’22", "RCE ’15"; names appear when each says yes. | Probe: an anonymous visitor and a forged token both get masked cards (403) on both nodes. `/public/cards` refuses callers without a valid token. |
| "Declines are silent." | Vikram taps No; Aman's screen shows only a red ✕ and "re-routing". | e2e step "Vikram declines silently": the decliner's name never appears in any hub response. |
| "The best path is not the shortest." | Bridge screen: 0.9 × 0.8 × 0.55 = 39.6% vs 0.3 × 0.4 = 12%. | `src/lib/fed/bridge.test.ts` (story numbers, hop limit, exclusions, offline college) and e2e step "Bridge". After the decline, the route recomputes to 37.8%. |
| "Points can't be bought; rank = Points − Karz." | Leaderboard re-orders after each yes; asking adds Karz. | Points are written only by database functions that only the server can call. Probe: the public key cannot insert, update or delete ledger rows, and cannot call any `fed_*` function. A rolled-back SQL test on the real database played the whole story. |
| "A college can disconnect, and its people vanish." | RCE's own admin page → Hub access OFF. RCE light goes red; routes and Mirror drop RCE. ON restores it in about 1 s. | e2e step "Kill switch" (measured 0.8 to 1.0 s live). Nodes return 503 `hub_access_revoked` to the hub while off. |
| "The college console is the college's, not ours." | Open `setu-node-rce.onrender.com/admin` on its own domain. | Probe: the console, the hub-access toggle and reset all refuse missing or wrong passwords (401). |
| "Every call to a college is logged." | `/live/privacy`: "hub → college calls" counter; each college's console lists its last 30 audit lines. | `fed_audit` rows with the node's own `X-Setu-Identifying-Fields` count. |
| "MCP is the open interface; tools return nothing identifying." | `/live/ask`: the trace panel shows each call to each college with "0 identifying fields". | `scripts/mcp-smoke.mjs`; the probe confirms the MCP endpoint refuses missing or wrong tokens. |
| "It works live, not just on my laptop." | Run `node scripts/e2e-story.mjs https://oddyssey-nu.vercel.app .env.vercel.production`. | `docs/round2/REHEARSAL.md`: 15/15 live in about 23 s, twice in a row. |
| "It follows DPDP's direction." | The data-residency card on `/live/college/ngit`. | Wording in `QA.md`. Never claim certification. |

## Commands

```bash
node scripts/e2e-story.mjs https://oddyssey-nu.vercel.app .env.vercel.production     # the whole story, 15 steps
node scripts/privacy-probe.mjs https://oddyssey-nu.vercel.app .env.vercel.production # 20 attempts to break privacy and auth
node scripts/mcp-smoke.mjs                                                           # both MCP servers, needs NODE_*_URL and NODE_*_MCP_TOKEN
```

## What is not proven (say so if asked)

- It has not been run from a real phone on mobile data, nor on the actual projector.
- The free Render nodes sleep after 15 idle minutes (cold start about a minute); Warm up first.
- Pseudonymous IDs can still be personal data under DPDP, which is why the UI says "identifying fields", not "personal fields".
- Supabase's advisor lists warnings on the campus app (not on the `fed_*` tables): a security-definer view, definer functions, and leaked-password protection turned off.
