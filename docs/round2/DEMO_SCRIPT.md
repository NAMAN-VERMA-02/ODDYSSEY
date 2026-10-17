# Demo script (8 to 10 minutes)

**People.** P = presenter (laptop on the projector, plus `/stage` on a second window or phone that is not projected). T = teammate: phone A is the inbox for Rohan and Vikram, phone B is Meera's inbox. J = judges on their own phones.

**T−15 min.** `/stage?key=…` → **Warm up** (both lights green) → **Reset demo**. Phone A on `/live/inbox?as=rohan`, phone B on `/live/inbox?as=meera`. Projector on `/live`.

| Time | Beat | What happens |
|---|---|---|
| 0:00 | **Hook** (P) | `/live`: two college servers with real URLs, people counts, green lights, plus the Hub. "Round 1 mein aapne poocha: colleges data kyun denge? Jawab: nahi denge. Aur Setu ko chahiye bhi nahi." |
| 0:40 | **Judges join** (J) | P: Stage → "Show join QR". Judges make a 30-second profile on `/join` (straight to the NGIT or RCE server) and see their own Mirror. Privacy ticker: "NGIT server stored 1 new profile · Setu Hub received 1 pseudonymous ID, 0 identifying fields." |
| 1:40 | **Mirror** (P as Aman) | `/live/mirror`: "6 people were where you are." Top card: NGIT alum ’22 · ML Engineer, FinStack · 94%, rarest-trait line, then → now. "Her name is hidden. Setu doesn't know it — NGIT's server does." |
| 2:40 | **Bridge** (P) | Search FinStack → "Hiring Manager – ML · RCE alum ’15". Shortest path 12% vs best path 39.6% (0.9 × 0.8 × 0.55). **Draft with AI**, edit, **Send**. Aman's Karz +10. |
| 3:40 | **Live chain** | (a) Phone A: Rohan → **Yes** + note; hop 1 green, name appears, +10 Points. (b) Phone A: Vikram → **No**; red ✕, "Someone couldn't help — re-routing…", new path via the NGIT alum ’22 at 37.8%. "Aman will never know who said no." (c) Stage → "Show Priya QR"; a judge scans, plays Priya, taps **Yes**. (d) Phone B: Meera picks **15-min call**. Aman's screen: "Meera Iyer · 15-min call". |
| 5:30 | **Points, Karz, dashboard** | `/live/leaderboard` re-orders live. `/live/college/ngit`: tiles, live feed, top helpers, data-residency card. |
| 6:15 | **Hire + pay-it-forward** | Stage → "3 weeks later → Hired": +100 to everyone who said yes. The judge's phone lights up. |
| 6:50 | **Ask Setu over MCP** | `/live/ask`: "NGIT ke kaunse alumni fintech ML mein madad kar sakte hain?" Trace shows calls on both servers with "0 identifying fields". Cards with "Ask for intro". |
| 7:50 | **Kill switch** | Open **RCE's own admin page** on RCE's server URL → **Hub access OFF**. RCE light goes red, RCE people vanish ("RCE is offline — its people aren't ours to show"); NGIT keeps working. **ON** brings everything back in under 3 seconds. |
| 8:40 | **Close** | "Setu = UPI for introductions. The college is the data provider, Setu Hub is a blind router. Free for students; colleges, professionals and companies pay." |

**3-minute cut:** Mirror → chain (a, c, d without the decline) → kill switch.

**Fallbacks.** No judge scans: Stage has "Play Priya on this device". WiFi dies: phone hotspot. Gemini slow: Ask Setu answers in offline mode within 10 s. Node asleep: Warm up. Anything else: the backup video recorded after rehearsal.
