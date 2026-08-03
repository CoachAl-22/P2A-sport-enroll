import type { ClassOffering, SessionTime } from "@/content/rungs";

// One tile per class a parent can act on. Every link goes through /enrol/{slug}
// so the click is logged before the redirect; never link straight to SportsBiz
// or Setmore from a page.
export function ClassTiles({
  classes,
  src,
  ctaLabel,
  programName,
}: {
  classes: ClassOffering[];
  src: string;
  ctaLabel: string;
  programName?: string;
}) {
  if (classes.length === 0) {
    return (
      <p
        className="rounded-xl border-2 border-[#e7e1d8] bg-white p-4 text-[#525759]"
        data-testid="classes-empty"
      >
        {programName ? `Classes for ${programName} are` : "Classes are"} being finalised. Book a call and we will let you know as soon as times are set.
      </p>
    );
  }

  return (
    <div className="space-y-3" data-testid="class-tiles">
      {classes.map((cls) => (
        <a
          key={cls.slug}
          href={`/enrol/${cls.slug}?src=${src}`}
          className="flex items-center justify-between rounded-xl border-2 border-[#e7e1d8] bg-white p-4 shadow-sm transition hover:border-[#12d4c8] hover:shadow-md"
          data-testid={`enrol-cta-${cls.slug}`}
        >
          <span className="text-[#525759]">
            <span className="font-bold text-[#2e2600]">{cls.venue}</span>
            {" "}&middot; {cls.day} {cls.time}
            {cls.waitlist && (
              <span className="ml-2 rounded bg-[#f6930e] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[#2e2600]">
                Waitlist
              </span>
            )}
            {cls.studentsOnly ? (
              <span className="mt-1 block text-sm font-bold text-[#0a6b66]">
                {cls.studentsOnly} students only
              </span>
            ) : (
              <span className="mt-1 block text-sm">Open to everyone</span>
            )}
          </span>
          <span className="font-bold uppercase tracking-wide text-[#f6930e]">
            {cls.waitlist ? "Join waitlist" : ctaLabel}
          </span>
        </a>
      ))}
    </div>
  );
}

// By-application programs show when they run, with no per-session link. One
// Apply button covers all of them, so six buttons posting to the same form
// would be six ways to do one thing.
export function SessionList({ sessions }: { sessions: SessionTime[] }) {
  return (
    <div className="space-y-2" data-testid="session-list">
      {sessions.map((s) => (
        <div
          key={`${s.venue}-${s.day}-${s.time}`}
          className="rounded-xl border-2 border-[#e7e1d8] bg-white p-3 text-[#525759]"
        >
          <span className="font-bold text-[#2e2600]">{s.venue}</span>
          {" "}&middot; {s.day} {s.time}
        </div>
      ))}
    </div>
  );
}
