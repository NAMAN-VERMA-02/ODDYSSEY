import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-4 text-6xl font-black uppercase leading-none tracking-tight">
        Their yesterday is your tomorrow.
      </h1>
      <p className="mb-8 text-lg text-[var(--muted)]">
        KAL matches you to the seniors who were once exactly where you are now, and helps you reach them.
      </p>
      <div className="flex gap-3">
        <Link href="/signup" className="rounded-full bg-[var(--ink)] px-6 py-3 font-semibold text-white">
          Join KAL
        </Link>
        <Link href="/login" className="rounded-full border border-[var(--ink)] px-6 py-3 font-semibold">
          Log in
        </Link>
      </div>
    </main>
  );
}
