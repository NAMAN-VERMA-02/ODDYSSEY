import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { buildRouteMap, chunks, matchSeniors, toTraits, type Candidate, type Outcome, type SnapshotRow } from "@/lib/scoring";

const MAX_RESULTS = 30;
const MAX_SENIORS = 2000;
const CHUNK = 150; // keeps `in (...)` URLs short

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&");

/** Past-self matches: seniors from the same college who were in the same semester. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Sign in to continue.", 401);

  const admin = createAdminClient();
  if (!admin) return fail("Matching is not configured yet.", 503);

  const { data: profile } = await supabase
    .from("users")
    .select("id, batch, branch, college_id")
    .eq("id", user.id)
    .single();
  if (!profile) return fail("Finish signing up first.", 403);

  const { data: college } = await supabase
    .from("colleges")
    .select("tier")
    .eq("id", profile.college_id)
    .single();
  if (!college) return fail("College not found.", 404);

  // Semester: ?semester=n, otherwise the latest one the student has filled in.
  const { data: mine } = await supabase
    .from("snapshots")
    .select("*")
    .eq("user_id", user.id)
    .order("semester", { ascending: false });
  if (!mine?.length) return fail("Share your journey first.", 409);

  const requested = Number(request.nextUrl.searchParams.get("semester"));
  const semester = Number.isInteger(requested) && requested > 0 ? requested : mine[0].semester;
  const myRow = mine.find((s) => s.semester === semester);
  if (!myRow) return fail("Add that semester to your journey first.", 409);
  const me = toTraits(myRow, profile.branch, college.tier);

  const [{ data: goal }, { data: openBridge }] = await Promise.all([
    supabase.from("goals").select("company").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("asks")
      .select("id")
      .eq("asker_id", user.id)
      .not("via_id", "is", null)
      .in("status", ["pending", "forwarded"])
      .gt("expires_at", new Date().toISOString())
      .limit(1),
  ]);
  const goalCompany: string = goal?.company?.trim() ?? "";
  const bridgeBlocked = (openBridge?.length ?? 0) > 0;

  // Seniors: same college, earlier batch.
  const { data: seniors } = await admin
    .from("users")
    .select("id, full_name, branch, batch, last_active_at, help_owed")
    .eq("college_id", profile.college_id)
    .lt("batch", profile.batch)
    .neq("id", user.id)
    .limit(MAX_SENIORS);
  if (!seniors?.length) return NextResponse.json({ semester, total: 0, bridgeBlocked, routeMap: buildRouteMap([]), matches: [] });

  const ids = seniors.map((s) => s.id as string);

  const snapshots: SnapshotRow[] = [];
  const contacts = new Map<string, { company: string; count: number }>();
  const pending = new Map<string, number>();

  for (const part of chunks(ids, CHUNK)) {
    const [snaps, counts, waiting] = await Promise.all([
      admin.from("snapshots").select("*").in("user_id", part).eq("semester", semester),
      goalCompany
        ? admin.from("company_counts").select("user_id, company, count").in("user_id", part).ilike("company", escapeLike(goalCompany))
        : Promise.resolve({ data: [] as { user_id: string; company: string; count: number }[] }),
      // Waiting requests per senior, leaving out silently declined ones.
      admin.rpc("waiting_asks_for", { p_ids: part }),
    ]);
    snapshots.push(...((snaps.data ?? []) as SnapshotRow[]));
    for (const c of counts.data ?? []) contacts.set(c.user_id, { company: c.company, count: c.count });
    for (const w of (waiting.data ?? []) as { user_id: string; waiting: number }[]) pending.set(w.user_id, w.waiting);
  }

  const byId = new Map(seniors.map((s) => [s.id as string, s]));
  const candidates: Candidate[] = snapshots.flatMap((snap) => {
    const s = byId.get(snap.user_id);
    if (!s) return [];
    return [
      {
        id: s.id,
        displayName: s.full_name,
        batch: s.batch,
        branch: s.branch,
        traits: toTraits(snap, s.branch, college.tier),
        visibility: { cgpa: snap.show_cgpa, tenth: snap.show_tenth, twelfth: snap.show_twelfth },
        lastActiveAt: s.last_active_at,
        helpOwed: s.help_owed,
        contacts: contacts.get(s.id) ?? null,
        pendingAsks: pending.get(s.id) ?? 0,
      },
    ];
  });

  const all = matchSeniors(me, candidates, { semester });

  // What the matched seniors did next, as counts only.
  const matchedIds = all.map((m) => m.id);
  const lastDecision = new Map<string, { semester: number; decision: string }>();
  const goalCompanyOf = new Map<string, string>();
  for (const part of chunks(matchedIds, CHUNK)) {
    const [snaps, goals] = await Promise.all([
      admin.from("snapshots").select("user_id, semester, decision").in("user_id", part).not("decision", "is", null),
      admin.from("goals").select("user_id, company").in("user_id", part),
    ]);
    for (const r of snaps.data ?? []) {
      const prev = lastDecision.get(r.user_id);
      if (!prev || r.semester > prev.semester) lastDecision.set(r.user_id, { semester: r.semester, decision: r.decision });
    }
    for (const g of goals.data ?? []) if (g.company) goalCompanyOf.set(g.user_id, g.company);
  }
  const outcomes: Outcome[] = matchedIds.map((id) => ({
    decision: lastDecision.get(id)?.decision ?? null,
    company: goalCompanyOf.get(id) ?? null,
  }));
  const routeMap = buildRouteMap(outcomes);
  // A student with an open bridge request cannot start another one.
  const matches = (
    bridgeBlocked
      ? all.map((m) => {
          const routes = m.routes.filter((r) => r.type === "direct");
          return { ...m, routes, rank: Math.max(...routes.map((r) => r.rank)) };
        })
      : all
  ).slice(0, MAX_RESULTS);

  return NextResponse.json({ semester, total: all.length, bridgeBlocked, routeMap, matches });
}
