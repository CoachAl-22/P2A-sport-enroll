import type { RungSlug } from "./rungs";

// School stages guide placement. Year 6 overlaps the school-based Emerging
// Athletes program and Junior Academy; Coach Al helps families choose.
// Year 10+ athletes can explore Senior Squad and discuss individual placement.
export type FinderChoiceId =
  | "prep-2"
  | "years-3-6"
  | "years-6-9"
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
  { id: "years-3-6", label: "Years 3 to 6", note: "School programs; Year 6 can also explore Junior Academy", rung: "emerging-athletes" },
  { id: "years-6-9", label: "Years 6 to 9", note: "Individual exceptions considered", rung: "junior-academy" },
  { id: "age-16-plus", label: "Year 10 and above", note: "Explore Senior Squad; placement with Coach Al", rung: "senior-squad" },
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
