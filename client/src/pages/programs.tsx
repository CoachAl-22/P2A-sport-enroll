import { useState } from "react";
import { FINDER_CHOICES, resolveRung, type FinderChoiceId } from "@/content/finder";
import { RUNGS, type RungContent, type RungSummary, type RungApplyCard } from "@/content/rungs";
import { ClassTiles, SessionList } from "@/components/class-tiles";

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

function BookACall({ label, src }: { label: string; src: string }) {
  return (
    <div className="mt-8 rounded-xl bg-white p-6" data-testid="book-a-call">
      <h3 className="mb-2 text-lg font-black text-[#2e2600]">Not sure, or nothing fits?</h3>
      <p className="mb-4 text-[#525759]">{label}</p>
      <a
        href={`/enrol/book-a-call?src=${src}`}
        className="inline-block rounded-full border-2 border-[#0a6b66] px-6 py-3 font-bold uppercase tracking-wide text-[#0a6b66] hover:bg-[#0a6b66] hover:text-white"
      >
        Book a 10 minute call
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
                Moving quickly? Junior Academy takes athletes from Year 6 by invitation. Mention it
                on your call and I will tell you whether they are ready.
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

            <BookACall
              label="If none of those days or venues work, have a quick chat and I will sort it out."
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

        <p className="mt-12 border-t border-[#e7e1d8] pt-6 font-bold text-[#2e2600]">
          Excellence Through Consistency
        </p>
      </div>
    </div>
  );
}
