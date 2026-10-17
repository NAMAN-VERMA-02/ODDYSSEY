# KAL (कल)

**Their yesterday is your tomorrow.** KAL is a college's own alumni network that matches each student to the seniors who were once in *exactly* their position, shows the routes those seniors took, and helps the student reach them directly or through one bridging senior they trust.

Alumni platforms show where seniors are today. A student from a tier-2 or tier-3 college needs a route, and only someone who once stood where that student stands can show one. KAL matches on the "then", not the "now". To our knowledge, no alumni platform matches a student to a senior's past stage.

Repository: `ODDYSSEY` · Built for a hackathon.

## What it does

| Idea | How KAL does it |
|---|---|
| **Past-self matching** | Compares a student with every senior's snapshot from the *same semester*: college tier 20, CGPA within 0.5 → 20, branch 15, backlogs 15, 10th within 5% → 10, 12th within 5% → 10, same direction 10. A rarity bonus rewards uncommon shared traits; the rarest one becomes the first line of the message. |
| **Route map** | A branching D3 map of what the matched seniors did next (job, GATE, startup…) and where they landed. Counts only. |
| **Introductions through a senior** | If a matched senior knows people at the student's target company (a count, never names), the student can ask that senior to pass the question on. Never more than 2 hops. The senior forwards a one-time link from their own phone; the recipient replies in one tap with no sign-up. |
| **Trust ladder** | A question → a 15-minute call → a small task → a referral. A referral unlocks only after the senior has seen the student's work. |
| **Pay it forward ×3** | When someone lands a role, KAL shows three juniors whose "today" matches their "yesterday" and asks for one answer each. |
| **College dashboard** | For the placement cell: students on KAL, first-reply rate, how far requests climb the ladder, placements, and help paid forward. |
| **Draft-writing agent** | An LLM agent reads the student's journey and matches and drafts first messages. The student edits and sends them. See [docs/agent.md](docs/agent.md). |
| **LinkedIn PDF import** | The student's own "Save to PDF" is read once by an LLM into a semester-by-semester draft. The file is never stored. |

## Try the demo (about 5 minutes)

