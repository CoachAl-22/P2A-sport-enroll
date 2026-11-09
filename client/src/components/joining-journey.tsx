import { DISCOVERY_CALL_URL } from '@/content/contact';

export function JoiningJourney() {
  return <section aria-labelledby="getting-started" className="my-8 rounded-2xl border border-[#e7e1d8] bg-white p-6 text-[#2e2600]">
    <p className="text-sm font-bold uppercase tracking-widest text-[#0a6b66]">New to Power2ADAPT?</p>
    <h2 id="getting-started" className="mt-2 text-2xl font-black">Your first session starts with a conversation</h2>
    <p className="mt-3 text-[#525759]">Every new athlete can try one free session. We’ll help you find a suitable group before you commit.</p>
    <ol className="my-6 grid gap-5 sm:grid-cols-3">
      {[
        ['Talk to Coach Al', 'Book a free 15-minute video discovery call to discuss your athlete’s goals.'],
        ['Find the fit and try', 'Agree on a suitable program and arrange your athlete’s free trial session.'],
        ['Choose your next step', 'After the trial, discuss the fit and follow the relevant booking or application route.'],
      ].map(([title, detail], index) => <li key={title}>
        <span aria-hidden="true" className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0a6b66] font-bold text-white">{index + 1}</span>
        <h3 className="font-bold">{title}</h3><p className="mt-1 text-sm text-[#525759]">{detail}</p>
      </li>)}
    </ol>
    <div className="flex flex-wrap items-center gap-4">
      <a href={DISCOVERY_CALL_URL} className="rounded-lg bg-secondary-500 px-5 py-3 font-bold text-white hover:bg-secondary-600">Book a free discovery call</a>
      <a href="/enrollment-guide" className="font-bold text-[#0a6b66] underline">Your first session guide</a>
    </div>
    <p className="mt-5 border-t border-[#e7e1d8] pt-4 text-sm text-[#525759]">Already training with us? <a href="/enrollment-guide#existing-families" className="font-bold text-[#0a6b66] underline">Manage an existing booking</a>.</p>
  </section>;
}
