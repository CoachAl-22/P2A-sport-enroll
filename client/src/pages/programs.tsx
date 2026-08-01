import { RUNGS, RUNG_ORDER } from "@/content/rungs";

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

export default function Programs() {
  const closed = getClosedSlug();
  const src = getSrc();

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="mx-auto max-w-4xl px-6 py-14">
        {closed && (
          <div
            className="mb-8 rounded-lg border border-[#f6930e] bg-white p-4 text-[#525759]"
            data-testid="closed-banner"
          >
            That intake has closed. Here is what is running now.
          </div>
        )}

        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-[#0e9b93]">
          Mornington &middot; Ages 7 to 17+
        </p>
        <h1 className="mb-4 text-4xl font-black text-[#2e2600] md:text-5xl">
          Every athlete starts somewhere
        </h1>
        <p className="mb-12 max-w-2xl text-lg text-[#525759]">
          Speed, strength and the movement skills that carry into whatever they play on the
          weekend. Pick the group that matches your athlete's age and stage, and read exactly what
          they would be walking into.
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          {RUNG_ORDER.map((slug) => {
            const rung = RUNGS[slug];
            return (
              <a
                key={slug}
                href={`/enrol/${rung.enrolSlug}?src=${encodeURIComponent(
                  src === "direct" ? "programs" : src
                )}`}
                className="block rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
                data-testid={`rung-card-${slug}`}
              >
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#0e9b93]">
                  {rung.ageBand}
                </p>
                <h2 className="mb-2 text-xl font-black text-[#2e2600]">{rung.name}</h2>
                <p className="mb-4 text-[#525759]">{rung.teaser}</p>
                <span className="font-bold uppercase tracking-wide text-[#f6930e]">
                  Read more &rarr;
                </span>
              </a>
            );
          })}
        </div>

        <p className="mt-12 border-t border-[#e5e0d8] pt-8 font-bold text-[#2e2600]">
          Excellence Through Consistency
        </p>
      </div>
    </div>
  );
}
