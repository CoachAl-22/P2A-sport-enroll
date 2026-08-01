export type RungSlug =
  | "foundation"
  | "emerging-athletes"
  | "junior-academy"
  | "senior-squad"
  | "team-sport-speed"
  | "high-performance";

export interface RungContent {
  slug: RungSlug;
  name: string;
  ageBand: string;
  teaser: string;          // one line, used on the /programs hub card
  about: string[];         // section 1: what this class is about
  forWho: string[];        // section 2: who it is for
  notForWho: string;       // section 2b: who it is not for
  session: string[];       // section 3: what a session looks like
  included: string[];      // section 4: what they get
  logistics: string[];     // section 5: parent logistics
  price: string;           // section 6
  priceNote: string;
  ctaLabel: string;        // section 7
  enrolSlug: string;       // the /enrol/{slug} this page's CTA points at
}

const COMMON_INCLUDED = [
  "Individual programming, so your athlete knows what they are working on",
  "Testing in weeks 1, 5 and 10, so progress is measured not guessed",
  "My Athletic Journey app access for the full term",
];

export const RUNGS: Record<RungSlug, RungContent> = {
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
    price: "PRICE_UNCONFIRMED",
    priceNote: "10 week term, includes My Athletic Journey app access.",
    ctaLabel: "Enrol in Foundation",
    enrolSlug: "foundation",
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
    price: "PRICE_UNCONFIRMED",
    priceNote: "10 week term, includes My Athletic Journey app access.",
    ctaLabel: "Enrol in Emerging Athletes",
    enrolSlug: "emerging-athletes",
  },

  "junior-academy": {
    slug: "junior-academy",
    name: "Junior Academy",
    ageBand: "Ages 12 to 16",
    teaser: "Multi-sport athletic development for athletes who have decided they are serious.",
    about: [
      "Junior Academy is a proper athletic development program: speed, strength, and the movement skills that carry into whatever they play on the weekend.",
      "Athletes train up to twice a week on individual programming, and are tested through the term so improvement is a number, not an opinion.",
    ],
    forWho: [
      "Your athlete is 12 to 16",
      "They play at a decent level and want to be faster and more robust",
      "They are willing to be challenged and to turn up consistently",
      "You take a long-term view, and understand real progress takes terms not weeks",
    ],
    notForWho:
      "This is not a drop-in speed class. If your athlete cannot commit to the term, Team Sport Speed is a better fit.",
    session: [
      "Individual warm up from their own program",
      "Technical speed work, coached one athlete at a time",
      "Strength and power block, loaded to their stage not their age",
      "Conditioning matched to their sport's demands",
      "Session logged in My Athletic Journey before they leave",
    ],
    included: [
      "Individual programming, up to two sessions per week",
      "Testing in weeks 1, 5 and 10, so progress is measured not guessed",
      "My Athletic Journey app access for the full term",
    ],
    logistics: [
      "Up to two sessions per week, during the school term",
      "Training clothes and runners. Bring a drink bottle and a towel",
      "Mornington track and partner venues",
      "Wet weather: we run unless it is unsafe, and you will hear from us before the session if it is called off",
    ],
    price: "$100 to $200 per month",
    priceNote: "Depends on whether they train once or twice a week.",
    ctaLabel: "Apply for Junior Academy",
    enrolSlug: "junior-academy",
  },

  "senior-squad": {
    slug: "senior-squad",
    name: "Senior Squad",
    ageBand: "Ages 16 and over",
    teaser: "Competition-ready. Speed, strength and the mental side of performing on the day.",
    about: [
      "Senior Squad is for athletes who compete and want to be ready when it counts.",
      "Programming covers speed, strength and the mental strategies that hold up under pressure. Sessions are built around a competition calendar, not a generic block.",
    ],
    forWho: [
      "Your athlete is 16 or over",
      "They compete, and the result matters to them",
      "They want individual programming rather than a group workout",
      "They are prepared to train consistently across a season",
    ],
    notForWho:
      "If they are chasing general fitness rather than performance, this is more than they need.",
    session: [
      "Individual warm up and movement prep from their program",
      "Speed or power work, the priority of the session, done fresh",
      "Strength block against their current phase",
      "Sport-specific conditioning",
      "Debrief, and the session logged in My Athletic Journey",
    ],
    included: [
      "Individual programming built around your competition calendar",
      "Testing in weeks 1, 5 and 10, so progress is measured not guessed",
      "My Athletic Journey app access for the full term",
    ],
    logistics: [
      "Session times set with the squad each term",
      "Training clothes, runners, spikes if they use them. Drink bottle and towel",
      "Mornington track and partner venues",
      "Wet weather: we run unless it is unsafe, and you will hear from us before the session if it is called off",
    ],
    price: "$200 to $300 per month",
    priceNote: "Depends on session frequency.",
    ctaLabel: "Enrol in Senior Squad",
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
    price: "$300 + GST per term",
    priceNote: "10 weeks of coaching, includes My Athletic Journey app access.",
    ctaLabel: "Enrol in Team Sport Speed",
    enrolSlug: "team-sport-speed",
  },

  "high-performance": {
    slug: "high-performance",
    name: "High Performance",
    ageBand: "By invitation",
    teaser: "One to one coaching with elite testing and physio partnership.",
    about: [
      "High Performance is one to one coaching for athletes operating at the top of their level.",
      "Sessions include elite testing and are delivered in partnership with our physio partners, so training and rehabilitation are pulling the same direction.",
    ],
    forWho: [
      "Your athlete competes at state level or above, or is on that path",
      "They need a program built around them, not a squad",
      "You want testing and physio integrated rather than separate",
    ],
    notForWho:
      "This is by application. Most athletes are better served, and better value, in Senior Squad.",
    session: [
      "Full testing battery on the first session, so training starts from data",
      "One to one coaching for the full hour",
      "Physio input where the athlete is managing an issue",
      "Programming written and adjusted between sessions",
    ],
    included: [
      "One to one coaching, 60 minutes",
      "Elite testing battery",
      "Physio partnership where required",
      "My Athletic Journey app access",
    ],
    logistics: [
      "By prior booking only",
      "Melbourne CBD physio clinic or Mornington track, agreed at booking",
      "Training clothes, runners, spikes if used",
    ],
    price: "From $400 per session",
    priceNote: "60 minutes, one to one, by application.",
    ctaLabel: "Apply for High Performance",
    enrolSlug: "high-performance",
  },
};

export const RUNG_ORDER: RungSlug[] = [
  "foundation",
  "emerging-athletes",
  "junior-academy",
  "senior-squad",
  "team-sport-speed",
];
