import type { RungSlug } from "./rungs";

// The five ways a parent self-selects. Four are stage bands; the last is a
// focus, and it is how a 14 year old footballer reaches Team Sport Speed
// instead of being told they are a Junior Academy athlete.
//
// No two choices may overlap. A parent who sees two buttons that both look
// correct has been handed the decision this whole page exists to remove:
//   - Year 6 sits in both Emerging Athletes and Junior Academy. It resolves to
//     Emerging Athletes, and that reveal names the Junior Academy invitation.
//   - Junior Academy runs to Year 10, not Year 9, so Years 10 and 11 do not
//     fall in a gap before Senior Squad's 16.
export type FinderChoiceId =
  | "prep-2"
  | "years-3-6"
  | "years-7-10"
  | "age-16-plus"
  | "team-sport";

export interface FinderChoice {
  id: FinderChoiceId;
  label: string;
  note: string;
  rung: RungSlug;
}

export const FINDER_CHOICES: FinderChoice[] = [
  { id: "prep-2", label: "Prep to Year 2", note: "About 5 to 7", rung: "foundation" },
  { id: "years-3-6", label: "Years 3 to 6", note: "About 8 to 11", rung: "emerging-athletes" },
  { id: "years-7-10", label: "Years 7 to 10", note: "About 12 to 15", rung: "junior-academy" },
  { id: "age-16-plus", label: "Aged 16 and over", note: "Senior athletes", rung: "senior-squad" },
  {
    id: "team-sport",
    label: "Plays a team sport",
    note: "13 and over, wants to get faster",
    rung: "team-sport-speed",
  },
];

export function resolveRung(id: string): RungSlug | null {
  return FINDER_CHOICES.find((c) => c.id === id)?.rung ?? null;
}
