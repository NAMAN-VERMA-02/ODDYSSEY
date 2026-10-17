# Runbook

## One-time setup

1. `node scripts/gen-env.mjs <hub-url> <ngit-node-url> <rce-node-url>` writes three git-ignored files with fresh secrets (it never prints them):
   - `.env.vercel.production` → paste into Vercel (Project → Settings → Environment Variables).
   - `node/.env.render-ngit` and `node/.env.render-rce` → paste into each Render service.
   - It also appends the local block to `.env.local`.
2. Vercel also needs `SUPABASE_SERVICE_ROLE_KEY`, `LLM_PROVIDER=gemini`, `LLM_API_KEY`, `NEXT_PUBLIC_SITE_URL`.
3. Render: two Web Services from the repo, root directory `node`, build `pip install -r requirements.txt`, start `uvicorn app:app --host 0.0.0.0 --port $PORT`, health check `/health`, region Singapore. Names `setu-node-ngit` and `setu-node-rce`.
4. Keep warm: UptimeRobot on both `/health` every 5 minutes. Keep `/stage` open (it pings every 5 s).
5. Apply the migration `supabase/migrations/20261021000021_fed_hub.sql` (already applied to `oddyssey-kal`).

## T−30

- `node scripts/mcp-smoke.mjs` (with the node URLs and MCP tokens in the environment): both lines say OK, `identifying_fields=0`.
- Open `/stage?key=…`: both lights green.
- Record the backup video after the second rehearsal.

## T−15

- Stage → **Warm up**, then **Reset demo** (should take under 10 s).
- Phone A `/live/inbox?as=rohan` (turn sound on), phone B `/live/inbox?as=meera`.
- Projector on `/live`. Hotspot ready.

## T−2

- Stage lights green, inboxes show "Nothing waiting", join QR hidden.

## Recovering from failures

| Symptom | Fix |
|---|---|
| A light is red | Stage → Warm up (4 pings wake a sleeping Render instance, about a minute). Check the node's `/health`. |
| RCE shows "revoked" after the kill-switch beat | Open RCE's admin → Hub access ON, or Stage → Reset demo (it switches access back on). |
| Reset says "No college server answered" | Warm up first, then reset again. |
| Nothing updates live | Reload the screen. Pages poll every 3 s when Realtime is not connected. |
| Gemini slow or down | Ask Setu falls back to offline mode after 10 s. The draft button falls back to a template. |
| A judge cannot scan | Stage → "Play Priya on this device". |
| Intro stuck | Stage shows each hop's link; open the pending one directly. |
