// Fixed, code-maintained class presets. Selecting one in the Add Class admin
// form auto-fills the canonical name, website-matching description, sport type,
// age range, per-session rate, and per-week default. pricePerSession is ex-GST;
// the system adds 10% GST at checkout ($30 -> $33/session).
export interface ClassPreset {
  key: string;
  label: string;
  name: string;
  description: string;
  sportType: string;
  minAge: number;
  maxAge: number;
  pricePerSession: string;
  perWeekEnabled: boolean;
}

export const CLASS_PRESETS: ClassPreset[] = [
  {
    key: "foundation",
    label: "Foundation (Prep–Year 2)",
    name: "Foundation Class",
    description: "Movement skills, games and confidence in a fun, welcoming environment. Designed for Prep–Year 2 athletes aged 5–8.",
    sportType: "foundation_prep_year2",
    minAge: 5, maxAge: 8, pricePerSession: "30.00", perWeekEnabled: true,
  },
  {
    key: "emerging",
    label: "Emerging Athletes (Year 3–6)",
    name: "Emerging Athletes",
    description: "Running, jumping, throwing and sport-specific athletic development for Year 3–6 athletes aged 8–12.",
    sportType: "emerging_year3_6",
    minAge: 8, maxAge: 12, pricePerSession: "30.00", perWeekEnabled: true,
  },
  {
    key: "team_sport_speed",
    label: "Team Sport Speed (12+)",
    name: "Team Sport Speed",
    description: "Speed, agility and athleticism training for team sport athletes. Ideal for AFL, soccer, basketball, netball and more.",
    sportType: "team_sport_speed",
    minAge: 12, maxAge: 99, pricePerSession: "30.00", perWeekEnabled: false,
  },
  {
    key: "junior_academy",
    label: "Junior Academy (12–16)",
    name: "Junior Academy",
    description: "The Power2ADAPT Junior Academy is an in-person athletic development programme for young athletes aged 12–16, designed for multi-sport athletes who want to build the physical foundations that make them better at every sport they play — not just one. Sessions run up to twice per week and focus on movement quality, speed, strength, and athletic confidence — skills that transfer across all sports and carry athletes forward as they grow.",
    sportType: "junior_development",
    minAge: 12, maxAge: 16, pricePerSession: "30.00", perWeekEnabled: false,
  },
  {
    key: "senior_squad",
    label: "Senior Squad (16+)",
    name: "Senior Squad",
    description: "High-level squad training for committed senior athletes aged 16+. Structured sessions focused on performance, competition preparation and athlete development.",
    sportType: "senior_squad",
    minAge: 16, maxAge: 99, pricePerSession: "30.00", perWeekEnabled: false,
  },
  {
    key: "elite_hp",
    label: "Elite HP Squad (16+)",
    name: "Elite HP Squad",
    description: "Next-level performance training for elite athletes. By application only. Advanced programming, individualised coaching and competition-ready conditioning.",
    sportType: "empowered_athlete_program",
    minAge: 16, maxAge: 99, pricePerSession: "30.00", perWeekEnabled: false,
  },
];
