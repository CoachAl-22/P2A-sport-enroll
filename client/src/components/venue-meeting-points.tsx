export function VenueMeetingPoints() {
  return <section aria-labelledby="venue-meeting-points" className="rounded-xl border border-[#e7e1d8] bg-white p-6">
    <h2 id="venue-meeting-points" className="mb-3 text-2xl font-bold text-[#2e2600]">Where to meet your coach</h2>
    <p className="mb-4 text-[#525759]">Check your agreed session and venue before travelling. Here is where to find the group.</p>
    <dl className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg bg-[#faf8f5] p-4"><dt className="font-bold text-[#0a6b66]">Ballam Park</dt><dd className="mt-2 text-[#525759]">Meet at the high jump area on the track.</dd></div>
      <div className="rounded-lg bg-[#faf8f5] p-4"><dt className="font-bold text-[#0a6b66]">Mornington Athletics Track</dt><dd className="mt-2 text-[#525759]">Meet at the 100m finish or the undercover area.</dd></div>
      <div className="rounded-lg bg-[#faf8f5] p-4"><dt className="font-bold text-[#0a6b66]">Peninsula Grammar</dt><dd className="mt-2 text-[#525759]"><span className="block"><strong>Prep–Year 1:</strong> meet at your child’s classroom/playground area.</span><span className="mt-2 block"><strong>Years 2–6:</strong> meet at the Junior Gym.</span></dd></div>
      <div className="rounded-lg bg-[#faf8f5] p-4"><dt className="font-bold text-[#0a6b66]">Toorak College</dt><dd className="mt-2 text-[#525759]">Meet at the rock climbing wall. <strong>Pickup is at 4:45pm at the Wardle House turning circle.</strong></dd></div>
    </dl>
    <p className="mt-4 text-sm text-[#525759]">Peninsula Grammar and Toorak College sessions are for students of that school. If the meeting point is unclear, <a className="font-bold text-[#0a6b66] underline" href="tel:+61434679395">call Coach Al on 0434 679 395</a>. Confirm parking and entrance instructions before travelling if needed.</p>
  </section>;
}
