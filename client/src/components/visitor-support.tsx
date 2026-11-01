import type { ReactNode } from 'react';
import { DISCOVERY_CALL_URL, EMAIL_ENQUIRY_URL } from '@/content/contact';

export function VisitorSupport({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return <main className="min-h-screen bg-[#faf8f5] px-6 py-8 text-[#2e2600]">
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Support navigation" className="mb-8 flex flex-wrap gap-5 text-sm font-bold text-[#0a6b66]">
        <a href="/" className="underline">Power2ADAPT home</a><a href="/programs" className="underline">Programs</a><a href="/parent-help-center" className="underline">Help</a>
      </nav>
      <h1 className="text-4xl font-black">{title}</h1>
      <p className="my-5 text-lg text-[#525759]">{intro}</p>
      <div className="space-y-6">{children}</div>
      <section className="mt-10 rounded-xl bg-white p-6">
        <h2 className="text-2xl font-bold">Talk to Coach Al</h2>
        <p className="my-3 text-[#525759]">A free 15-minute video discovery call helps us understand your athlete’s goals and confirm whether we can help.</p>
        <a href={DISCOVERY_CALL_URL} className="inline-block rounded-lg bg-[#0a6b66] px-5 py-3 font-bold text-white">Book a Discovery Call</a>
        <p className="mt-4 text-[#525759]">Prefer email? Include your mobile number and the best time to call (Melbourne time). <a className="font-bold text-[#0a6b66] underline" href={EMAIL_ENQUIRY_URL}>Email info@power2adapt.com</a></p>
      </section>
      <p className="mt-8 text-sm">Excellence Through Consistency · Power2ADAPT</p>
    </div>
  </main>;
}

export function SupportSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-xl border border-[#e7e1d8] bg-white p-6"><h2 className="mb-3 text-2xl font-bold">{title}</h2><div className="space-y-3 text-[#525759]">{children}</div></section>;
}
