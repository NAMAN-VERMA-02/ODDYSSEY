# Rehearsal

## Verified so far (local, no hub database access)

- Node: 27 pytest tests pass. Both nodes run under uvicorn; `/health`, `/directory` and MCP `tools/list` work; `scripts/mcp-smoke.mjs` passes against both (TypeScript SDK 1.32.1 ↔ Python `mcp` 1.30.0), `identifying_fields=0`.
- Hub: 172 vitest tests pass (routing story numbers 0.396 / 0.12 / 0.378, tokens, schema guard, history totals 142 / 68% / 9, colleague edges, Ask Setu helpers). `next build` passes.
- Hub database functions: a rolled-back SQL block on `oddyssey-kal` played the whole story: intro with 3 hops, idempotent yes, silent decline, re-route to 0.378, delivery as a 15-min call, points (Rohan 10, Priya 10, Meera 25, Vikram 0), hire +100 to the three helpers, no story names in events, a fourth open intro refused.

## Still to run on the deployed URLs (needs the service-role key and both Render nodes)

Run twice in a row and record timings here.

1. Reset (under 10 s).
2. Aman (context 1) sends to Meera.
3. Rohan (context 2) accepts.
4. Vikram declines; the re-route shows Priya at 0.378.
5. Priya's link opens in context 3 (logged out) and accepts.
6. Meera chooses a call → delivered; names are revealed on Aman's screen.
7. Hire → pay-it-forward on Priya's page.
8. The leaderboard updates.
9. RCE hub access off → RCE disappears and Aman → Meera says "RCE is offline".
10. Back on → everything returns.
11. `/join` creates a judge profile and shows its Mirror.
12. Ask Setu returns a trace from both nodes.

| Run | Date | Result | Notes |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
