import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";

const LINKS = [
  { href: "/matches", label: "Matches" },
  { href: "/requests", label: "Requests" },
  { href: "/payitforward", label: "Pay it forward" },
  { href: "/onboarding", label: "My journey" },
];

/** Floating white header card shared by signed-in pages. */
export function AppHeader({ isPlacement = false }: { isPlacement?: boolean }) {
  const links = isPlacement ? [{ href: "/college", label: "College" }, ...LINKS] : LINKS;

  return (
    <header className="header-drop sticky top-0 z-10 mx-auto w-full max-w-6xl px-3 sm:px-6">
      <div className="flex items-center justify-between gap-4 rounded-b-[22px] bg-white px-4 py-3 shadow-[0_0_0_1px_rgba(15,15,14,.08),0_16px_36px_-24px_rgba(15,15,14,.3)] sm:px-6">
        <Link href="/dashboard" className="flex items-baseline gap-2 font-black uppercase leading-none tracking-tight" aria-label="KAL home">
          <span className="text-3xl">KAL</span>
          <span className="text-sm font-medium normal-case text-[var(--muted)]">कल</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--paper)]">
              {l.label}
            </Link>
          ))}
        </nav>

        <form action={signOut}>
          <button type="submit" className="rounded-full bg-[var(--ink)] px-5 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
            Log out
          </button>
        </form>
      </div>

      <nav aria-label="Main" className="flex gap-2 overflow-x-auto px-1 py-3 md:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="shrink-0 rounded-full bg-white px-4 py-1.5 text-sm font-medium shadow-[0_0_0_1px_rgba(15,15,14,.08)]">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
