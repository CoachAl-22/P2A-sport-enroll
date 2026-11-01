import { VisitorSupport, SupportSection } from '@/components/visitor-support';
export default function PaymentSupport() {
  return <VisitorSupport title="Payment Support" intro="Payment arrangements depend on your program and booking provider. Confirm the total before you pay.">
    <SupportSection title="Fees and GST">
      <p>Foundation, Emerging Athletes and Team Sport Speed are listed at $30 + GST per class ($33 including GST). The number of sessions and term length determine the total.</p>
      <p>Junior Academy, Senior Squad and High Performance have their own fees and commitments. <a className="font-bold underline" href="/programs">Choose your program</a> to see its fee information.</p>
      <p>Check <a className="font-bold underline" href="https://power2adapt.coach/where-we-train">Where we train</a> for Ballam Park membership information and confirm any additional venue costs.</p>
    </SupportSection>
    <SupportSection title="Where do I pay?">
      <p>Follow the booking link for your chosen class, or the instructions Coach Al provides after your application is accepted. Check the provider, session and total before entering payment details.</p>
      <p>This help page does not take payments. Use the provider’s confirmation and receipt to check your booking.</p>
    </SupportSection>
    <SupportSection title="Payment failed or confirmation missing?">
      <p>Check whether you received a confirmation or were charged before trying again. Contact the booking provider or Coach Al if anything is unclear.</p>
      <p>Include the athlete’s name, program, booking date and any reference number. Do not email card details or passwords.</p>
    </SupportSection>
    <SupportSection title="Cancellations, refunds and changes">
      <p>If a prepaid Setmore appointment is cancelled with less than two hours’ notice, contact Coach Al to reschedule. For term bookings, late notice (less than two hours) and no-shows do not receive a credit. Coach Al considers illness and family circumstances individually and may offer makeup classes or refunds. These arrangements do not limit your rights under Australian Consumer Law.</p>
    </SupportSection>
  </VisitorSupport>;
}
