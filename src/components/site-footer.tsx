import { Marquee } from "@/components/dashboard/marquee";

/** Ticker and small print shared by every page. */
export function SiteFooter() {
  return (
    <>
      <Marquee />
      <footer className="px-4 py-6 text-center text-xs text-[var(--muted)]">
        KAL · your college’s own network · marks shown only as ranges, only if you switch them on
      </footer>
    </>
  );
}
