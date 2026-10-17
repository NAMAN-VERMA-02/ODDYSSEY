# Judge Q&A

## Facts (use this wording)

- **DPDP Act 2023.** The college remains the Data Fiduciary and is responsible for processing that any processor does on its behalf (s.8(1)). Uploading alumni data to a vendor keeps the college liable. Maximum penalty ₹250 crore for failing to take reasonable security safeguards. The DPDP Rules were notified in November 2025; notice, consent, security, breach and children's-data duties apply from 13 May 2027, so colleges are choosing vendors now. Under-18 students need verifiable parental consent, which is why `/join` requires 18+. After a breach: notify the Board and the affected people, then file a detailed report within 72 hours.
- **Account Aggregator.** The bank (FIP) keeps the data, and the AA "does not store or process your data"; more than 500 million fulfilled consents (Sahamati, September 2026). Setu maps 1:1: college = FIP, recruiter or alum = FIU, Setu Hub = AA, each yes/no tap = the consent artefact.
- **UPI** processed 24.07 billion transactions in September 2026 (NPCI). Hence "Setu = UPI for introductions".
- **MCP** is an open standard under the Linux Foundation's Agentic AI Foundation (since December 2025). The current spec is 2026-07-28. Gemini's MCP support is experimental, which is why we run the tool loop ourselves.
- **Competitors.** Hivebrite (from $895/month), Graduway, Almabase and AlmaConnect all import or sync the college's database into their cloud. We found none with a college-hosted node or consent-routed multi-hop intros. Say "we found none", not "none exist".
- **Never claim:** "DPDP certified", "hashed IDs aren't personal data", "India mandates data localisation", or any UGC/AICTE rule.

## Likely questions

1. **Why would a college give you its people's data?** It doesn't. The college's own server holds it; the hub holds pseudonymous IDs, public job cards, probabilities and scores.
2. **Is a pseudonymous ID anonymous?** No, and we don't say it is. We say "0 identifying fields": names, emails, phones, CGPA and messages never reach the hub.
3. **What does the hub actually store?** Show `/live/privacy`: raw rows next to the college's own console.
4. **What if a college wants out?** The kill switch on its own admin page. Its people vanish from Mirror, routes and the leaderboard in seconds, because Setu never had them. Reconnect brings them back.
5. **Who is liable under DPDP?** The college stays the Data Fiduciary, which is exactly why it should keep the data on its own server instead of uploading it to a vendor.
6. **How does a name reach the student, if the hub never sees it?** Node → browser, with a short-lived signed viewer token, only after the person said yes.
7. **Why would a senior say yes?** Points for every yes, +100 to the whole chain on a hire, and a leaderboard that cannot be bought. Declines are silent.
8. **Can someone game the points?** Points are only created by consented hops and hires, written by database functions that only the server can call. Karz (debt) rises when you ask. Rank = Points − Karz.
9. **Why is the best path not the shortest?** Each hop is a person who can say no. We route on −ln p (Dijkstra), so 0.9 × 0.8 × 0.55 = 0.396 beats 0.3 × 0.4 = 0.12.
10. **What happens when someone declines?** The requester is never told who. The route is recomputed from the last person who said yes, excluding anyone who declined.
11. **Why MCP?** It is the open interface so any assistant can query a college's node. MCP isn't the privacy mechanism; the node plus per-hop consent is. Federation is signed HTTPS.
12. **Does the assistant send intros by itself?** No. It can only read; "Ask for intro" needs a human click.
13. **How does it scale?** The Mirror is plain cosine similarity on a 15-number vector; pgvector when a node holds 100k+ profiles. Nodes scale independently.
14. **What if the AI is down?** Drafts fall back to a template and Ask Setu to keyword routing over the same tools; search never needs a key.
15. **Business model?** Free for students. Colleges pay for outcomes data, professionals pay for Setu Pro, companies pay a fee per warm hire.
