import { InvoiceGenerator, generateInvoiceNumber } from './invoiceGenerator';
import { storage } from './storage';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export class InvoiceService {
  private invoiceGenerator: InvoiceGenerator;

  constructor() {
    this.invoiceGenerator = new InvoiceGenerator();
  }

  async generateInvoiceForPayment(paymentId: string): Promise<{ invoiceNumber: string; pdfPath: string }> {
    // Get payment details with all related information
    const paymentData = await storage.getPaymentWithDetails(paymentId);
    
    if (!paymentData) {
      throw new Error('Payment not found');
    }

    const { payment, enrollment, child, parent, class: classInfo, venue, termConfig } = paymentData;

    // Generate invoice number if not exists
    const invoiceNumber = payment.invoiceNumber || generateInvoiceNumber();

    // Calculate pricing details
    const basePrice = parseFloat(payment.amount.toString());
    const gstAmount = basePrice * 0.1; // 10% GST
    const totalAmount = basePrice + gstAmount;

    // Format term dates
    const termStartDate = termConfig?.startDate ? 
      new Date(termConfig.startDate).toLocaleDateString('en-AU') : 'TBA';
    const termEndDate = termConfig?.endDate ? 
      new Date(termConfig.endDate).toLocaleDateString('en-AU') : 'TBA';

    // Get class schedule info
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const classDay = classInfo?.dayOfWeek ? dayNames[classInfo.dayOfWeek] : 'TBA';

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber,
      date: new Date().toLocaleDateString('en-AU'),
      dueDate: payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('en-AU') : 'Immediate',
      parentName: `${parent.firstName} ${parent.lastName}`,
      parentEmail: parent.email || 'No email provided',
      childName: `${child.firstName} ${child.lastName}`,
      className: classInfo?.name || 'Class TBA',
      venueName: venue?.name || 'Venue TBA',
      termName: termConfig?.name || 'Term TBA',
      termStartDate,
      termEndDate,
      classTime: `${classInfo?.startTime || 'TBA'} - ${classInfo?.endTime || 'TBA'}`,
      classDay,
      totalWeeks: termConfig?.weeksCount || 0,
      effectiveWeeks: termConfig?.weeksCount || 0, // Will be calculated with holidays later
      basePrice: basePrice / 1.1, // Remove GST to get base price
      gstAmount: basePrice * 0.1,
      totalAmount: basePrice,
      paymentStatus: payment.status === 'completed' ? 'paid' as const : 'pending' as const,
      paymentMethod: payment.stripePaymentIntentId ? 'Credit Card (Stripe)' : undefined,
      transactionId: payment.stripePaymentIntentId,
    };

    // Generate PDF
    const pdfBuffer = this.invoiceGenerator.generateInvoice(invoiceData);

    // Save PDF to file system
    const invoicesDir = join(process.cwd(), 'invoices');
    try {
      mkdirSync(invoicesDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }

    const pdfPath = join(invoicesDir, `invoice-${invoiceNumber}.pdf`);
    writeFileSync(pdfPath, pdfBuffer);

    // Update payment with invoice details
    await storage.updatePaymentInvoice(paymentId, invoiceNumber, pdfPath);

    return {
      invoiceNumber,
      pdfPath,
    };
  }

  async getInvoicePdfPath(paymentId: string): Promise<string | null> {
    const payment = await storage.getPayment(paymentId);
    return payment?.invoicePdfPath || null;
  }

  async hasInvoice(paymentId: string): Promise<boolean> {
    const payment = await storage.getPayment(paymentId);
    return payment?.invoiceGenerated || false;
  }
}