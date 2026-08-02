export type RungSlug =
  | "foundation"
  | "emerging-athletes"
  | "junior-academy"
  | "senior-squad"
  | "team-sport-speed"
  | "high-performance";

export interface ClassOffering {
  slug: string;       // the /enrol/{slug} this class links to, resolves via SportsBiz
  venue: string;
  day: string;
  time: string;
  waitlist?: boolean;     // true if this class is waitlist-only, not an open intake
  studentsOnly?: string;  // school name when the class is only open to that school's students
}

export interface SessionTime {
  venue: string;
  day: string;
  time: string;
}

// Junior Academy and Senior Squad run the same six sessions, all coached by
// Alistair. The Mornington ones are shared with Team Sport Speed: athletes
// train alongside each other on their own programming.
const APPLICATION_SESSIONS: SessionTime[] = [
  { venue: "Ballam Park, Frankston", day: "Monday", time: "5:30pm to 7:00pm" },
  { venue: "Ballam Park, Frankston", day: "Tuesday", time: "5:30pm to 7:00pm" },
  { venue: "Ballam Park, Frankston", day: "Thursday", time: "5:30pm to 7:00pm" },
  { venue: "Mornington Athletics Track", day: "Wednesday", time: "5:30pm" },
  { venue: "Mornington Athletics Track", day: "Friday", time: "4:30pm" },
  { venue: "Mornington Athletics Track", day: "Friday", time: "5:30pm" },
];

// Fields every hub card needs, whether the rung has a full detail page or not.
interface RungCard {
  slug: RungSlug;
  name: string;
  ageBand: string;
  teaser: string;      // one line, used on the /programs hub card
  enrolSlug: string;    // where the hub card links
  sessions?: SessionTime[];   // by-application programs list times rather than enrol links
  applyUrl?: string;          // where the Apply button goes, for by-application programs
}

export interface RungContent extends RungCard {
  about: string[];         // section 1: what this class is about
  forWho: string[];        // section 2: who it is for
  notForWho: string;       // section 2b: who it is not for
  session: string[];       // section 3: what a session looks like
  included: string[];      // section 4: what they get
  logistics: string[];     // section 5: parent logistics
  price: string;           // section 6
  priceNote: string;
  ctaLabel: string;        // section 7
  classes: ClassOffering[]; // section 7: the classes a parent can enrol into
}

// junior-academy, senior-squad and high-performance render through their own
// hand-built pages (by application), not RungPage. Only the hub card fields
// are consumed from here, so that is all this shape carries. This prevents
// unreachable prose from drifting out of date unnoticed (see Finding 3).
export type RungSummary = RungCard;

const COMMON_INCLUDED = [
  "Individual programming, so your athlete knows exactly what they are working on",
  "Testing in weeks 1, 5 and 10, so progress is a number you can see, not a feeling",
  "My Athletic Journey app access for the whole term",
];

const TERM_PRICE_NOTE =
  "$30 + GST per class, for the number of weeks in your school's term. A 10 week term is $300 + GST, a 9 week term is $270 + GST. Term length varies by school (Toorak College and Peninsula Grammar run 9 week terms), so check the exact number of weeks at checkout.";

type FullRungSlug = "foundation" | "emerging-athletes" | "team-sport-speed";

