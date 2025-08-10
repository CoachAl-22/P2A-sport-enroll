import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  parentName: string;
  parentEmail: string;
  parentAddress?: string;
  childName: string;
  className: string;
  venueName: string;
  termName: string;
  termStartDate: string;
  termEndDate: string;
  classTime: string;
  classDay: string;
  totalWeeks: number;
  effectiveWeeks: number;
  basePrice: number;
  gstAmount: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  paymentMethod?: string;
  transactionId?: string;
}

export class InvoiceGenerator {
  private doc: jsPDF;
  private readonly companyInfo = {
    name: 'Power2ADAPT',
    address: 'Melbourne, Victoria',
    phone: 'Contact via portal',
    email: 'info@power2adapt.online',
    website: 'www.power2adapt.online',
    abn: 'ABN: [Your ABN Number]' // Update with actual ABN
  };

  constructor() {
    this.doc = new jsPDF();
  }

  generateInvoice(data: InvoiceData): Buffer {
    this.doc = new jsPDF();
    this.addHeader();
    this.addCompanyInfo();
    this.addInvoiceDetails(data);
    this.addClientInfo(data);
    this.addInvoiceTable(data);
    this.addPaymentInfo(data);
    this.addFooter();
    
    return Buffer.from(this.doc.output('arraybuffer'));
  }

  private addHeader() {
    // Company logo area (you can add actual logo later)
    this.doc.setFillColor(41, 128, 185); // Power2ADAPT blue
    this.doc.rect(20, 20, 170, 25, 'F');
    
    // Company name
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('POWER2ADAPT', 25, 38);
    
    // Tagline
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Athletic Program Management', 25, 42);
    
    // Invoice title
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('INVOICE', 150, 65);
  }

  private addCompanyInfo() {
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(80, 80, 80);
    
    const startY = 55;
    this.doc.text(this.companyInfo.name, 20, startY);
    this.doc.text(this.companyInfo.address, 20, startY + 5);
    this.doc.text(this.companyInfo.email, 20, startY + 10);
    this.doc.text(this.companyInfo.website, 20, startY + 15);
    this.doc.text(this.companyInfo.abn, 20, startY + 20);
  }

  private addInvoiceDetails(data: InvoiceData) {
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const startY = 75;
    const startX = 120;
    
    // Invoice details box
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(startX, startY - 5, 70, 35);
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Invoice #:', startX + 5, startY + 5);
    this.doc.text('Date:', startX + 5, startY + 12);
    this.doc.text('Due Date:', startX + 5, startY + 19);
    this.doc.text('Status:', startX + 5, startY + 26);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.invoiceNumber, startX + 35, startY + 5);
    this.doc.text(data.date, startX + 35, startY + 12);
    this.doc.text(data.dueDate, startX + 35, startY + 19);
    
    // Status color coding
    const statusColor = data.paymentStatus === 'paid' ? [0, 150, 0] : 
                       data.paymentStatus === 'overdue' ? [220, 0, 0] : [255, 140, 0];
    this.doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(data.paymentStatus.toUpperCase(), startX + 35, startY + 26);
  }

  private addClientInfo(data: InvoiceData) {
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Bill To:', 20, 125);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.parentName, 20, 135);
    this.doc.text(data.parentEmail, 20, 142);
    if (data.parentAddress) {
      this.doc.text(data.parentAddress, 20, 149);
    }
  }

  private addInvoiceTable(data: InvoiceData) {
    const tableData = [
      [
        'Program Enrollment',
        `${data.className}\n${data.childName}\n${data.venueName}`,
        '1',
        `$${data.basePrice.toFixed(2)}`,
        `$${data.basePrice.toFixed(2)}`
      ]
    ];

    // Add term details row
    tableData.push([
      'Term Details',
      `${data.termName}\n${data.termStartDate} - ${data.termEndDate}\n${data.classDay} at ${data.classTime}\n${data.effectiveWeeks} weeks (${data.totalWeeks} total, excluding holidays)`,
      '-',
      '-',
      '-'
    ]);

    const tableOptions = {
      startY: 165,
      head: [['Description', 'Details', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'grid' as const,
      styles: {
        fontSize: 9,
        cellPadding: 8,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 80 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
      },
    };

    (this.doc as any).autoTable(tableOptions);

    // Add totals
    const finalY = (this.doc as any).lastAutoTable.finalY + 10;
    this.addTotalsSection(data, finalY);
  }

  private addTotalsSection(data: InvoiceData, startY: number) {
    const rightX = 170;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    // Subtotal
    this.doc.text('Subtotal:', rightX - 40, startY);
    this.doc.text(`$${data.basePrice.toFixed(2)}`, rightX, startY, { align: 'right' });
    
    // GST
    this.doc.text('GST (10%):', rightX - 40, startY + 7);
    this.doc.text(`$${data.gstAmount.toFixed(2)}`, rightX, startY + 7, { align: 'right' });
    
    // Total line
    this.doc.setDrawColor(0, 0, 0);
    this.doc.line(rightX - 40, startY + 12, rightX, startY + 12);
    
    // Total amount
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('TOTAL:', rightX - 40, startY + 20);
    this.doc.text(`$${data.totalAmount.toFixed(2)}`, rightX, startY + 20, { align: 'right' });
  }

  private addPaymentInfo(data: InvoiceData) {
    const startY = 240;
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Payment Information', 20, startY);
    
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    
    if (data.paymentStatus === 'paid' && data.paymentMethod) {
      this.doc.text(`Payment Method: ${data.paymentMethod}`, 20, startY + 10);
      if (data.transactionId) {
        this.doc.text(`Transaction ID: ${data.transactionId}`, 20, startY + 17);
      }
      this.doc.setTextColor(0, 150, 0);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('✓ PAYMENT RECEIVED - Thank you!', 20, startY + 25);
    } else {
      this.doc.setTextColor(220, 0, 0);
      this.doc.text('Payment is required to secure enrollment.', 20, startY + 10);
      this.doc.setTextColor(0, 0, 0);
      this.doc.text('Please complete payment through the Power2ADAPT portal.', 20, startY + 17);
    }
  }

  private addFooter() {
    const pageHeight = this.doc.internal.pageSize.height;
    const footerY = pageHeight - 20;
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    
    this.doc.text('Thank you for choosing Power2ADAPT!', 20, footerY);
    this.doc.text('Visit www.power2adapt.online for program updates and resources.', 20, footerY + 5);
    
    // Add page number
    this.doc.text('Page 1 of 1', 190, footerY, { align: 'right' });
  }
}

// Helper function to generate invoice number
export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `P2A-${year}${month}-${random}`;
}