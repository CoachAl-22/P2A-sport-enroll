import { VisitorSupport, SupportSection } from '@/components/visitor-support';
export default function EnrollmentGuide() {
  return <VisitorSupport title="Enrolment Guide" intro="Choose a program, confirm the fit and follow the booking or application route for your athlete.">
    <SupportSection title="1. Find the right program">
      <p><a className="font-bold underline" href="/programs">Compare programs</a> by school year, goals, venue and commitment. School sessions are for students of that school.</p>
      <p>If you are unsure, book a discovery call before applying or paying.</p>
    </SupportSection>
    <SupportSection title="2. Follow your program’s next step">
      <p>For Foundation, Emerging Athletes and Team Sport Speed, choose a session in the program finder and follow its booking link. The provider will show the information needed to enrol.</p>
      <p>For Junior Academy and Senior Squad, use the application on the program page. Coach Al will review suitability and confirm the next steps. High Performance starts with a discussion about your athlete’s goals.</p>
    </SupportSection>
    <SupportSection title="3. Confirm details before payment">
      <p>Check the venue, session time, term dates, total fee, GST and any venue membership costs. Your program page and booking provider describe the relevant option.</p>
      <p>Submitting an enquiry or application does not by itself confirm a place. Keep your booking confirmation and follow the instructions provided.</p>
    </SupportSection>
    <SupportSection title="Need to change an existing booking?">
      <p>Use the provider named in your booking confirmation, or contact Coach Al. Include your name, athlete’s name, program and session. For a callback, include your mobile number and best time to call.</p>
    </SupportSection>
  </VisitorSupport>;
}
