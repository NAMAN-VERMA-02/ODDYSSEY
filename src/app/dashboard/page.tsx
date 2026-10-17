import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DashboardView, type DashboardData } from "@/components/dashboard/dashboard-view";
import { isExpired } from "@/lib/asks/trust";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };

async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { count: semesters }, { data: asks }, { data: declines }, { count: answersReceived }] =
    await Promise.all([
      supabase
        .from("users")
        .select("full_name, role, branch, batch, college_email_verified, succeeded_at, help_owed")
        .eq("id", user.id)
        .single(),
      supabase.from("snapshots").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("asks").select("asker_id, status, trust_step, expires_at, id").limit(200),
      supabase.from("ask_declines").select("ask_id").eq("declined_by", user.id),
      supabase.from("helps").select("id", { count: "exact", head: true }).eq("helped_id", user.id),
    ]);
  if (!profile) redirect("/login?error=profile");

  const declined = new Set((declines ?? []).map((d) => d.ask_id as string));
  const sent = (asks ?? []).filter((a) => a.asker_id === user.id);
  const received = (asks ?? []).filter((a) => a.asker_id !== user.id && !declined.has(a.id));

  const data: DashboardData = {
    fullName: profile.full_name,
    role: profile.role,
    branch: profile.branch,
    batch: profile.batch,
    verified: profile.college_email_verified,
    answersReceived: answersReceived ?? 0,
    state: {
      role: profile.role,
      semesters: semesters ?? 0,
      sent: sent.length,
      climbed: sent.some((a) => a.trust_step !== "question"),
      waitingOnMe: received.filter((a) => a.status === "pending" && !isExpired(a.expires_at)).length,
      succeeded: Boolean(profile.succeeded_at),
      helpOwed: profile.help_owed,
    },
  };

  return <DashboardView data={data} />;
}

export default function DashboardPage() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}
