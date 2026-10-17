import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../(auth)/actions";

export const metadata = { title: "Dashboard" };

async function Profile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role, branch, batch, college_email_verified, colleges(name)")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login?error=profile");

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-4xl font-black uppercase tracking-tight">
        Hello, {profile.full_name}
      </h1>
      <p className="mb-8 text-[var(--muted)] capitalize">
        {profile.role} · {profile.branch} · batch {profile.batch}
        {profile.college_email_verified ? " · college email verified" : ""}
      </p>
      <p className="mb-6">
        <Link href="/onboarding" className="underline">Edit your journey</Link>
      </p>
      <form action={signOut}>
        <button type="submit" className="rounded-full border border-[var(--ink)] px-6 py-2 font-semibold">
          Log out
        </button>
      </form>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}
