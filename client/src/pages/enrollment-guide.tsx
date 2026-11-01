import { VenueMeetingPoints } from '@/components/venue-meeting-points';
import { useEffect } from 'react';
import { VisitorSupport, SupportSection } from '@/components/visitor-support';
import { JoiningJourney } from '@/components/joining-journey';
import { EMAIL_ENQUIRY_URL } from '@/content/contact';

export default function EnrollmentGuide() {
  useEffect(() => {
    const section=window.location.hash.slice(1);
    if (section === 'existing-families' || section === 'venue-meeting-points') {
      document.getElementById(section)?.scrollIntoView();
    }
  }, []);
  return <VisitorSupport title="Your first session" intro="A simple guide to getting started, arriving prepared and choosing what comes next.">
    <JoiningJourney />
    <SupportSection title="Before your trial">
      <p><a className="font-bold underline" href="/programs">Compare programs and session times</a>, then speak with Coach Al to confirm the right group and arrange your free trial. School sessions are for students of that school; ask about community options if needed.</p>
      <p>Confirm the date, start time, venue and exact meeting point before travelling. An enquiry or application alone does not confirm a place.</p>
    </SupportSection>
    <SupportSection title="Photos and video are your choice">
      <p>Private technique analysis and public sharing have separate permissions. For athletes under 18, parent/guardian and athlete must both agree before recording or public use. Saying no does not affect participation. <a className="font-bold underline" href="/photos-and-videos">Read your photo and video choices</a> before the session.</p>
    </SupportSection>
    <SupportSection title="What to bring">
      <p>Bring a water bottle, wear comfortable clothing you can move in and suitable sports shoes. Check your session confirmation for any program-specific equipment or instructions.</p>
      <p>Let Coach Al know about anything that may affect safe participation before training, including an injury or support need. Discuss sensitive information directly with the coach.</p>
    </SupportSection>
    <VenueMeetingPoints />
    <SupportSection title="Arrival and collection">
      <p><a className="font-bold underline" href="https://power2adapt.coach/where-we-train">Where we train</a> has venue information. Check your confirmation for the entrance, parking and meeting point; if these are unclear, contact Coach Al before leaving.</p>
      <p>Allow time to find the group and introduce your athlete. Parents and caregivers are responsible before and after the designated class time. Collect your child on time, tell the coach about any changes in collection arrangements, and contact the coach promptly if delayed. Parents do not need to stay during the session, but are welcome to watch, particularly for Prep and Year 1 athletes. Agree on the collection point with Coach Al.</p>
      <p>For Ballam Park, check the separate Frankston Athletic Club membership requirements and costs with Coach Al, including what applies to your trial.</p>
    </SupportSection>
    <SupportSection title="Check the weather before leaving">
      <p>Sessions do not run above 36°C or in extreme weather conditions. Venue-specific rules may require earlier cancellation. Check your session messages and contact Coach Al if you are unsure whether training is going ahead.</p>
      <p>If Power2ADAPT cancels a class, everyone booked into that class receives a credit.</p>
    </SupportSection>
    <SupportSection title="After the session">
      <p>Discuss how your athlete found the session and whether the group is a good fit. Before paying, confirm the program, session times, term dates, total fee including GST, inclusions and any additional venue costs.</p>
      <p>Foundation, Emerging Athletes and Team Sport Speed use the relevant session booking route. Junior Academy and Senior Squad use an application reviewed by Coach Al. High Performance begins with an individual discussion.</p>
      <p>Keep your booking confirmation and follow its instructions. A trial or application does not guarantee acceptance into a squad.</p>
    </SupportSection>
    <section id="existing-families" className="scroll-mt-8 rounded-xl border border-[#e7e1d8] bg-white p-6">
      <h2 className="mb-3 text-2xl font-bold">Already training with us?</h2>
      <div className="space-y-3 text-[#525759]">
        <p>To change or review a booking, use the provider and link in your original confirmation. Setmore bookings can be managed through that confirmation; term enrolments follow their enrolment provider’s instructions.</p>
        <p><a className="font-bold underline" href="/login">Log in to your Power2ADAPT account</a> for your account features. Session changes and payments still use the provider named in your booking confirmation.</p>
        <p>Need help? <a className="font-bold underline" href={EMAIL_ENQUIRY_URL}>Email Coach Al</a> with your name, athlete’s name, program, session, mobile number and best callback time (Melbourne time).</p>
        <p><a className="font-bold underline" href="/parent-help-center">Read the cancellation and absence guidance</a> or <a className="font-bold underline" href="/payment-support">get payment help</a>.</p>
      </div>
    </section>
  </VisitorSupport>;
}
