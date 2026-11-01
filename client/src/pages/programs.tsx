import { BookingChecklist } from "@/components/booking-checklist";
import { TRAINING_SCHEDULE } from "@/content/schedule";
import { ProgramComparison } from "@/components/program-comparison";
import { useState } from "react";
import { FINDER_CHOICES, resolveRung, type FinderChoiceId } from "@/content/finder";
import { RUNGS, type RungContent, type RungSummary, type RungApplyCard } from "@/content/rungs";
import { ClassTiles, SessionList } from "@/components/class-tiles";
import { ProgramEnquiryForm } from "@/components/program-enquiry-form";

// wouter strips query params, so read them from the location directly.
function getClosedSlug(): string | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("closed");
  return value && value.length <= 100 ? value : null;
}

function getSrc(): string {
  if (typeof window === "undefined") return "direct";
  const value = new URLSearchParams(window.location.search).get("src");
  return value && value.length <= 100 ? value : "direct";
}

function hasClasses(rung: RungContent | RungSummary): rung is RungContent {
  return "classes" in rung;
}

// Counterpart to hasClasses: narrows the by-application shape, where
// sessions and applyUrl are co-required (see RungApplyCard). A rung that is
// not RungContent and not RungApplyCard (currently just High Performance)
// never reaches this page via the finder.
function hasApplyUrl(rung: RungSummary): rung is RungApplyCard {
  return "applyUrl" in rung;
}

// The discovery call booking. Routed through /enrol/book-a-call so the click is
// logged before the redirect, like every other action on this page. The `src`
// carries the program the parent was looking at when they gave up, which says
// which program is failing to convert.
//
// The route has a Setmore fallback when the optional admin-managed link row is
// missing, so the call remains bookable in either environment.
function BookACall({ label, src }: { label: string; src: string }) {
  return (
    <div className="mt-8 rounded-xl bg-white p-6" data-testid="book-a-call">
      <h3 className="mb-2 text-lg font-black text-[#2e2600]">Not sure, or nothing fits?</h3>
      <p className="mb-4 text-[#525759]">{label}</p>
      <a
        href={`/enrol/book-a-call?src=${src}`}
        className="inline-block rounded-full border-2 border-[#0a6b66] px-6 py-3 font-bold uppercase tracking-wide text-[#0a6b66] hover:bg-[#0a6b66] hover:text-white"
      >
        Book a Discovery Call
      </a>
    </div>
  );
}

