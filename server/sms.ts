import twilio from 'twilio';

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export interface SMSMessage {
  to: string;
  message: string;
}

export class SMSService {
  private fromNumber: string;

  constructor() {
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
    
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !this.fromNumber) {
      console.warn('Twilio credentials not configured. SMS notifications will be disabled.');
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      if (!this.fromNumber) {
        console.log('SMS Service not configured - would send:', { to, message });
        return false;
      }

      // Format phone number (ensure it starts with +)
      const formattedTo = to.startsWith('+') ? to : `+61${to.replace(/^0/, '')}`;
      
      const result = await client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedTo,
      });

      console.log(`SMS sent successfully: ${result.sid}`);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  // Enrollment confirmation SMS
  async sendEnrollmentConfirmation(
    parentPhone: string, 
    childName: string, 
    className: string, 
    venue: string,
    startDate: string
  ): Promise<boolean> {
    const message = `Great news! ${childName} is enrolled in ${className} at ${venue}. Classes start ${startDate}. Payment details will follow shortly. Thanks for choosing Power2ADAPT! 🏃‍♂️`;
    
    return this.sendSMS(parentPhone, message);
  }

  // Payment confirmation SMS
  async sendPaymentConfirmation(
    parentPhone: string,
    childName: string,
    amount: string,
    className: string
  ): Promise<boolean> {
    const message = `Payment confirmed! $${amount} received for ${childName}'s ${className}. Your child's spot is now fully secured. We're excited to see them in action! 🎯`;
    
    return this.sendSMS(parentPhone, message);
  }

  // Class reminder SMS (sent day before)
  async sendClassReminder(
    parentPhone: string,
    childName: string,
    className: string,
    venue: string,
    time: string,
    date: string
  ): Promise<boolean> {
    const message = `Reminder: ${childName}'s ${className} is tomorrow at ${time} at ${venue}. Don't forget water bottle and comfortable clothes. See you there! ⚡`;
    
    return this.sendSMS(parentPhone, message);
  }

  // Term renewal reminder SMS (sent 1 month before)
  async sendTermRenewalReminder(
    parentPhone: string,
    childName: string,
    className: string,
    currentTerm: string,
    nextTerm: string
  ): Promise<boolean> {
    const message = `Hi! ${nextTerm} enrollment opens next week for ${childName}'s ${className}. Secure their spot early for continued athletic development! 🌟`;
    
    return this.sendSMS(parentPhone, message);
  }

  // Waitlist notification SMS
  async sendWaitlistNotification(
    parentPhone: string,
    childName: string,
    className: string
  ): Promise<boolean> {
    const message = `Exciting news! A spot has opened up for ${childName} in ${className}. You have 48 hours to confirm enrollment. Reply CONFIRM or login to secure the spot! 🎉`;
    
    return this.sendSMS(parentPhone, message);
  }

  // Class cancellation SMS
  async sendClassCancellation(
    parentPhone: string,
    childName: string,
    className: string,
    date: string,
    reason?: string
  ): Promise<boolean> {
    const baseMessage = `Important update: ${childName}'s ${className} on ${date} has been cancelled`;
    const reasonText = reason ? ` due to ${reason}` : '';
    const message = `${baseMessage}${reasonText}. We'll notify you about makeup classes. Sorry for any inconvenience!`;
    
    return this.sendSMS(parentPhone, message);
  }

  // Welcome SMS for new families
  async sendWelcomeMessage(
    parentPhone: string,
    parentName: string
  ): Promise<boolean> {
    const message = `Welcome to Power2ADAPT, ${parentName}! We're thrilled to have your family join our athletic community. Your child's sporting journey starts here! 🏆`;
    
    return this.sendSMS(parentPhone, message);
  }
}

export const smsService = new SMSService();