import { describe, expect, it } from "vitest";
import { emailMatchesCollege, isAdult, signupSchema } from "./auth";

const now = new Date("2026-10-17T00:00:00Z");

describe("isAdult", () => {
  it("accepts someone who turns 18 today and rejects the day before", () => {
    expect(isAdult("2008-10-17", now)).toBe(true);
    expect(isAdult("2008-10-18", now)).toBe(false);
  });
  it("rejects impossible or malformed dates", () => {
    expect(isAdult("2026-02-30", now)).toBe(false);
    expect(isAdult("garbage", now)).toBe(false);
    expect(isAdult("1800-01-01", now)).toBe(false);
  });
});

describe("emailMatchesCollege", () => {
  it("matches the domain and its subdomains only", () => {
    expect(emailMatchesCollege("a@kiet.edu", ["kiet.edu"])).toBe(true);
    expect(emailMatchesCollege("a@cse.kiet.edu", ["kiet.edu"])).toBe(true);
    expect(emailMatchesCollege("a@evilkiet.edu", ["kiet.edu"])).toBe(false);
    expect(emailMatchesCollege("a@gmail.com", ["kiet.edu"])).toBe(false);
  });
});

describe("signupSchema", () => {
  const valid = { fullName: "A", email: "A@KIET.EDU", password: "longenough1", role: "student", branch: "CSE", batch: "2028", dob: "2005-01-01" };
  it("normalises a valid signup", () => {
    const r = signupSchema.safeParse(valid);
    expect(r.success && r.data.email).toBe("a@kiet.edu");
  });
  it("rejects placement role, short password and under-18", () => {
    const r = signupSchema.safeParse({ ...valid, role: "placement", password: "x", dob: "2015-01-01" });
    expect(r.success).toBe(false);
  });
});
