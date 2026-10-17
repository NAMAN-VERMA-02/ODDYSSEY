/**
 * Edges that cross colleges, by story key. The hub resolves the keys to pseudonymous ids on reset.
 * (Edges inside a college come from that college's own node.)
 */
export const STORY_CROSS_EDGES: { a: string; b: string; prior: number }[] = [
  { a: "aman", b: "karan", prior: 0.3 },
  { a: "rohan", b: "vikram", prior: 0.8 },
  { a: "priya", b: "meera", prior: 0.6 },
];

/** Public-company colleagues across colleges get a modest edge; story people are never touched. */
export const COLLEAGUE_PRIOR_RANGE = { min: 0.45, max: 0.65 } as const;
