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
