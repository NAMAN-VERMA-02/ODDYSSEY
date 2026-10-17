import { describe, expect, it } from "vitest";
import { checklist, firstName, formatBranch, nextStep, type DashboardState } from "./next-step";

const base: DashboardState = { role: "student", semesters: 3, sent: 0, climbed: false, waitingOnMe: 0, succeeded: false, helpOwed: 0 };

describe("nextStep", () => {
  it("starts with the journey", () => {
    expect(nextStep({ ...base, semesters: 0 }).href).toBe("/onboarding");
  });
  it("puts people waiting on you first", () => {
    const s = nextStep({ ...base, waitingOnMe: 2, sent: 1 });
    expect(s.href).toBe("/requests");
    expect(s.title).toMatch(/2 students/);
  });
  it("sends a new student to their matches, then keeps the conversation going", () => {
    expect(nextStep(base).href).toBe("/matches");
    expect(nextStep({ ...base, sent: 1 }).href).toBe("/requests");
  });
  it("asks successes to pay it forward", () => {
    expect(nextStep({ ...base, sent: 1, succeeded: true, helpOwed: 3 }).href).toBe("/payitforward");
  });
  it("sends placement accounts to the college dashboard", () => {
    expect(nextStep({ ...base, role: "placement" }).href).toBe("/college");
  });
});

describe("checklist", () => {
  it("ticks off steps as they happen", () => {
    const items = checklist({ ...base, sent: 1, climbed: true });
    expect(items.map((i) => i.done)).toEqual([true, true, true, true, false]);
  });
});

describe("formatting", () => {
  it("capitalises short branch codes and keeps long names", () => {
    expect(formatBranch("cs")).toBe("CS");
    expect(formatBranch("Mechanical")).toBe("Mechanical");
  });
  it("takes the first name", () => {
    expect(firstName("Naman Verma")).toBe("Naman");
    expect(firstName("nmn")).toBe("nmn");
  });
});