export const RUNGS: Record<RungSlug, RungContent | RungSummary> = {
  foundation: {
    slug: "foundation",
    name: "Foundation",
    ageBand: "Prep to Year 2",
    teaser: "Where we start building the athletic movement engine everything else runs on.",
    about: [
      "Foundation is where we begin building the engine. Running, jumping, landing, changing direction, balance, coordination. These are the movement skills every sport gets bolted onto later, and they are learned far more easily at six than at sixteen.",
      "Kids this age are not too young to train. They are exactly the right age to learn. Get this part right in Prep to Year 2 and by the time they pick a sport, they already move well, whichever one they pick. It is playful on purpose, because that is how five to seven year olds learn fastest.",
    ],
    forWho: [
      "Your child is in Prep, Year 1 or Year 2",
      "You want them building real movement skills early, rather than specialising in one sport",
      "They have plenty of energy and you would like it pointed somewhere useful",
      "You are thinking about the next ten years, not this weekend's game",
    ],
    notForWho:
      "If your athlete is in Year 3 or above, start them at Emerging Athletes instead. It moves quicker, asks more of them, and they will get more out of it.",
    session: [
      "We greet your child by name. Every coach knows every kid in the group",
      "A game based warm up, which is really me watching how they move without them knowing it",
      "One movement skill for the session, taught with a single cue so it actually sticks",
      "Games and relays that get them repeating that skill fifty times without noticing",
      "A finish, one win named out loud, and back to you",
    ],
    included: COMMON_INCLUDED,
    logistics: [
      "One session a week, during the school term",
      "Runners and clothes they can move in, plus a drink bottle",
      "Drop off and pick up at the venue. Our coaches stay until every child is collected",
      "Wet weather: we train unless it is unsafe, and you will hear from me before the session if it is called off",
    ],
    price: "$30 + GST per class",
    priceNote: TERM_PRICE_NOTE,
    ctaLabel: "Choose your class",
    enrolSlug: "foundation",
    classes: [
      { slug: "pg-foundation-mon", venue: "Peninsula Grammar", day: "Monday", time: "3:30pm", studentsOnly: "Peninsula Grammar" },
      { slug: "toorak-foundation-thu", venue: "Toorak College", day: "Thursday", time: "3:30pm", studentsOnly: "Toorak College" },
      { slug: "toorak-foundation-tue", venue: "Toorak College", day: "Tuesday", time: "3:30pm", waitlist: true, studentsOnly: "Toorak College" },
      { slug: "ballam-foundation-thu", venue: "Ballam Park", day: "Thursday", time: "4:30pm" },
      { slug: "ballam-foundation-tue", venue: "Ballam Park", day: "Tuesday", time: "4:30pm", waitlist: true },
      { slug: "mornington-foundation-wed", venue: "Mornington Athletics Track", day: "Wednesday", time: "4:30pm" },
    ],
  },

  "emerging-athletes": {
    slug: "emerging-athletes",
    name: "Emerging Athletes",
    ageBand: "Years 3 to 6",
    teaser: "The age where technique starts to stick, and speed starts showing up on Saturday.",
    about: [
      "This is the age where it all starts to land. They are old enough to understand why a change matters, so I tell them the why, not just the drill. That is the difference between a kid who copies a drill and a kid who owns it.",
      "The engine we started building at Foundation now gets refined: running mechanics, acceleration, agility, and the strength to hold a good position when they are tired. Most of these athletes play something on the weekend, and the whole point is that the work turns up there on Saturday.",
    ],
    forWho: [
      "Your athlete is in Years 3 to 6",
      "They play sport on the weekend and you want the athleticism underneath it developed properly",
      "They are ready to be corrected, and to work at something across a whole term",
      "You would rather they built a base now than chase a quick fix later",
    ],
    notForWho:
      "If they are in Year 7 or above, Junior Academy is the right level for them. Year 2 or below, start at Foundation. One exception worth knowing: Junior Academy takes athletes from Year 6, so if yours moves through the competencies quickly I will invite them up early rather than hold them at their year level.",
    session: [
      "Warm up as a group while I watch how each athlete is moving that day",
      "One technical cue for the session, drilled properly, rather than six drilled badly",
      "Speed and agility at full effort, with real rest in between. Tired sprinting is just running",
      "Strength and landing work suited to their stage, not their age",
      "Cool down, and every athlete leaves knowing the one thing to think about this week",
    ],
    included: COMMON_INCLUDED,
    logistics: [
      "One session a week, during the school term",
      "Runners and training clothes, plus a drink bottle",
      "Sessions run at your athlete's school or at the Mornington track, depending on the group",
      "Wet weather: we train unless it is unsafe, and you will hear from me before the session if it is called off",
    ],
    price: "$30 + GST per class",
    priceNote: TERM_PRICE_NOTE,
    ctaLabel: "Choose your class",
    enrolSlug: "emerging-athletes",
    classes: [
      { slug: "pg-emerging-mon", venue: "Peninsula Grammar", day: "Monday", time: "3:30pm", studentsOnly: "Peninsula Grammar" },
      { slug: "toorak-emerging-thu", venue: "Toorak College", day: "Thursday", time: "3:30pm", studentsOnly: "Toorak College" },
      { slug: "ballam-emerging-thu", venue: "Ballam Park", day: "Thursday", time: "4:30pm" },
      { slug: "ballam-emerging-tue", venue: "Ballam Park", day: "Tuesday", time: "4:30pm", waitlist: true },
      { slug: "mornington-emerging-wed", venue: "Mornington Athletics Track", day: "Wednesday", time: "4:30pm" },
    ],
  },

  "junior-academy": {
    slug: "junior-academy",
    name: "Junior Academy",
    ageBand: "Years 6 to 9, or by invitation",
    teaser: "Multi-sport athletic development for athletes who have decided they are serious.",
    enrolSlug: "junior-academy",
    sessions: APPLICATION_SESSIONS,
    applyUrl: "/junior-academy-application.html",
  },

  "senior-squad": {
    slug: "senior-squad",
    name: "Senior Squad",
    ageBand: "Ages 16 and over",
    teaser: "Competition-ready. Speed, strength and the mental side of performing on the day.",
    enrolSlug: "senior-squad",
    sessions: APPLICATION_SESSIONS,
    applyUrl: "/senior-squad-application.html",
  },

  "team-sport-speed": {
    slug: "team-sport-speed",
    name: "Team Sport Speed",
    ageBand: "Ages 13 and over",
    teaser: "For footballers, soccer players, netballers and basketballers who want the gap to show on game day.",
    about: [
      "Their club coach trains the skills. We improve their speed, agility and speed endurance, so they can produce repeat efforts in line with the demands of the game.",
      "That is the part that usually goes untrained, and it is the part that decides contests: who gets there first, and who is still getting there in the last quarter. It sits alongside club training rather than replacing it. I coach sprinters at Australian Athletics Level 4, and this is that same work, pointed at footballers, soccer players, netballers and basketballers.",
    ],
    forWho: [
      "Your athlete is 13 or over and plays a team sport",
      "They are quick over ten metres but struggle with repeat efforts",
      "They lose contests off the mark rather than over distance",
      "Their club trains skills, and nobody has ever coached how they run",
    ],
    notForWho:
      "If they want a full athletic development program rather than speed specifically, Junior Academy or Senior Squad will serve them better.",
    session: [
      "Warm up built around the positions their sport actually puts them in",
      "Acceleration at full effort, with real rest between reps",
      "Change of direction and deceleration, the part almost nobody trains and the part that decides contests",
      "Speed endurance work, matched to the work to rest ratio their game actually demands",
      "Cool down, and one cue to take into club training that week",
    ],
    included: COMMON_INCLUDED,
    logistics: [
      "One session a week at the Mornington track",
      "Three groups to choose from: Wednesday 5:30, Friday 4:30 and Friday 5:30",
      "You train alongside Junior Academy athletes, on programming built for your sport",
      "Runners and training clothes, plus a drink bottle",
      "Wet weather: we train unless it is unsafe, and you will hear from me before the session if it is called off",
    ],
    price: "$30 + GST per class",
    priceNote: TERM_PRICE_NOTE,
    ctaLabel: "Choose your class",
    enrolSlug: "team-sport-speed",
    classes: [
      { slug: "team-speed-wed-530", venue: "Mornington track", day: "Wednesday", time: "5:30pm" },
      { slug: "team-speed-fri-430", venue: "Mornington track", day: "Friday", time: "4:30pm" },
      { slug: "team-speed-fri-530", venue: "Mornington track", day: "Friday", time: "5:30pm" },
    ],
  },

  "high-performance": {
    slug: "high-performance",
    name: "High Performance",
    ageBand: "By invitation",
    teaser: "One to one coaching with elite testing and physio partnership.",
    enrolSlug: "high-performance",
  },
};

// The three rungs that actually render through RungPage (see Finding 3).
// Typed as full RungContent so their pages don't need to narrow the union.
export const RUNG_PAGES: Record<FullRungSlug, RungContent> = {
  foundation: RUNGS.foundation as RungContent,
  "emerging-athletes": RUNGS["emerging-athletes"] as RungContent,
  "team-sport-speed": RUNGS["team-sport-speed"] as RungContent,
};

export const RUNG_ORDER: RungSlug[] = [
  "foundation",
  "emerging-athletes",
  "junior-academy",
  "senior-squad",
  "team-sport-speed",
];

// The two pages render sessions grouped by venue; the finder renders them flat.
export const SESSION_VENUES: { venue: string; note: string; times: string[] }[] = [
  {
    venue: "Ballam Park, Frankston",
    note: "5:30pm to 7:00pm",
    times: ["Monday", "Tuesday", "Thursday"],
  },
  {
    venue: "Mornington Athletics Track",
    note: "Track sessions, shared with Team Sport Speed",
    times: ["Wednesday 5:30pm", "Friday 4:30pm", "Friday 5:30pm"],
  },
];

export function RUNG_BY_SLUG(slug: RungSlug): RungContent | RungSummary {
  return RUNGS[slug];
}
