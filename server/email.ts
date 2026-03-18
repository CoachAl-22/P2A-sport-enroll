import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@power2adapt.online';
    if (!process.env.RESEND_API_KEY) {
      console.warn('Resend API key not configured. Email notifications will be disabled.');
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.log('Email Service not configured - would send:', { to, subject });
        return false;
      }
      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [to],
        replyTo: 'info@power2adapt.com',
        subject,
        html,
      });
      if (error) { console.error('Failed to send email:', error); return false; }
      console.log(`Email sent successfully: ${data?.id}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendAdminEnquiryNotification(
    enquiryData: { name: string; email: string; phone?: string | null; contactMethod: string; subject: string; message: string },
    adminEmail: string
  ): Promise<boolean> {
    const subject = `🔔 New Contact Enquiry from ${enquiryData.name}`;
    const html = `
      <!DOCTYPE html><html><head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #667eea; }
        .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border-left: 3px solid #667eea; }
        .message-box { background: white; padding: 15px; border-radius: 4px; margin-top: 10px; white-space: pre-wrap; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h2 style="margin:0">New Contact Enquiry</h2><p style="margin:5px 0 0">Power2ADAPT Dashboard</p></div>
          <div class="content">
            <div class="field"><div class="label">From:</div><div class="value">${enquiryData.name}</div></div>
            <div class="field"><div class="label">Email:</div><div class="value"><a href="mailto:${enquiryData.email}">${enquiryData.email}</a></div></div>
            ${enquiryData.phone ? `<div class="field"><div class="label">Phone:</div><div class="value"><a href="tel:${enquiryData.phone}">${enquiryData.phone}</a></div></div>` : ''}
            <div class="field"><div class="label">Preferred Contact Method:</div><div class="value">${enquiryData.contactMethod.charAt(0).toUpperCase() + enquiryData.contactMethod.slice(1)}</div></div>
            <div class="field"><div class="label">Subject:</div><div class="value">${enquiryData.subject.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div></div>
            <div class="field"><div class="label">Message:</div><div class="message-box">${enquiryData.message}</div></div>
            <div style="margin-top:30px;text-align:center"><p>View and manage this enquiry in your <a href="https://power2adapt.online/admin/enquiries" style="color:#667eea;text-decoration:none;font-weight:bold">Admin Dashboard</a></p></div>
          </div>
          <div class="footer"><p>Power2ADAPT Athletic Programs</p></div>
        </div>
      </body></html>`;
    return this.sendEmail(adminEmail, subject, html);
  }

  async sendCustomerEnquiryConfirmation(customerName: string, customerEmail: string, subject: string): Promise<boolean> {
    const emailSubject = `We've received your enquiry - Power2ADAPT`;
    const html = `
      <!DOCTYPE html><html><head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .cta-button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h1 style="margin:0">🏃‍♂️ Power2ADAPT</h1><p style="margin:10px 0 0">Athletic Development Programs</p></div>
          <div class="content">
            <h2>Hi ${customerName}!</h2>
            <div class="message">
              <p>Thank you for reaching out to Power2ADAPT. We've received your enquiry about <strong>${subject.replace(/-/g, ' ')}</strong>.</p>
              <p>Our team will review your message and get back to you within 24 hours.</p>
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>We'll review your enquiry details</li>
                <li>A member of our team will contact you using your preferred method</li>
                <li>We'll answer any questions and help you find the perfect program</li>
              </ul>
              <div style="text-align:center"><a href="https://power2adapt.online" class="cta-button">Visit Our Website</a></div>
            </div>
            <p style="color:#666;font-size:14px;margin-top:20px">If you have any urgent questions, please don't hesitate to call us directly.</p>
          </div>
          <div class="footer"><p><strong>Power2ADAPT</strong></p><p>Building Athletic Excellence</p><p style="margin-top:10px"><a href="https://power2adapt.online" style="color:#667eea;text-decoration:none">www.power2adapt.online</a></p></div>
        </div>
      </body></html>`;
    return this.sendEmail(customerEmail, emailSubject, html);
  }

  async sendAdminApplicationNotification(
    applicationData: {
      athleteFirstName: string; athleteLastName: string; athleteEmail: string; athletePhone: string;
      dateOfBirth: string; schoolYear: string; currentSports: string; athleticGoals: string;
      parentGuardianName?: string | null; parentGuardianEmail?: string | null; parentGuardianPhone?: string | null;
    },
    adminEmail: string,
    applicationType: string = "Senior Squad"
  ): Promise<boolean> {
    const athleteName = `${applicationData.athleteFirstName} ${applicationData.athleteLastName}`;
    const subject = `🔔 New ${applicationType} Application from ${athleteName}`;
    const html = `
      <!DOCTYPE html><html><head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #667eea; }
        .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border-left: 3px solid #667eea; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h2 style="margin:0">New ${applicationType} Application</h2><p style="margin:5px 0 0">Power2ADAPT Dashboard</p></div>
          <div class="content">
            <div class="field"><div class="label">Athlete Name:</div><div class="value">${athleteName}</div></div>
            <div class="field"><div class="label">Email:</div><div class="value"><a href="mailto:${applicationData.athleteEmail}">${applicationData.athleteEmail}</a></div></div>
            <div class="field"><div class="label">Phone:</div><div class="value"><a href="tel:${applicationData.athletePhone}">${applicationData.athletePhone}</a></div></div>
            <div class="field"><div class="label">Date of Birth:</div><div class="value">${applicationData.dateOfBirth}</div></div>
            <div class="field"><div class="label">School Year:</div><div class="value">${applicationData.schoolYear}</div></div>
            ${applicationData.parentGuardianName ? `
              <div class="field"><div class="label">Parent/Guardian:</div><div class="value">
                ${applicationData.parentGuardianName}
                ${applicationData.parentGuardianEmail ? `<br><a href="mailto:${applicationData.parentGuardianEmail}">${applicationData.parentGuardianEmail}</a>` : ''}
                ${applicationData.parentGuardianPhone ? `<br><a href="tel:${applicationData.parentGuardianPhone}">${applicationData.parentGuardianPhone}</a>` : ''}
              </div></div>` : ''}
            <div class="field"><div class="label">Current Sports:</div><div class="value">${applicationData.currentSports}</div></div>
            <div class="field"><div class="label">Athletic Goals:</div><div class="value">${applicationData.athleticGoals}</div></div>
            <div style="margin-top:30px;text-align:center"><p>View full application details in your <a href="https://power2adapt.online/admin" style="color:#667eea;text-decoration:none;font-weight:bold">Admin Dashboard</a></p></div>
          </div>
          <div class="footer"><p>Power2ADAPT Athletic Programs</p></div>
        </div>
      </body></html>`;
    return this.sendEmail(adminEmail, subject, html);
  }

  async sendJuniorAcademyAdminNotification(data: {
    parentName: string; parentEmail: string; parentPhone: string; athleteName: string;
    athleteDob: string; sports: string; activityDays: string; medical: string; injuries?: string;
    availDays: string; commitments?: string; facilities: string; parentGoals: string;
    athleteGoal: string; favSport?: string; nervous?: string; contactPref: string;
    feedbackPref: string; coachNotes?: string; programme: string; photoConsent: string;
  }, adminEmail: string): Promise<boolean> {
    const subject = `🏃 New Junior Academy Application — ${data.athleteName}`;
    const row = (label: string, value: string) =>
      value ? `<tr><td style="padding:8px 12px;font-weight:600;color:#F26522;width:38%;vertical-align:top;border-bottom:1px solid #f3f4f6">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${value}</td></tr>` : '';
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f5;margin:0;padding:20px">
      <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="background:#0a0a0a;padding:24px 28px;border-bottom:3px solid #F26522">
          <h1 style="margin:0;color:#fff;font-size:1.3rem">New Junior Academy Application</h1>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:0.85rem">Power2ADAPT — review and confirm within 48 hours</p>
        </div>
        <div style="padding:28px">
          <h3 style="margin:0 0 10px;color:#0a0a0a;font-size:0.85rem;text-transform:uppercase;letter-spacing:.06em">Parent / Guardian</h3>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:0.9rem">
            ${row('Name', data.parentName)}
            ${row('Email', `<a href="mailto:${data.parentEmail}">${data.parentEmail}</a>`)}
            ${row('Mobile', `<a href="tel:${data.parentPhone}">${data.parentPhone}</a>`)}
          </table>
          <h3 style="margin:0 0 10px;color:#0a0a0a;font-size:0.85rem;text-transform:uppercase;letter-spacing:.06em">Athlete</h3>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:0.9rem">
            ${row('Name', data.athleteName)}
            ${row('Date of Birth', data.athleteDob)}
            ${row('Current Sports', data.sports)}
            ${row('Activity (days/week)', data.activityDays)}
            ${row('Medical / Conditions', data.medical)}
            ${row('Recent Injuries', data.injuries || 'None reported')}
          </table>
          <h3 style="margin:0 0 10px;color:#0a0a0a;font-size:0.85rem;text-transform:uppercase;letter-spacing:.06em">Schedule & Goals</h3>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:0.9rem">
            ${row('Available Days', data.availDays)}
            ${row('Existing Commitments', data.commitments || 'None')}
            ${row('Training Facilities', data.facilities)}
            ${row("Parent's Goals", data.parentGoals)}
            ${row("Athlete's Goal", data.athleteGoal)}
            ${row('Favourite Sport', data.favSport || '—')}
            ${row('Nervousness / Concerns', data.nervous || '—')}
          </table>
          <h3 style="margin:0 0 10px;color:#0a0a0a;font-size:0.85rem;text-transform:uppercase;letter-spacing:.06em">Programme & Communication</h3>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:0.9rem">
            ${row('Programme Selected', data.programme)}
            ${row('Communicate With', data.contactPref)}
            ${row('Feedback Preference', data.feedbackPref)}
            ${row('Extra Notes for Coach', data.coachNotes || '—')}
            ${row('Photo / Video Consent', data.photoConsent)}
          </table>
          <div style="text-align:center;margin-top:24px">
            <a href="https://power2adapt.online/admin/applications" style="background:#F26522;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:600;font-size:0.9rem">View Admin Dashboard</a>
          </div>
        </div>
        <div style="text-align:center;padding:16px;background:#f9fafb;color:#9ca3af;font-size:0.75rem">Power2ADAPT Athletic Programs</div>
      </div>
    </body></html>`;
    return this.sendEmail(adminEmail, subject, html);
  }

  async sendJuniorAcademyApplicantConfirmation(data: {
    parentName: string; parentEmail: string; athleteName: string; programme: string;
  }): Promise<boolean> {
    const subject = `Application received — ${data.athleteName} | Power2ADAPT Junior Academy`;
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f5;margin:0;padding:20px">
      <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="background:#0a0a0a;padding:28px;text-align:center;border-bottom:3px solid #F26522">
          <h1 style="margin:0;color:#fff;font-size:1.5rem;text-transform:uppercase;letter-spacing:.05em">POWER2<span style="color:#F26522">ADAPT</span></h1>
          <p style="margin:6px 0 0;color:#9ca3af;font-size:0.85rem">Junior Academy — Application Received</p>
        </div>
        <div style="padding:32px">
          <h2 style="margin:0 0 8px;color:#0a0a0a">Hi ${data.parentName}! 👋</h2>
          <p style="color:#374151;line-height:1.7">We've received <strong>${data.athleteName}'s</strong> application for the <strong>${data.programme}</strong>.</p>
          <p style="color:#374151;line-height:1.7">Alistair will personally review the application and be in touch within <strong>48 hours</strong> to confirm the next steps.</p>
          <div style="background:#fff5f0;border:1.5px solid rgba(242,101,34,0.2);border-radius:10px;padding:20px;margin:24px 0">
            <h4 style="margin:0 0 12px;color:#F26522;font-size:0.8rem;text-transform:uppercase;letter-spacing:.08em">What happens next</h4>
            <p style="margin:0 0 10px;color:#374151;font-size:0.9rem"><strong>1. Profile review</strong> — Alistair will go through the application and build a personalised programme.</p>
            <p style="margin:0 0 10px;color:#374151;font-size:0.9rem"><strong>2. Personal intro</strong> — Alistair will reach out to introduce himself before training begins.</p>
            <p style="margin:0;color:#374151;font-size:0.9rem"><strong>3. Programme delivery</strong> — delivered through Final Surge. Check your inbox for login details.</p>
          </div>
          <p style="color:#6b7280;font-size:0.88rem">Questions in the meantime? Reply to this email or call <a href="tel:+61434679395" style="color:#F26522">+61 434 679 395</a>.</p>
          <div style="text-align:center;margin-top:28px">
            <a href="https://www.power2adapt.online" style="background:#F26522;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:600;font-size:0.9rem">Visit Power2ADAPT</a>
          </div>
        </div>
        <div style="text-align:center;padding:16px;background:#f9fafb;color:#9ca3af;font-size:0.75rem">© 2026 Power2ADAPT Athletic Programs · <a href="https://www.power2adapt.online" style="color:#9ca3af">www.power2adapt.online</a></div>
      </div>
    </body></html>`;
    return this.sendEmail(data.parentEmail, subject, html);
  }
}

export const emailService = new EmailService();
