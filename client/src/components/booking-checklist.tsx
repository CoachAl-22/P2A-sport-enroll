export function BookingChecklist() {
  return <aside aria-labelledby="booking-checklist-heading" className="my-6 rounded-xl border border-[#e7e1d8] bg-white p-5 text-[#525759]">
    <h2 id="booking-checklist-heading" className="text-xl font-black text-[#2e2600]">Before you book</h2>
    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
      <li>School bookings open the SportsBiz timetable. Select the correct term, program, school, day and time there; the website link does not preselect a class.</li>
      <li>Team Sport Speed opens the selected Setmore class. Check the date and Melbourne time, then check the total including GST before paying.</li>
      <li>For a free trial, speak with Coach Al first. A paid booking link is not a free-trial booking.</li>
      <li>Keep your confirmation and check the athlete, date, venue and payment details. Contact Coach Al if the provider’s details differ from the agreed session.</li>
    </ul>
    <p className="mt-4 text-sm"><a href="/payment-support" className="font-bold text-[#0a6b66] underline">Missing confirmation or payment help</a> · <a href="/enrollment-guide" className="font-bold text-[#0a6b66] underline">First-session guide</a></p>
  </aside>;
}
