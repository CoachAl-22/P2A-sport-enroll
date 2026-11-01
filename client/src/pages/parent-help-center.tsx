import { VenueMeetingPoints } from '@/components/venue-meeting-points';
import { VisitorSupport, SupportSection } from '@/components/visitor-support';
export default function ParentHelpCenter() {
  return <VisitorSupport title="Parent Help Centre" intro="Find a program, understand the next step and get help from Coach Al.">
    <SupportSection title="Which program fits?">
      <p>Start with your athlete’s school year and goals. <a className="font-bold underline" href="/programs">Compare programs and find a class</a>.</p>
      <p>Foundation is for Prep to Year 2. Emerging Athletes is for Years 3–6 at school or community venues. Junior Academy is for Years 6–9, with individual exceptions. Year 6 families can discuss which option fits best.</p>
    </SupportSection>
    <SupportSection title="Where and when do we train?">
      <p><a className="font-bold underline" href="https://power2adapt.coach/where-we-train">Where we train</a> has venue information, the weekly schedule and Ballam Park membership details. School sessions are for students of that school.</p>
      <p>Confirm your group and session before attending. Contact Coach Al about weather, absences or schedule changes.</p>
    </SupportSection>
    <VenueMeetingPoints />
    <SupportSection title="How do we join?">
      <p>School classes and Team Sport Speed have links to the current booking provider. Junior Academy and Senior Squad have an application process. A discovery call is the best first step if you are unsure.</p>
      <p><a className="font-bold underline" href="/enrollment-guide">Read your first-session guide</a> or <a className="font-bold underline" href="/payment-support">get payment help</a>.</p>
    </SupportSection>
    <SupportSection title="Can we try a session?">
      <p>Every new athlete can have a free trial session. Book a discovery call with Coach Al to choose the right group and arrange a time. Confirm any Ballam Park membership requirements before attending.</p>
    </SupportSection>
    <section id="policies" className="rounded-xl border border-[#e7e1d8] bg-white p-6">
      <h2 className="mb-3 text-2xl font-bold">Safety and program policies</h2>
      <p className="text-[#525759]">Please tell Coach Al about relevant medical conditions, allergies and injuries before training, and keep emergency contact information current. Respect coaches, other athletes and equipment.</p>
      <p className="mt-3 text-[#525759]">Prepaid Setmore appointments are generally rescheduled. Please give more than two hours’ notice if you need to change a booking. For term enrolments, less than two hours’ notice is recorded as late notice; missed sessions without notice are recorded as no-shows. Late notice and no-shows do not receive a credit. Illness and family matters are assessed individually, and Coach Al uses discretion in how the absence is classified. Contact Coach Al to discuss your situation. These arrangements do not limit your rights under Australian Consumer Law.</p>
      <p className="mt-3 text-[#525759]">Ask Coach Al for the policies that apply to your program before booking. For privacy questions or a request to access or correct your information, email info@power2adapt.com.</p>
    </section>
    <SupportSection title="Photos, videos and your choices">
      <p>Private running and hurdle technique videos need permission before recording. For athletes under 18, both parent/guardian and athlete must agree. Public website and social sharing need separate permission; declining does not affect participation.</p>
      <p>Coach Al currently stores private videos in athlete-specific Google Drive folders accessible only to him and sends feedback copies to parents through iMessage or WhatsApp. <a className="font-bold underline" href="/photos-and-videos">Read the photos and videos guidance</a>, including how to change permission or request removal.</p>
    </SupportSection>
    <SupportSection title="What’s included?">
      <p>Foundation and Emerging Athletes include My Athletic Journey app access. Junior Academy and Senior Squad include individual programming, progress testing and app support; see each program page for the membership details.</p>
    </SupportSection>
    <SupportSection title="My athlete is a beginner — where do we start?">
      <p>Tell Coach Al about your athlete’s experience, confidence and goals during the discovery call. Agree on a suitable group and arrange a free trial before committing.</p>
    </SupportSection>
    <SupportSection title="Drop-off and collection">
      <p>Parents and caregivers are responsible for their children before and after the designated class time. Please collect your child on time and tell the coach if collection arrangements change.</p>
      <p>If you are delayed, contact the coach promptly. The coach will try to contact you and arrange for another adult to remain with the child rather than leaving them alone.</p>
      <p>Parents do not need to stay during sessions. You are welcome to stay and watch if you wish, particularly for younger athletes in Prep and Year 1. Agree on the meeting and collection point before attending.</p>
    </SupportSection>
    <SupportSection title="Heat, extreme weather and cancelled classes">
      <p>Sessions do not run when the temperature is above 36°C or in extreme weather conditions. Venue-specific rules may require earlier cancellation.</p>
      <p>If Power2ADAPT cancels a class, everyone booked into that class receives a credit.</p>
      <p>Check your session messages for any changes and contact Coach Al if the plan is unclear. Keep your mobile and email current with your booking provider.</p>
      <p><a className="font-bold underline" href="tel:+61434679395">Call Coach Al on 0434 679 395</a> if you need to clarify arrival or a session change.</p>
    </SupportSection>
    <SupportSection title="I booked but have no confirmation">
      <p>Check your inbox and spam folder, and the account or provider used to book. Check whether payment was taken before submitting another booking.</p>
      <p>An enquiry receipt is not a booking confirmation. If you are unsure, contact Coach Al with your name, athlete, program, date and booking reference. <a className="font-bold underline" href="/payment-support">Get booking and payment help</a>.</p>
    </SupportSection>
    <SupportSection title="What should we bring?">
      <p>Bring a drink bottle, runners and clothes your athlete can move in. Check the program page and any instructions from Coach Al for your session.</p>
      <p>Share relevant injury or health information with Coach Al before training so the session can be discussed appropriately.</p>
    </SupportSection>
  </VisitorSupport>;
}
