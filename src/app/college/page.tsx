import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CollegeDashboard } from "@/components/college/college-dashboard";
import type { CollegeStats } from "@/lib/college/stats";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "College dashboard" };

async function Stats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The database function only answers for the placement cell of the caller's own college.
  const { data, error } = await supabase.rpc("college_stats");
  if (error || !data) {
    return (
      <p className="rounded-[22px] bg-white p-6">
        This page is for your college&apos;s placement cell. If you should have access, ask KAL to switch your
        account to the placement role.
      </p>
    );
  }
  return <CollegeDashboard stats={data as CollegeStats} />;
}

export default function CollegePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <p className="mb-2 text-sm">
        <Link href="/dashboard" className="underline">
          Dashboard
        </Link>
      </p>
      <h1 className="mb-8 text-5xl font-black uppercase leading-none tracking-tight sm:text-7xl">
        Your college
        <br className="hidden sm:block" /> on KAL
      </h1>
      <Suspense>
        <Stats />
      </Suspense>
    </main>
  );
}
