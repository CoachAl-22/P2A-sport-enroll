import { useRef, useState } from "react";
import { DISCOVERY_CALL_URL } from "@/content/contact";

// Free sample: two quick questions point a parent to the right program.
// Runs entirely in the browser. Nothing is sent or stored.

type Stage = "prep2" | "y3to5" | "y6to9" | "y10plus";
type Goal = "confidence" | "teamSport" | "athletics" | "oneOnOne";

const STAGES: { value: Stage; label: string }[] = [
  { value: "prep2", label: "Prep to Year 2" },
  { value: "y3to5", label: "Years 3 to 5" },
  { value: "y6to9", label: "Years 6 to 9" },
  { value: "y10plus", label: "Year 10 to adult" },
];

const GOALS: { value: Goal; label: string }[] = [
  { value: "confidence", label: "Move better and build confidence" },
  { value: "teamSport", label: "Get faster for their team sport" },
  { value: "athletics", label: "Compete in athletics" },
  { value: "oneOnOne", label: "One-on-one technique work" },
];

type Result = { name: string; href: string; why: string };

const PROGRAMS: Record<string, Result> = {
  foundation: { name: "Foundation", href: "/foundation", why: "Fun fundamentals of running, coordination and movement for Prep to Year 2." },
  emerging: { name: "Emerging Athletes", href: "/emerging-athletes", why: "Structured athletic development for primary-school athletes in any sport." },
  junior: { name: "Junior Academy", href: "/junior-academy", why: "Speed, strength and movement quality for multi-sport athletes in Years 6 to 9." },
  teamSport: { name: "Team Sport Speed", href: "/team-sport-speed", why: "Acceleration, top speed and agility for AFL, soccer, basketball, netball and more (ages 13+)." },
  senior: { name: "Senior Squad", href: "/senior-squad", why: "Competition preparation for serious athletes, by application." },
  hp: { name: "High Performance", href: "/high-performance", why: "One-on-one movement analysis, video assessment and competition peaking." },
};

function recommend(stage: Stage, goal: Goal): Result {
  if (goal === "oneOnOne" && (stage === "y6to9" || stage === "y10plus")) return PROGRAMS.hp;
  if (stage === "prep2") return PROGRAMS.foundation;
  if (stage === "y3to5") return PROGRAMS.emerging;
  if (stage === "y6to9") return PROGRAMS.junior;
  if (goal === "athletics") return PROGRAMS.senior;
  return PROGRAMS.teamSport;
}

export function ClassFinderQuiz() {
  const [stage, setStage] = useState<Stage | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stage || !goal) return;
    setResult(recommend(stage, goal));
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  const option = "flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 hover:border-primary-500 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 has-[:checked]:font-semibold";

  return (
    <section id="class-finder" aria-labelledby="class-finder-title" className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-500 mb-3">Two quick questions</p>
          <h2 id="class-finder-title" className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-3">Which class fits your athlete?</h2>
          <p className="text-lg text-gray-600">Answer two questions and we'll point you to the best starting program. Nothing is saved or sent.</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <fieldset>
              <legend className="mb-3 font-heading font-bold text-gray-900">1. What school year are they in?</legend>
              <div className="grid gap-2">
                {STAGES.map((s) => (
                  <label key={s.value} className={option}>
                    <input type="radio" name="stage" value={s.value} checked={stage === s.value} onChange={() => { setStage(s.value); setResult(null); }} className="accent-[hsl(210_100%_32.7%)]" />
                    {s.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 font-heading font-bold text-gray-900">2. What's the main goal?</legend>
              <div className="grid gap-2">
                {GOALS.map((g) => (
                  <label key={g.value} className={option}>
                    <input type="radio" name="goal" value={g.value} checked={goal === g.value} onChange={() => { setGoal(g.value); setResult(null); }} className="accent-[hsl(210_100%_32.7%)]" />
                    {g.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <button type="submit" disabled={!stage || !goal} className="mt-6 w-full rounded-lg border-2 border-primary-500 px-6 py-3 font-heading font-semibold text-primary-500 hover:bg-primary-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 md:w-auto">
            Show my match
          </button>

          <div ref={resultRef} tabIndex={-1} aria-live="polite" className="outline-none">
            {result && (
              <div className="mt-6 rounded-xl border-l-4 border-primary-500 bg-primary-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Your best starting point</p>
                <h3 className="mt-1 text-2xl font-heading font-bold text-gray-900">{result.name}</h3>
                <p className="mt-2 text-gray-700">{result.why}</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a href={DISCOVERY_CALL_URL} className="inline-flex justify-center rounded-lg bg-secondary-500 px-6 py-3 font-heading font-semibold text-white shadow-[0_10px_24px_-8px_rgba(242,101,34,.6)] hover:bg-secondary-600">Book a free discovery call →</a>
                  <a href={result.href} className="font-semibold text-primary-500 underline underline-offset-4 hover:no-underline">See the {result.name} program</a>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
