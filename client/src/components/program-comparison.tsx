import { RUNGS } from "@/content/rungs";
import { DISCOVERY_CALL_URL } from "@/content/contact";

const PROGRAMS = [
  { slug: "foundation", href: "/foundation", focus: "Movement skills, coordination and confidence through games", commitment: "One session per week in the school term", venue: "School sessions for that school’s students; community sessions at Ballam Park and Mornington" },
  { slug: "emerging-athletes", href: "/emerging-athletes", focus: "Running technique, speed and all-round athletic development", commitment: "One session per week in the school term", venue: "School sessions for that school’s students; community sessions at Ballam Park and Mornington" },
  { slug: "junior-academy", href: "/junior-academy", focus: "Physical foundations for multi-sport athletes", commitment: "One or two sessions per week; by application", venue: "Ballam Park and Mornington" },
  { slug: "senior-squad", href: "/senior-squad", focus: "Structured training for competition and performance", commitment: "Ongoing squad coaching; individual placement", venue: "Ballam Park and Mornington" },
  { slug: "team-sport-speed", href: "/team-sport-speed", focus: "Speed, agility and repeat efforts for team sports", commitment: "One session per week alongside club training", venue: "Mornington Athletics Track" },
  { slug: "high-performance", href: "/high-performance", focus: "Individual coaching for athletes with specific performance goals", commitment: "Individual program; discuss suitability with Coach Al", venue: "Venue and training plan agreed with Coach Al" },
] as const;

export function ProgramComparison() {
  return <section aria-labelledby="compare-programs" className="mb-10">
    <h2 id="compare-programs" className="mb-3 text-2xl font-black text-[#2e2600]">Compare programs</h2>
    <p className="mb-4 text-[#525759]">Start with your athlete’s stage and goals. Select a program for current fees, inclusions and session details.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      {PROGRAMS.map(program => <article key={program.slug} className="rounded-xl border border-[#e7e1d8] bg-white p-5">
        <h3 className="text-xl font-black text-[#2e2600]"><a className="underline decoration-[#0a6b66] underline-offset-4" href={program.href}>{RUNGS[program.slug].name}</a></h3>
        <p className="mt-2 font-bold text-[#0a6b66]">{RUNGS[program.slug].ageBand}</p>
        <p className="mt-2 text-[#525759]">{program.focus}</p>
        <dl className="mt-3 text-sm text-[#525759]">
          <dt className="font-bold">Commitment</dt><dd>{program.commitment}</dd>
          <dt className="mt-2 font-bold">Where</dt><dd>{program.venue}</dd>
        </dl>
      </article>)}
    </div>
    <p className="mt-4 rounded-lg bg-white p-4 text-sm text-[#525759]">In Year 6? Emerging Athletes develops movement and running skills through school or community sessions; Junior Academy offers an ongoing coaching membership. Individual exceptions are considered. <a href={DISCOVERY_CALL_URL} className="font-bold text-[#0a6b66] underline">Book a discovery call</a> to discuss the best fit.</p>
  </section>;
}
