# KAL (कल) — ODDYSSEY

A college alumni network that matches every student to the seniors who were once in the *same position* (same semester, similar CGPA, backlogs, branch, college tier, 10th/12th marks, GATE vs job), shows the routes those seniors took, and helps the student reach them directly or through one bridging senior (max 2 hops).

Trust ladder: question → 15-minute call → small task → referral unlocks. After success, pay it forward ×3.

## Stack
Next.js (App Router, TypeScript, Tailwind, mobile-first), Supabase (Postgres, auth, realtime, RLS), an LLM API (LinkedIn PDF → semester timeline, message drafts), D3 (route map).

## Setup
```bash
npm install
cp .env.example .env.local   # fill in real values; never commit .env.local
npm run dev
```

## Demo data
`supabase/seed/sample_journeys.sql` loads 150 synthetic journeys (about 1,180 semester snapshots, goals and company counts) for the demo college. They use the reserved `@seed.invalid` domain, so they can never log in or receive mail, and names carry a "(sample)" suffix. The script is deterministic and safe to re-run. Remove it with `delete from auth.users where email like '%@seed.invalid';`.

Outcomes for the demo (placements, open questions, requests, pay-it-forward answers and a sample placement-cell account) come from `supabase/seed/sample_outcomes.sql`, run after the journeys.

To see the college dashboard, switch your own account to the placement role in the Supabase SQL editor (the app itself cannot change roles):
`update public.users set role = 'placement' where id = '<your user id>';`

To try `/api/match` end to end, add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`, sign up with a `@kiet.edu` address (batch 2028 or later), fill in your journey, then open `/api/match`.

## Draft-writing agent
An LLM agent drafts first messages for a student's best matches; the student edits and sends them. See [docs/agent.md](docs/agent.md) for the flow diagram and guardrails.

## Privacy and guardrails
- Marks are shown only as ranges, and only if the user opts in.
- Company counts are shown only if the count is 2 or more; names never reach the server.
- One open bridge request per student; at most 3 waiting per senior.
- Forward links expire in 7 days; declines are silent.
- Referral unlocks only after the senior has seen the student's work.
- College email verification; 18+. Supabase RLS on every table.

Designed on DPDP Act 2023 principles (not "certified compliant").

## Team & Contributions
All work is committed under NAMAN-VERMA (GitHub: NAMAN-VERMA-02), who directed every feature in this repository.

Built with Claude as a coding assistant; the team designed, directed and reviewed every feature.
