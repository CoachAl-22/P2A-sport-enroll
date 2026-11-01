import { VisitorSupport, SupportSection } from '@/components/visitor-support';
import { EMAIL_ENQUIRY_URL } from '@/content/contact';
export default function PhotosAndVideos() {
  return <VisitorSupport title="Photos and videos" intro="Your athlete can take part without agreeing to photography or publicity. Private technique feedback and public sharing have separate permissions.">
    <SupportSection title="Private technique feedback">
      <p>For one-to-one coaching and specific running or hurdle technique improvement, Coach Al asks permission before taking video. For an athlete under 18, both the parent or legal guardian and the athlete must agree. Adult athletes choose for themselves.</p>
      <p>These recordings help the athlete understand and improve their technique. They are shared only with that client/athlete and their parent or guardian for coaching feedback. Permission for private feedback does not authorise public sharing.</p>
    </SupportSection>
    <SupportSection title="Website and social media are separate choices">
      <p>With separate permission, photos or videos may be shared on the Power2ADAPT website or social media to celebrate progress and encourage other athletes. You can agree to private coaching recordings and decline either or both public channels.</p>
      <p>For athletes under 18, public use needs parent/guardian permission and the athlete’s agreement. The coach checks the athlete is comfortable before recording and before public use. They can say no or stop even if a parent has agreed.</p>
      <p>Printed promotions, paid advertising, use in AI tools or a new purpose require separate, specific permission. A school permission form or permission for coaching is not treated as automatic permission for Power2ADAPT publicity.</p>
    </SupportSection>
    <SupportSection title="How private videos are stored and sent">
      <p>Private videos are stored in athlete-specific Google Drive folders. At present, only Coach Al has access to those folders. Copies are sent to parents through iMessage or WhatsApp for private feedback; adult-client sharing arrangements are agreed with the athlete.</p>
      <p>Sending a video creates a copy on the recipient’s messaging service or device. These services have their own storage and privacy arrangements. Please keep coaching videos private and do not forward images of other athletes without permission.</p>
      <p>Ask Coach Al how long a particular recording is retained, or request its review or deletion. Do not assume a publicly shared or downloaded copy can be retrieved from someone else’s account or device.</p>
    </SupportSection>
    <SupportSection title="Changing your mind or requesting removal">
      <p><a className="font-bold underline" href={EMAIL_ENQUIRY_URL}>Email info@power2adapt.com</a> to change or withdraw permission or request removal. Identify the recording or post and tell us how to contact you; avoid sending sensitive information in a public comment.</p>
      <p>Withdrawal stops new use under that permission. We will review removal from channels we control and explain the action we can take. We cannot guarantee removal of copies already saved or shared by others.</p>
      <p>Saying no to photography or publicity does not affect access to coaching. Coaches need the current permission record and the athlete’s agreement before taking or using an image.</p>
    </SupportSection>
    <SupportSection title="Keeping images appropriate">
      <p>Before public use, check that every identifiable athlete has the required permission, is appropriately dressed and is comfortable with the image. Do not publish changing-room images, embarrassing material, personal contact details or a child’s full name, school or live whereabouts alongside their image.</p>
      <p>Parents and spectators should check permission before photographing or sharing images of other children. Please raise any image concern with Coach Al promptly.</p>
    </SupportSection>
    <SupportSection title="If you book through Setmore or SportsBiz">
      <p>Booking or paying is not photo/video permission. If your provider has not recorded these separate choices, arrange them directly with Coach Al before any recording or public use. The coach must still check the athlete’s agreement. <a className="font-bold underline" href="/photo-video-permission.html">Print a permission form to complete with Coach Al</a>.</p>
    </SupportSection>
  </VisitorSupport>;
}
