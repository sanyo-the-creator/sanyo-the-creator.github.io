import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface InvoiceItem {
  id: string;
  url: string;
  views: number;
  earnings_cents: number;
  platform: string;
}

export interface InvoiceData {
  id: string;
  created_at: string;
  amount_cents: number;
  payment_method: string;
  payment_details: string;
  user_name: string;
  user_email: string;
  items: InvoiceItem[];
}

export const generateInvoicePDF = async (data: InvoiceData) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(26, 26, 46); // Dark theme color
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('UPSHIFT', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('CREATOR PAYOUT INVOICE', pageWidth - 20, 25, { align: 'right' });
  
  // Invoice Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text('BILL TO:', 20, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(data.user_name, 20, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(data.user_email, 20, 65);
  
  doc.text('INVOICE DETAILS:', pageWidth - 20, 55, { align: 'right' });
  doc.text(`Invoice ID: ${data.id.substring(0, 8)}`, pageWidth - 20, 60, { align: 'right' });
  doc.text(`Date: ${new Date(data.created_at).toLocaleDateString()}`, pageWidth - 20, 65, { align: 'right' });
  doc.text(`Method: ${data.payment_method}`, pageWidth - 20, 70, { align: 'right' });
  
  // Table Header
  const tableTop = 90;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, tableTop, pageWidth - 40, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Description (Video URL)', 25, tableTop + 7);
  doc.text('Views', pageWidth - 80, tableTop + 7, { align: 'right' });
  doc.text('Platform', pageWidth - 50, tableTop + 7, { align: 'right' });
  doc.text('Amount', pageWidth - 25, tableTop + 7, { align: 'right' });
  
  // Table Rows
  doc.setFont('helvetica', 'normal');
  let currentY = tableTop + 17;
  
  data.items.forEach((item, index) => {
    if (currentY > 270) {
      doc.addPage();
      currentY = 20;
    }
    
    const url = item.url.length > 50 ? item.url.substring(0, 47) + '...' : item.url;
    doc.text(url, 25, currentY);
    doc.text(item.views.toLocaleString(), pageWidth - 80, currentY, { align: 'right' });
    doc.text(item.platform, pageWidth - 50, currentY, { align: 'right' });
    doc.text(`$${(item.earnings_cents / 100).toFixed(2)}`, pageWidth - 25, currentY, { align: 'right' });
    
    currentY += 8;
    
    // Bottom border for each row
    doc.setDrawColor(230, 230, 230);
    doc.line(20, currentY - 2, pageWidth - 20, currentY - 2);
    currentY += 2;
  });
  
  // Total
  currentY += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL PAID:', pageWidth - 60, currentY, { align: 'right' });
  doc.setTextColor(59, 130, 246); // Blue color
  doc.text(`$${(data.amount_cents / 100).toFixed(2)}`, pageWidth - 25, currentY, { align: 'right' });
  
  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const footerText = 'Thank you for your contribution to Upshift. This is an automatically generated document for your accounting records.';
  doc.text(footerText, pageWidth / 2, 285, { align: 'center' });
  
  // Save PDF
  doc.save(`Upshift_Invoice_${data.id.substring(0, 8)}.pdf`);
};
