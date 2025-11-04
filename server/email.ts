import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private fromEmail: string;

  constructor() {
    // Default to onboarding@resend.dev for testing, or use your verified domain
    this.fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    
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
        subject: subject,
        html: html,
      });

      if (error) {
        console.error('Failed to send email:', error);
        return false;
      }

      console.log(`Email sent successfully: ${data?.id}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Contact enquiry notification email to admin
  async sendAdminEnquiryNotification(
    enquiryData: {
      name: string;
      email: string;
      phone?: string | null;
      contactMethod: string;
      subject: string;
      message: string;
    },
    adminEmail: string
  ): Promise<boolean> {
    const subject = `🔔 New Contact Enquiry from ${enquiryData.name}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #667eea; }
            .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border-left: 3px solid #667eea; }
            .message-box { background: white; padding: 15px; border-radius: 4px; margin-top: 10px; white-space: pre-wrap; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">New Contact Enquiry</h2>
              <p style="margin: 5px 0 0 0;">Power2ADAPT Dashboard</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">From:</div>
                <div class="value">${enquiryData.name}</div>
              </div>
              
              <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${enquiryData.email}">${enquiryData.email}</a></div>
              </div>
              
              ${enquiryData.phone ? `
                <div class="field">
                  <div class="label">Phone:</div>
                  <div class="value"><a href="tel:${enquiryData.phone}">${enquiryData.phone}</a></div>
                </div>
              ` : ''}
              
              <div class="field">
                <div class="label">Preferred Contact Method:</div>
                <div class="value">${enquiryData.contactMethod.charAt(0).toUpperCase() + enquiryData.contactMethod.slice(1)}</div>
              </div>
              
              <div class="field">
                <div class="label">Subject:</div>
                <div class="value">${enquiryData.subject.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
              </div>
              
              <div class="field">
                <div class="label">Message:</div>
                <div class="message-box">${enquiryData.message}</div>
              </div>
              
              <div style="margin-top: 30px; text-align: center;">
                <p>View and manage this enquiry in your <a href="https://power2adapt.online/admin/enquiries" style="color: #667eea; text-decoration: none; font-weight: bold;">Admin Dashboard</a></p>
              </div>
            </div>
            <div class="footer">
              <p>Power2ADAPT Athletic Programs</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(adminEmail, subject, html);
  }

  // Contact enquiry confirmation email to customer
  async sendCustomerEnquiryConfirmation(
    customerName: string,
    customerEmail: string,
    subject: string
  ): Promise<boolean> {
    const emailSubject = `We've received your enquiry - Power2ADAPT`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .cta-button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🏃‍♂️ Power2ADAPT</h1>
              <p style="margin: 10px 0 0 0;">Athletic Development Programs</p>
            </div>
            <div class="content">
              <h2>Hi ${customerName}!</h2>
              
              <div class="message">
                <p>Thank you for reaching out to Power2ADAPT. We've received your enquiry about <strong>${subject.replace(/-/g, ' ')}</strong>.</p>
                
                <p>Our team will review your message and get back to you within 24 hours. We're excited to help you on your athletic journey!</p>
                
                <p><strong>What happens next?</strong></p>
                <ul>
                  <li>We'll review your enquiry details</li>
                  <li>A member of our team will contact you using your preferred method</li>
                  <li>We'll answer any questions and help you find the perfect program</li>
                </ul>
                
                <p>In the meantime, feel free to explore our programs and read about our coaching approach on our website.</p>
                
                <div style="text-align: center;">
                  <a href="https://power2adapt.online" class="cta-button">Visit Our Website</a>
                </div>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                If you have any urgent questions, please don't hesitate to call us directly.
              </p>
            </div>
            <div class="footer">
              <p><strong>Power2ADAPT</strong></p>
              <p>Building Athletic Excellence</p>
              <p style="margin-top: 10px;">
                <a href="https://power2adapt.online" style="color: #667eea; text-decoration: none;">www.power2adapt.online</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(customerEmail, emailSubject, html);
  }
}

export const emailService = new EmailService();