export default function Programs() {
  const [choice, setChoice] = useState<FinderChoiceId | null>(null);
  const closed = getClosedSlug();
  const src = getSrc();
  const finderSrc = src === "direct" ? "finder" : src;

  const slug = choice ? resolveRung(choice) : null;
  const rung = slug ? RUNGS[slug] : null;

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="mx-auto max-w-3xl px-6 pt-6">
        <a href="/" className="font-bold text-[#0a6b66] hover:underline" data-testid="home-link">
          &larr; Power2ADAPT home
        </a>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-16 pt-6">
        <div className="mb-6 rounded-lg bg-[#0a6b66] px-5 py-4 font-bold text-white">
          Find your program, venue and session time. Ask Coach Al if you are unsure where to start.
        </div>
        {closed && (
          <div
            className="mb-8 rounded-lg border border-[#f6930e] bg-white p-4 text-[#525759]"
            data-testid="closed-banner"
          >
            That intake has closed. Here is what is running now.
          </div>
        )}

        <p className="text-sm font-bold uppercase tracking-widest text-[#0a6b66]">
          Frankston &middot; Mornington &middot; Mt Eliza
        </p>
        <h1 className="mb-3 mt-2 text-4xl font-black leading-tight text-[#2e2600] md:text-5xl">
          Find the right class
        </h1>
        <p className="mb-8 text-lg text-[#525759]">
          Start with your athlete's year level. We will tell you which program that is, and show
          you when and where it runs.
        </p>
        <p className="mb-8 text-sm text-[#525759]">
          <a href="https://power2adapt.coach/where-we-train" className="font-bold text-[#0a6b66] underline hover:no-underline">Where we train</a>
          {" "}for venue details, the weekly schedule and Ballam Park membership information.
        </p>

        <p className="mb-6 rounded-xl border border-[#e7e1d8] bg-white p-4 text-sm text-[#525759]">New here? <a href="/enrollment-guide" className="font-bold text-[#0a6b66] underline">See how to get started and prepare for your free trial</a>. Already training? <a href="/enrollment-guide#existing-families" className="font-bold text-[#0a6b66] underline">Manage an existing booking</a>.</p>

        <nav aria-label="Program page sections" className="mb-6 flex flex-wrap gap-4 text-sm font-bold text-[#0a6b66]">
          <a href="#choose-program" className="underline">Find a program</a><a href="#compare-programs" className="underline">Compare programs</a><a href="#term4-times" className="underline">Weekly schedule</a>
        </nav>
        <h2 id="choose-program" className="mb-3 text-2xl font-black text-[#2e2600]">Choose your athlete’s stage</h2>
        <div className="grid gap-3 sm:grid-cols-2" data-testid="finder-choices">
          {FINDER_CHOICES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChoice(c.id)}
              aria-pressed={choice === c.id}
              data-testid={`choice-${c.id}`}
              className={`rounded-xl border-2 bg-white p-4 text-left transition ${
                choice === c.id
                  ? "border-[#0a6b66] shadow-md"
                  : "border-[#e7e1d8] hover:border-[#12d4c8]"
              }`}
            >
              <span className="block font-black text-[#2e2600]">{c.label}</span>
              <span className="block text-sm text-[#525759]">{c.note}</span>
            </button>
          ))}
        </div>

        {rung && (
          <div className="mt-10 border-t border-[#e7e1d8] pt-8" data-testid={`reveal-${rung.slug}`}>
            <p className="text-sm font-bold uppercase tracking-widest text-[#0a6b66]">That is</p>
            <h2 className="mb-3 mt-1 text-3xl font-black text-[#2e2600]">{rung.name}</h2>
            <p className="mb-4 text-[#525759]">{rung.teaser}</p>
            <div className="mb-6 rounded-xl bg-white p-5 text-[#525759]">
              <p className="font-bold text-[#0a6b66]">{rung.ageBand}</p>
              {hasClasses(rung) ? <><p className="mt-2 font-bold text-[#2e2600]">{rung.price}</p><p className="mt-2 text-sm">{rung.priceNote}</p><p className="mt-3 text-sm">Includes: {rung.included.join('; ')}.</p></> : <p className="mt-2">By application. Confirm your training plan, fees and inclusions with Coach Al on the program page before committing.</p>}
              <p className="mt-3 text-sm">Every new athlete can try one free session. Arrange the trial with Coach Al; availability is confirmed when booked. <a href="/enrollment-guide" className="font-bold text-[#0a6b66] underline">Prepare for your first session</a>.</p>
            </div>

            {hasClasses(rung) && rung.notForWho && (
              <p className="mb-4 rounded-lg bg-white p-4 text-sm text-[#0a6b66]">
                {rung.notForWho}
              </p>
            )}

            <a
              href={`/enrol/${rung.enrolSlug}?src=${finderSrc}`}
              className="font-bold text-[#0a6b66] underline hover:no-underline"
              data-testid={`more-about-${rung.slug}`}
            >
              More about {rung.name}
            </a>

            {rung.slug === "emerging-athletes" && (
              <p className="mt-4 rounded-lg bg-white p-4 text-sm text-[#525759]">
                Junior Academy is for Years 6 to 9, with individual exceptions. Year 6 athletes can
                also join Emerging Athletes through school or community sessions. Ask Coach Al which group fits.
              </p>
            )}

            {rung.slug === "senior-squad" && (
              <p className="mt-4 rounded-lg bg-white p-4 text-sm text-[#525759]">
                Under 16 and training seriously? Get in touch anyway. I place athletes
                individually rather than by a birthday.
              </p>
            )}

            <h3 className="mb-3 mt-8 text-xl font-black text-[#2e2600]">
              {hasClasses(rung) ? "Choose your class" : "When it runs"}
            </h3>

            {hasClasses(rung) ? (
              <ClassTiles classes={rung.classes} src={finderSrc} ctaLabel={rung.ctaLabel} />
            ) : hasApplyUrl(rung) ? (
              <>
                <SessionList sessions={rung.sessions} />
                <p className="mt-4 text-[#525759]">
                  {rung.name} is by application, so one form covers every session. Apply and I will
                  be in touch to set up training and payment.
                </p>
                <a
                  href={rung.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block rounded-full bg-[#f6930e] px-8 py-4 font-bold uppercase tracking-wide text-[#2e2600] hover:opacity-90"
                  data-testid={`apply-${rung.slug}`}
                >
                  Apply for {rung.name}
                </a>
              </>
            ) : null}

            {hasClasses(rung) && (rung.slug === "foundation" || rung.slug === "emerging-athletes") && (
              <div className="mt-6 rounded-lg bg-white p-5 text-[#525759]">
                <h3 className="mb-2 font-bold text-[#2e2600]">Looking for a community session?</h3>
                <p>Foundation and Emerging Athletes also train at Mornington on Wednesday 4:30pm and Ballam Park on Thursday 4:30pm. <a href="/enrol/book-a-call?src=community-finder" className="font-bold text-[#0a6b66] underline">Book a Discovery Call</a> to confirm the right group and arrange a free trial.</p>
              </div>
            )}
            <BookACall
              label="A free 15-minute video call to understand your athlete’s goals and confirm whether we can help."
              src={`${finderSrc}-${rung.slug}`}
            />
          </div>
        )}

        {!rung && (
          <BookACall
            label="Pick a year level above, or if you would rather just talk it through, book a call."
            src={finderSrc}
          />
        )}

        <p className="mt-6 text-sm text-[#525759]">Ballam Park training requires a separate Frankston Athletic Club membership. <a href="https://power2adapt.coach/where-we-train#frankston" className="font-bold underline">Check the membership categories and current costs</a> before booking. Other listed venues do not require this additional membership.</p>
        <ProgramComparison />

        <section className="mb-10" aria-labelledby="term4-times">
          <h2 id="term4-times" className="mb-3 text-2xl font-black text-[#2e2600]">Weekly training schedule</h2>
          <p className="mb-2 text-sm text-[#525759] sm:hidden">Swipe sideways to see the venue →</p>
          <div className="overflow-x-auto rounded-xl border border-[#e7e1d8] bg-white">
            <table className="w-full min-w-[590px] text-left text-sm text-[#2e2600]">
              <thead className="bg-[#f1ede7]">
                <tr>{["Class", "Day", "Time", "Venue"].map(label =>
                  <th key={label} scope="col" className="px-4 py-3 font-bold">{label}</th>
                )}</tr>
              </thead>
              <tbody className="divide-y divide-[#e7e1d8]">
                {TRAINING_SCHEDULE.map((session, i) =>
                  <tr key={i}>
                    {[session.label, session.day, session.time,
                      `${session.venue}${session.studentsOnly ? ` (${session.studentsOnly} students only)` : session.waitlist ? " — waitlist only" : session.accessNote ? ` — ${session.accessNote}` : " — open to everyone"}`
                    ].map((value, j) => <td key={j} className="px-4 py-3 align-top">{value}</td>)}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-[#525759]">Schedule aligned with Where we train. School sessions are for students of that school. Community Foundation and Emerging Athletes sessions can be arranged with Coach Al; Tuesday 4:30pm at Ballam Park is Hurdle Squad; discuss placement with Coach Al. High Performance is by prior booking with no fixed slot.</p>
        </section>

        <BookingChecklist />
        <ProgramEnquiryForm />

        <section className="mt-10 rounded-xl border border-[#e7e1d8] bg-white p-6">
          <h2 className="mb-2 text-2xl font-black text-[#2e2600]">Train the Mind</h2>
          <p className="text-[#525759]">
            Every session includes a short mental skills block, built from Coach Alistair's guide
            <em> Becoming an Empowered Athlete</em>. Weeks 1 to 4 cover managing nerves, weeks 5 to 7
            healthy expectations (beating their own number, not the kid next to them), and weeks 8 to 10
            building momentum into summer sport.
          </p>
        </section>

        <p className="mt-12 border-t border-[#e7e1d8] pt-6 font-bold text-[#2e2600]">
          Excellence Through Consistency
        </p>
      </div>
    </div>
  );
}