Prerequisite: the app is running with the sample data loaded (see [Setup](#setup)).

1. **Join.** Sign up at `/signup` with a `@kiet.edu` address, batch 2028 or later, 18 or older. Confirm the email link.
2. **Share your journey** at `/onboarding`: a goal such as "SDE at Cognizant", marks as ranges, and each semester so far. Switch on only the marks you are happy to show.
3. **See your matches** at `/matches`: "N seniors were where you are", the route map, and ranked match cards with the rarest shared trait as the opening line.
4. **Draft messages.** Press *Draft messages for me*, edit a draft, and send it. (Or use *Ask* on any card.)
5. **Bridge.** On a card that says "Knows 3 people at Cognizant", choose *pass it on*. Open `/requests` as the senior, press *Forward to someone I know*, and open the one-time link in a private window: it works without signing in.
6. **Climb the ladder.** As the senior, accept, then unlock the next step. Note that *Referral* stays locked until work has been shared and seen.
7. **Pay it forward** at `/payitforward`: report a success, then answer three juniors.
8. **College dashboard** at `/college` (placement accounts only, see below).

## Stack

Next.js 16 (App Router, TypeScript, Tailwind, mobile-first) · Supabase (Postgres, Auth, Row Level Security) · Claude API for the PDF import and the draft agent · D3 (`d3-hierarchy`, `d3-shape`) for the route map · Vitest.

```
src/
  app/            pages and route handlers (api/match, api/asks, api/payitforward, api/agent, api/parse-journey, f/[token])
  components/     matches, requests, pay-it-forward and college screens
  lib/
    scoring/      trait matching, rarity, rank, route map, pay-it-forward picks
    asks/         trust ladder, forward tokens, error mapping
    agent/        tool loop, guardrails, prompt
    match/        shared match service
    supabase/     browser, server, admin clients and session proxy
    validation/   zod schemas
supabase/
  migrations/     schema, RLS, guard triggers, functions
  seed/           150 synthetic journeys and outcomes
docs/             design direction, agent flow and guardrails
```

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values below; never commit .env.local
npm run dev
npm test                     # unit tests
```

| Variable | Needed for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | everything | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | everything | the public anon or publishable key |
| `NEXT_PUBLIC_SITE_URL` | email links, forward links | `http://localhost:3000` locally; your production URL when deployed |
| `SUPABASE_SERVICE_ROLE_KEY` | matching, pay it forward, agent | **secret**: server only, bypasses RLS; results are sanitised before they leave the server |
| `LLM_API_KEY` | PDF import, draft agent | **secret**; `LLM_MODEL` optionally overrides the default model |

### Database

Apply the files in `supabase/migrations/` in order (they are numbered). Then load the demo data in the SQL editor:

1. `supabase/seed.sql`: the demo college (`kiet.edu`, tier is a placeholder).
2. `supabase/seed/sample_journeys.sql`: 150 synthetic journeys.
3. `supabase/seed/sample_outcomes.sql`: placements, open questions, requests, pay-it-forward answers.

Sample accounts use the reserved `@seed.invalid` domain and a "(sample)" name suffix, so none of them can log in or receive mail. Remove them with `delete from auth.users where email like '%@seed.invalid';`.

**College dashboard access.** Roles cannot be changed from the app. In the SQL editor, run
`update public.users set role = 'placement' where id = '<your user id>';`.

## Deploy (Vercel + Supabase)

1. In Vercel choose **Add New → Project**, import this GitHub repository, and keep the Next.js defaults.
2. Add the environment variables above. Mark `SUPABASE_SERVICE_ROLE_KEY` and `LLM_API_KEY` as **Sensitive**.
3. Deploy, then set `NEXT_PUBLIC_SITE_URL` to the production URL and redeploy.
4. In Supabase, open **Authentication → URL Configuration**: set **Site URL** to the production URL and add `https://<your-domain>/auth/callback` to **Redirect URLs**.
5. In Supabase **Authentication → Providers → Email**, keep *Confirm email* on, and enable leaked-password protection.
6. Run the security advisor and check that only the known, intentional findings remain (see below).

`/dev/*` preview pages return 404 in production builds.

## Privacy and guardrails

- Marks are stored and shown only as ranges, and only where the owner switched them on. Hidden marks still count towards a match score but are never listed or quoted.
- Company counts are shown only if the count is 2 or more, and only as counts.
- One open bridge request per student; at most 3 waiting requests per senior.
- Forward links expire after 7 days. Only a hash of the link is stored. Declining is silent: the student never learns of it.
- A referral unlocks only after the senior has seen the student's work.
- College email verification; users must be 18 or older. The date of birth is checked once and not stored.
- Row Level Security is enabled on every table. Server-side functions that must see across users are narrow and documented in the migrations.
- Matching and similar features read other people's rows with the service role on the server and return only sanitised results.
- No scraping, no contact access, no one is contacted unless they are on KAL or a senior chooses to share a link.

Designed on the principles of India's DPDP Act 2023 (data minimisation, separate purposes, deletion on request). We do not claim certification.

**Known advisor findings (intentional):** the `snapshots_visible` view is security-definer so it can mask marks per owner opt-in; `get_forward` and `reply_forward` are callable without signing in because the forward link is the credential; the other flagged functions are called by signed-in users through the app.

## What is built and what is not

Built: signup with college-email verification and the 18+ check, journey form, LinkedIn PDF import, match scoring with rarity, route map, asks with the trust ladder, bridge forward links, silent declines, requests inbox, pay it forward, college dashboard, draft agent with guardrails, 150-journey demo data.

Not built yet, and not claimed:

- Entering company counts, and the in-browser LinkedIn *connections* parser that would send only "company: count".
- Importing the alumni list by the placement cell.
- Faculty, founder and recruiter experiences beyond signing up.
- Real-time updates and in-app messaging.
- The "route did not work" markers on the route map (no outcome data for it yet).
- The cinematic landing, editorial grid and footer styles described in [docs/design.md](docs/design.md); the current screens use the editorial palette only.
- Shared rate limiting beyond the agent (the PDF import limit is per server instance).

What KAL does **not** claim: that it guarantees a referral or a job (it opens the route; the senior decides), that it knows who works where (it knows counts that consenting seniors shared), chains longer than 2 hops, or that the referral advantage figure is an Indian one.

## Team & Contributions

All work in this repository is committed under NAMAN-VERMA (GitHub: NAMAN-VERMA-02), who directed every feature: the schema and security rules, auth, the journey form and PDF import, matching and the route map, the asks and bridge flow, pay it forward, the college dashboard, and the draft agent.

Built with Claude as a coding assistant; the team designed, directed and reviewed every feature.
