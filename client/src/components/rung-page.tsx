import type { RungContent } from "@/content/rungs";
import { ClassTiles } from "@/components/class-tiles";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-2xl font-bold text-[#0a6b66]">{title}</h2>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[#525759]">
          <span aria-hidden className="mt-1 text-[#12d4c8]">&#9679;</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function RungPage({ rung }: { rung: RungContent }) {
  const src = `${rung.slug}-page`;

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 pt-6">
        <a href="/" className="font-bold text-[#0a6b66] hover:underline" data-testid="home-link">
          &larr; Power2ADAPT home
        </a>
        <a href="/programs" className="text-sm font-bold text-[#0a6b66] hover:underline">
          All programs
        </a>
      </div>
      <div className="mx-auto max-w-3xl px-6 pb-14 pt-6">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-[#0a6b66]">
          {rung.ageBand}
        </p>
        <h1 className="mb-4 text-4xl font-black text-[#2e2600] md:text-5xl">{rung.name}</h1>
        <p className="mb-8 text-lg text-[#525759]">{rung.teaser}</p>

        <div className="mb-12">
          <ClassTiles classes={rung.classes} src={src} ctaLabel={rung.ctaLabel} />
        </div>

        <Section title="What this program is about">
          {rung.about.map((para) => (
            <p key={para} className="mb-3 text-[#525759]">
              {para}
            </p>
          ))}
        </Section>

        <Section title="Who it is for">
          <Bullets items={rung.forWho} />
          <p className="mt-4 rounded-lg bg-white p-4 text-[#525759]">{rung.notForWho}</p>
        </Section>

        <Section title="What a session looks like">
          <Bullets items={rung.session} />
        </Section>

        <Section title="What your athlete gets">
          <Bullets items={rung.included} />
        </Section>

        <Section title="What you need to know">
          <Bullets items={rung.logistics} />
        </Section>

        <Section title="Price">
          <p className="text-3xl font-black text-[#2e2600]">{rung.price}</p>
          <p className="mt-2 text-[#525759]">{rung.priceNote}</p>
        </Section>

        <div className="border-t border-[#e5e0d8] pt-10">
          <p className="mb-4 font-bold text-[#2e2600]">Excellence Through Consistency</p>
          <ClassTiles classes={rung.classes} src={src} ctaLabel={rung.ctaLabel} />
        </div>
      </div>
    </div>
  );
}
