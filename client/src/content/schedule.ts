// Authoritative source approved by Alistair: power2adapt.coach/where-we-train.
// Tuesday 4:30pm Hurdle Squad override confirmed by Alistair on 1 November 2026.
// Reviewed 1 November 2026. Keep this data in sync when that schedule changes.
export interface TrainingSession {
  day: string; time: string; venue: string; label: string; programs: string[];
  studentsOnly?: string; waitlist?: boolean; accessNote?: string;
}
export const TRAINING_SCHEDULE: TrainingSession[] = [
  { day: "Monday", time: "3:30pm", venue: "Peninsula Grammar", label: "Foundation & Emerging Athletes", programs: ["foundation", "emerging-athletes"], studentsOnly: "Peninsula Grammar" },
  { day: "Monday", time: "5:30pm to 7:00pm", venue: "Ballam Park, Frankston", label: "Junior Academy & Senior Squad", programs: ["junior-academy", "senior-squad"] },
  { day: "Tuesday", time: "4:30pm", venue: "Ballam Park, Frankston", label: "Hurdle Squad", programs: ["hurdle-squad"], accessNote: "Discuss placement with Coach Al" },
  { day: "Tuesday", time: "5:30pm to 7:00pm", venue: "Ballam Park, Frankston", label: "Junior Academy & Senior Squad", programs: ["junior-academy", "senior-squad"] },
  { day: "Wednesday", time: "4:30pm", venue: "Mornington Athletics Track", label: "Foundation & Emerging Athletes", programs: ["foundation", "emerging-athletes"] },
  { day: "Wednesday", time: "5:30pm", venue: "Mornington Athletics Track", label: "Team Sport Speed, Junior Academy & Senior Squad", programs: ["team-sport-speed", "junior-academy", "senior-squad"] },
  { day: "Thursday", time: "3:30pm", venue: "Toorak College", label: "Foundation & Emerging Athletes", programs: ["foundation", "emerging-athletes"], studentsOnly: "Toorak College" },
  { day: "Thursday", time: "4:30pm", venue: "Ballam Park, Frankston", label: "Foundation & Emerging Athletes", programs: ["foundation", "emerging-athletes"] },
  { day: "Thursday", time: "5:30pm to 7:00pm", venue: "Ballam Park, Frankston", label: "Junior Academy & Senior Squad", programs: ["junior-academy", "senior-squad"] },
  { day: "Friday", time: "4:30pm", venue: "Mornington Athletics Track", label: "Team Sport Speed, Junior Academy & Senior Squad", programs: ["team-sport-speed", "junior-academy", "senior-squad"] },
  { day: "Friday", time: "5:30pm", venue: "Mornington Athletics Track", label: "Team Sport Speed, Junior Academy & Senior Squad", programs: ["team-sport-speed", "junior-academy", "senior-squad"] },
];
export function sessionsFor(program: string) {
  return TRAINING_SCHEDULE.filter(s => s.programs.includes(program) && !s.waitlist)
    .map(({ venue, day, time }) => ({ venue, day, time }));
}
