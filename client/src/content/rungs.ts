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
  waitlist?: boolean; // true if this class is waitlist-only, not an open intake
}

// Fields every hub card needs, whether the rung has a full detail page or not.
interface RungCard {
  slug: RungSlug;
  name: string;
  ageBand: string;
  teaser: string;      // one line, used on the /programs hub card
  enrolSlug: string;    // where the hub card links
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
  "Individual programming, so your athlete knows what they are working on",
  "Testing in weeks 1, 5 and 10, so progress is measured not guessed",
  "My Athletic Journey app access for the full term",
];

const TERM_PRICE_NOTE =
  "$30 + GST per class, for the number of weeks in your school's term. A 10 week term is $300 + GST, a 9 week term is $270 + GST. Term length varies by school (Toorak College and Peninsula Grammar run 9 week terms), so check the exact number of weeks at checkout.";

type FullRungSlug = "foundation" | "emerging-athletes" | "team-sport-speed";

export const RUNGS: Record<RungSlug, RungContent | RungSummary> = {
  foundation: {
    slug: "foundation",
    name: "Foundation",
    ageBand: "Ages 7 and under",
    teaser: "First steps. Running, jumping and landing done properly, before anything else is added.",
    about: [
      "Foundation is where young athletes learn to move well before they learn to move fast.",
      "Sessions build the basics that everything later sits on: how to run tall, how to land softly, how to change direction without falling over. It is playful on purpose, because that is how children this age learn fastest.",
    ],
    forWho: [
      "Your child is 7 or under",
      "They run with an action that looks awkward, stiff or heavy on the heels",
      "They love running around but have never been taught how",
      "You want them to enjoy sport, not specialise in one",
    ],
    notForWho:
      "If your athlete is 8 or older, Emerging Athletes is the better fit. It moves faster and asks more of them.",
    session: [
      "Arrive and a coach greets your child by name",
      "A game-based warm up that is really a movement screen in disguise",
      "One skill for the session, taught with a single cue so it sticks",
      "Games and relays that make them repeat that skill without noticing",
      "A short finish, a win named out loud, and back to you",
    ],
    included: COMMON_INCLUDED,
    logistics: [
      "One session per week, during the school term",
      "Wear runners and clothes they can move in. Bring a drink bottle",
      "Drop off and pick up at the session venue, coaches stay until every child is collected",
      "Wet weather: we run unless it is unsafe, and you will hear from us before the session if it is called off",
    ],
    price: "$30 + GST per class",
    priceNote: TERM_PRICE_NOTE,
    ctaLabel: "Choose your class",
    enrolSlug: "foundation",
    classes: [
      { slug: "pg-foundation-mon", venue: "Peninsula Grammar", day: "Monday", time: "3:30pm" },
      { slug: "toorak-foundation-thu", venue: "Toorak College", day: "Thursday", time: "3:30pm" },
      { slug: "toorak-foundation-tue", venue: "Toorak College", day: "Tuesday", time: "3:30pm", waitlist: true },
    ],
  },

  "emerging-athletes": {
    slug: "emerging-athletes",
    name: "Emerging Athletes",
    ageBand: "Ages 8 to 11",
    teaser: "The stage where technique starts to stick and speed starts to show.",
    about: [
      "Emerging Athletes is where movement becomes technique.",
      "Athletes work on running mechanics, acceleration, agility and the strength to hold a position under speed. They are old enough to understand why a change matters, so sessions explain the what and the why, not just the drill.",
    ],
    forWho: [
      "Your athlete is 8 to 11, roughly grades 3 to 6",
      "They play a sport on the weekend and you can see speed is holding them back",
      "Their arms look awkward, or they seem to run on their heels",
      "They are ready to be corrected and to work at something over a term",
    ],
    notForWho:
      "If your athlete is 12 or older, Junior Academy is the right level. If they are 7 or under, start at Foundation.",
    session: [
      "Warm up as a group, with the coach watching how each athlete moves that day",
      "Technical block: one running or acceleration cue, drilled properly",
      "Speed and agility work, full effort with real rest between efforts",
      "Strength and landing work suited to their age",
      "Cool down, and each athlete leaves knowing the one thing to think about next week",
    ],
    included: COMMON_INCLUDED,
    logistics: [
      "One session per week, during the school term",
      "Runners and training clothes. Bring a drink bottle",
      "Sessions run at your athlete's school venue or at the Mornington track, depending on the group",
      "Wet weather: we run unless it is unsafe, and you will hear from us before the session if it is called off",
    ],
    price: "$30 + GST per class",
    priceNote: TERM_PRICE_NOTE,
    ctaLabel: "Choose your class",
    enrolSlug: "emerging-athletes",
    classes: [
      { slug: "pg-emerging-mon", venue: "Peninsula Grammar", day: "Monday", time: "3:30pm" },
    ],
  },

  "junior-academy": {
    slug: "junior-academy",
    name: "Junior Academy",
    ageBand: "Ages 12 to 16",
    teaser: "Multi-sport athletic development for athletes who have decided they are serious.",
    enrolSlug: "junior-academy",
  },

  "senior-squad": {
    slug: "senior-squad",
    name: "Senior Squad",
    ageBand: "Ages 16 and over",
    teaser: "Competition-ready. Speed, strength and the mental side of performing on the day.",
    enrolSlug: "senior-squad",
  },

  "team-sport-speed": {
    slug: "team-sport-speed",
    name: "Team Sport Speed",
    ageBand: "Ages 13 and over",
    teaser: "For footballers, netballers and basketballers who want the gap to show up on game day.",
    about: [
      "Team Sport Speed is speed work built for athletes whose sport is not athletics.",
      "The work is acceleration, change of direction and repeat effort, the three things that decide contests in team sport. It sits alongside your athlete's club training rather than replacing it.",
    ],
    forWho: [
      "Your athlete is 13 or over and plays a team sport",
      "They are quick over a short distance but fade on repeat efforts",
      "They lose contests off the mark rather than over distance",
      "Their club trains skills but nobody coaches how they run",
    ],
    notForWho:
      "If they want a full athletic development program rather than speed specifically, Junior Academy or Senior Squad will serve them better.",
    session: [
      "Warm up built around the positions their sport puts them in",
      "Acceleration work, full effort, real rest",
      "Change of direction and deceleration, the part most players never train",
      "Repeat effort conditioning against their sport's work-to-rest ratio",
      "Cool down and one cue to take to training that week",
    ],
    included: COMMON_INCLUDED,
    logistics: [
      "One session per week, Friday afternoons at the Mornington track",
      "Two group times, 4:30 and 5:30",
      "Runners and training clothes. Bring a drink bottle",
      "Wet weather: we run unless it is unsafe, and you will hear from us before the session if it is called off",
    ],
    price: "$30 + GST per class",
    priceNote: TERM_PRICE_NOTE,
    ctaLabel: "Choose your class",
    enrolSlug: "team-sport-speed",
    classes: [
      { slug: "team-speed-430", venue: "Mornington track", day: "Friday", time: "4:30pm" },
      { slug: "team-speed-530", venue: "Mornington track", day: "Friday", time: "5:30pm" },
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
