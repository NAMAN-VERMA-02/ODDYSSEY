export type DashboardState = {
  role: string;
  /** Semesters shared in the journey. */
  semesters: number;
  sent: number;
  /** Requests I sent that went past the first question. */
  climbed: boolean;
  /** Requests from others waiting for my answer. */
  waitingOnMe: number;
  succeeded: boolean;
  helpOwed: number;
};

export type NextStep = { title: string; body: string; cta: string; href: string };

/** The single most useful thing to do next, in priority order. */
export function nextStep(s: DashboardState): NextStep {
  if (s.role === "placement") {
    return { title: "See how your college is doing", body: "Engagement, placements and help paid forward, all as counts.", cta: "Open the college dashboard", href: "/college" };
  }
  if (s.semesters === 0) {
    return { title: "Share your journey first", body: "Marks as ranges, a goal and each semester so far. It takes about five minutes and unlocks everything else.", cta: "Start your journey", href: "/onboarding" };
  }
  if (s.waitingOnMe > 0) {
    return {
      title: s.waitingOnMe === 1 ? "One student is waiting on you" : `${s.waitingOnMe} students are waiting on you`,
      body: "A quick answer, or a quiet no, helps them more than silence.",
      cta: "Open your requests",
      href: "/requests",
    };
  }
  if (s.succeeded && s.helpOwed > 0) {
    return { title: `Pay it forward: ${s.helpOwed} ${s.helpOwed === 1 ? "answer" : "answers"} to give`, body: "Three juniors stand where you once stood. One answer each.", cta: "Help a junior", href: "/payitforward" };
  }
  if (s.sent === 0) {
    return { title: "Meet the seniors who were where you are", body: "See who stood in your exact position and where they went next.", cta: "See your matches", href: "/matches" };
  }
  if (!s.climbed) {
    return { title: "Keep the conversation going", body: "Check your requests. A call, then a small task, builds the trust a referral needs.", cta: "Open your requests", href: "/requests" };
  }
  if (!s.succeeded) {
    return { title: "Landed something?", body: "Tell us, and help three juniors the way you were helped.", cta: "Share your success", href: "/payitforward" };
  }
  return { title: "You are all caught up", body: "Look for new matches as more seniors share their journeys.", cta: "See your matches", href: "/matches" };
}

export type ChecklistItem = { label: string; done: boolean; href: string };

export function checklist(s: DashboardState): ChecklistItem[] {
  return [
    { label: "Share your journey", done: s.semesters > 0, href: "/onboarding" },
    { label: "Meet your matches", done: s.sent > 0, href: "/matches" },
    { label: "Send your first question", done: s.sent > 0, href: "/matches" },
    { label: "Climb the trust ladder", done: s.climbed, href: "/requests" },
    { label: "Pay it forward", done: s.succeeded && s.helpOwed === 0, href: "/payitforward" },
  ];
}

/** Branches typed as short codes (cse, it) read better in capitals. */
export function formatBranch(branch: string): string {
  const b = branch.trim();
  return b.length <= 4 ? b.toUpperCase() : b;
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}
