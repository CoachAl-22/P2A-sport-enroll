import { z } from "zod";

export const draftObservationSchema = z.object({
  athlete_id: z.string().nullable().optional(),
  athlete_name: z.string().trim().min(1).max(200),
  skill: z.string().trim().min(1).max(200),
  working_well: z.string().trim().max(2000),
  to_improve: z.string().trim().max(2000),
  suggested_cue: z.string().trim().max(2000),
  parent_message: z.string().trim().max(2000),
});

export const confirmObservationSchema = draftObservationSchema.extend({
  clientNoteId: z.string().uuid(),
  athlete_id: z.string().uuid(),
  send_to_parent: z.boolean(),
}).refine(o => !o.send_to_parent || o.parent_message.length > 0, {
  message: "A parent message is required when Send to parent is on",
  path: ["parent_message"],
});

export type RosterAthlete = { id: string; fullName: string; program?: string | null };
const normalize = (s: string) => s.toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").trim().replace(/\s+/g, " ");

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = old;
    }
  }
  return 1 - row[b.length] / Math.max(a.length, b.length);
}

/** Never trust a model-supplied ID; uncertain or duplicate names require human selection. */
export function matchRosterName(name: string, roster: RosterAthlete[]): RosterAthlete | null {
  const mentioned = normalize(name);
  const tokens = mentioned.split(" ");
  const scores = roster.map(a => {
    const full = normalize(a.fullName);
    const parts = full.split(" ");
    let score = similarity(mentioned, full);
    if (tokens.length === 1 && parts.includes(mentioned)) score = 1;
    if (tokens.length > 1 && parts[0] === tokens[0]) {
      score = Math.max(score, 0.35 + 0.65 * similarity(tokens.slice(1).join(" "), parts.slice(1).join(" ")));
    }
    return { athlete: a, score };
  }).sort((a, b) => b.score - a.score);
  const best = scores[0];
  if (!best || best.score < 0.8 || (scores[1] && best.score - scores[1].score < 0.1)) return null;
  return best.athlete;
}

export function resolveDrafts(raw: unknown, roster: RosterAthlete[]) {
  return z.array(draftObservationSchema).min(1).max(20).parse(raw).map(draft => {
    const athlete = matchRosterName(draft.athlete_name, roster);
    return { ...draft, athlete_id: athlete?.id ?? null, matched: !!athlete };
  });
}

export function parentNoteProjection(note: any) {
  return {
    id: note.id, skill: note.skill, parent_message: note.parentMessage,
    coach_name: note.coachName, created_at: note.createdAt,
  };
}
