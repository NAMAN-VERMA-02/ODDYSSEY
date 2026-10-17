/** Result of the college_stats() database function. Counts only. */
export type CollegeStats = {
  members: Record<string, number>;
  students: number;
  journeys_shared: number;
  students_asked: number;
  students_replied: number;
  asks_total: number;
  ladder: { question: number; call: number; task: number; referral: number };
  placed: number;
  top_companies: { company: string; count: number }[];
  helps: number;
  helpers: number;
  help_owed_open: number;
};

/** Whole-number percentage; 0 when there is nothing to divide by. */
export function pct(part: number, whole: number): number {
  if (!whole || whole <= 0) return 0;
  return Math.round((Math.min(part, whole) / whole) * 100);
}
