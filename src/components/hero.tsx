/** Big uppercase page title: each line rises from behind a mask, then the intro fades up. */
export function Hero({
  id = "page-title",
  eyebrow,
  lines,
  lede,
  size = "clamp(2.75rem, 9vw, 7rem)",
}: {
  id?: string;
  eyebrow?: string;
  lines: string[];
  lede?: React.ReactNode;
  size?: string;
}) {
  return (
    <section aria-labelledby={id} className="mb-10 sm:mb-14">
      {eyebrow && (
        <p className="rise mb-5 inline-block rounded-full bg-white px-3 py-1 text-sm font-semibold shadow-[0_0_0_1px_rgba(15,15,14,.08)]" style={{ "--d": "0.15s" } as React.CSSProperties}>
          {eyebrow}
        </p>
      )}
      <h1 id={id} className="font-black uppercase leading-[0.88] tracking-[-0.04em]" style={{ fontSize: size }}>
        {lines.map((line, i) => (
          <span key={line} className="mask-line" style={{ "--d": `${0.2 + i * 0.12}s` } as React.CSSProperties}>
            <span>{line}</span>
          </span>
        ))}
      </h1>
      {lede && (
        <p className="rise mt-5 max-w-2xl text-lg text-[var(--muted)]" style={{ "--d": `${0.35 + lines.length * 0.12}s` } as React.CSSProperties}>
          {lede}
        </p>
      )}
    </section>
  );
}
