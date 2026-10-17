import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MatchesView } from "./matches-view";

export const metadata = { title: "Your matches" };

async function Matches() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: snaps } = await supabase
    .from("snapshots")
    .select("semester")
    .eq("user_id", user.id)
    .order("semester");
  if (!snaps?.length) redirect("/onboarding");

  const semesters = snaps.map((s) => s.semester as number);
  return <MatchesView semesters={semesters} initialSemester={semesters[semesters.length - 1]} />;
}

export default function MatchesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <p className="mb-2 text-sm">
        <Link href="/dashboard" className="underline">
          Dashboard
        </Link>
      </p>
      <h1 className="mb-8 text-5xl font-black uppercase leading-none tracking-tight sm:text-7xl">
        Where you are, <br className="hidden sm:block" />
        where they went
      </h1>
      <Suspense>
        <Matches />
      </Suspense>
    </main>
  );
}
