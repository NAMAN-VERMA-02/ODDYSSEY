"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/fed/client";

const NODES = [
  { id: "ngit", label: "NGIT", sub: "Northgate, Delhi", url: process.env.NEXT_PUBLIC_NODE_NGIT_URL },
  { id: "rce", label: "RCE", sub: "Riverbend, Noida", url: process.env.NEXT_PUBLIC_NODE_RCE_URL },
] as const;
const BRANCHES = ["CSE", "IT", "ECE", "ME", "AIML"];
const SKILLS = ["python", "ml", "web", "dsa", "cloud", "design"];
const GOALS = ["ML engineer at a fintech", "Software engineer at a product company", "Data scientist", "Higher studies (GATE or MS)", "Start my own company"];

const chip = (on: boolean) => `rounded-full border-2 px-5 py-3 text-lg font-bold ${on ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--ink)]/25 bg-[var(--surface)]"}`;
const field = "mt-1 w-full rounded-xl border border-[var(--ink)]/25 bg-[var(--surface)] px-4 py-3 text-xl";

/** 30-second profile for a judge's phone. It goes straight to the chosen college's own server. */
export function JoinForm() {
  const router = useRouter();
  const [node, setNode] = useState<"ngit" | "rce">("ngit");
  const [role, setRole] = useState<"student" | "alum">("student");
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [sem, setSem] = useState(5);
  const [gradYear, setGradYear] = useState(2022);
  const [cgpa, setCgpa] = useState(7.5);
  const [internship, setInternship] = useState(false);
  const [projects, setProjects] = useState(2);
  const [hackathons, setHackathons] = useState(1);
  const [skills, setSkills] = useState<string[]>(["python"]);
  const [goal, setGoal] = useState(GOALS[0]);
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(true);
  const [board, setBoard] = useState(true);
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const url = NODES.find((n) => n.id === node)?.url;
    if (!url) return setError("That college server is not configured.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${url}/public/join`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          role,
          branch,
          ...(role === "student" ? { sem } : { grad_year: gradYear }),
          cgpa,
          internship,
          projects,
          hackathons,
          skills,
          goal,
          company: role === "alum" ? company.trim() || null : null,
          title: role === "alum" ? title.trim() || null : null,
          open_to_intros: open,
          on_leaderboard: board,
          is_18_plus: adult,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { pid?: string; error?: string };
      if (!res.ok || !body.pid) {
        setBusy(false);
        return setError(body.error === "must_be_18_plus" ? "You need to be 18 or older to join." : body.error === "rate_limited" ? "Too many sign-ups right now. Wait a minute and try again." : "That college server could not save your profile.");
      }
      const reg = await api<{ error?: string }>("/api/fed/register", { method: "POST", json: { pid: body.pid, node } });
      if (!reg.ok) {
        setBusy(false);
        return setError(reg.data.error ?? "Setu could not register you.");
      }
      router.push("/live/mirror");
    } catch {
      setBusy(false);
      setError("Could not reach the college server. Check your connection and try again.");
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-6 px-4 pb-24 pt-6 text-lg">
      <div>
        <p className="text-2xl font-black uppercase tracking-tight">SETU</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">Make your profile in 30 seconds</h1>
        <p className="mt-2 text-[var(--muted)]">It is saved on your college’s own server. Setu keeps only a random ID.</p>
      </div>

      <fieldset>
        <legend className="font-bold">Your college</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {NODES.map((n) => (
            <button key={n.id} type="button" onClick={() => setNode(n.id)} aria-pressed={node === n.id} className={`${chip(node === n.id)} rounded-2xl text-left`}>
              <span className="block text-2xl">{n.label}</span>
              <span className="text-base font-normal opacity-80">{n.sub}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block font-bold">
        Your name
        <input required value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" className={field} />
        <span className="text-base font-normal text-[var(--muted)]">Only your college’s server stores this.</span>
      </label>

      <div className="flex gap-3">
        {(["student", "alum"] as const).map((r) => (
          <button key={r} type="button" onClick={() => setRole(r)} aria-pressed={role === r} className={chip(role === r)}>
            {r === "student" ? "I’m a student" : "I’m an alum"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="font-bold">
          Branch
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className={field}>
            {BRANCHES.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        {role === "student" ? (
          <label className="font-bold">
            Semester
            <select value={sem} onChange={(e) => setSem(Number(e.target.value))} className={field}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="font-bold">
            Graduation year
            <input type="number" min={2010} max={2026} value={gradYear} onChange={(e) => setGradYear(Number(e.target.value))} className={field} />
          </label>
        )}
      </div>

      {role === "alum" && (
        <div className="grid grid-cols-2 gap-4">
          <label className="font-bold">
            Company
            <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={60} className={field} />
          </label>
          <label className="font-bold">
            Role
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} className={field} />
          </label>
        </div>
      )}

      <label className="block font-bold">
        CGPA <span className="font-mono text-2xl">{cgpa.toFixed(1)}</span>
        <input type="range" min={5} max={10} step={0.1} value={cgpa} onChange={(e) => setCgpa(Number(e.target.value))} className="mt-2 h-10 w-full" />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="font-bold">
          Projects
          <input type="number" min={0} max={20} value={projects} onChange={(e) => setProjects(Number(e.target.value))} className={field} />
        </label>
        <label className="font-bold">
          Hackathons
          <input type="number" min={0} max={20} value={hackathons} onChange={(e) => setHackathons(Number(e.target.value))} className={field} />
        </label>
      </div>

      <button type="button" onClick={() => setInternship(!internship)} aria-pressed={internship} className={`${chip(internship)} w-full`}>
        {internship ? "✓ I have done an internship" : "I have not done an internship yet"}
      </button>

      <fieldset>
        <legend className="font-bold">Skills</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SKILLS.map((s) => (
            <button key={s} type="button" aria-pressed={skills.includes(s)} onClick={() => setSkills(skills.includes(s) ? skills.filter((x) => x !== s) : [...skills, s])} className={chip(skills.includes(s))}>
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-bold">What are you aiming for?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <button key={g} type="button" aria-pressed={goal === g} onClick={() => setGoal(g)} className={chip(goal === g)}>
              {g}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex items-start gap-3 font-semibold">
        <input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} className="mt-1.5 size-6" />
        Open to intros
      </label>
      <label className="flex items-start gap-3 font-semibold">
        <input type="checkbox" checked={board} onChange={(e) => setBoard(e.target.checked)} className="mt-1.5 size-6" />
        Show me on the leaderboard
      </label>
      <label className="flex items-start gap-3 font-bold">
        <input type="checkbox" required checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-1.5 size-6" />I am 18 or older
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-[var(--red-tile)]/25 p-4 font-semibold">
          {error}
        </p>
      )}
      <button disabled={busy || !name.trim() || !adult || skills.length === 0} className="w-full rounded-full bg-[var(--ink)] px-6 py-5 text-2xl font-black text-white disabled:opacity-50">
        {busy ? "Saving to your college’s server…" : "Join Setu"}
      </button>
    </form>
  );
}
