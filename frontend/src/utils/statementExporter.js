import { jsPDF } from 'jspdf';

/**
 * Downloads a structured CSV file with UTF-8 BOM for Microsoft Excel compatibility
 */
function downloadCsv(content, filename) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Customer Statement to Excel / CSV format
 */
export function exportCustomerStatementCsv(customer, transactions = [], merchant = {}) {
  const shopName = merchant.shopName || 'Digital Udhaar Khata';
  let csv = `Digital Udhaar Khata - Customer Account Statement\r\n`;
  csv += `Shop Name,"${shopName}"\r\n`;
  csv += `Merchant Name,"${merchant.name || '-'}"\r\n`;
  csv += `Customer Name,"${customer.name}"\r\n`;
  csv += `Phone,"${customer.phone}"\r\n`;
  csv += `Net Balance,"₹${customer.netBalance || 0}"\r\n`;
  csv += `Total Udhaar Given,"₹${customer.totalGiven || 0}"\r\n`;
  csv += `Total Paisa Received,"₹${customer.totalReceived || 0}"\r\n`;
  csv += `Credit Limit,"₹${customer.creditLimit || 10000}"\r\n`;
  csv += `Risk Level,"${customer.riskLevel || 'LOW'}"\r\n`;
  csv += `Statement Date,"${new Date().toLocaleString('en-IN')}"\r\n\r\n`;

  // Transactions Header
  csv += `"ID","Date","Type","Amount (INR)","Payment Mode","Note","Due Date","Reminder Status"\r\n`;

  transactions.forEach((t) => {
    const isGive = t.type === 'GIVE';
    const typeLabel = isGive ? 'UDHAAR DIYA (-)' : 'PAISA MILA (+)';
    const dateStr = new Date(t.transactionDate || t.createdAt).toLocaleString('en-IN');
    const dueStr = t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN') : '-';
    const noteClean = (t.note || '-').replace(/"/g, '""');

    csv += `"${t.id}","${dateStr}","${typeLabel}","${t.amount}","${t.paymentMode || 'CASH'}","${noteClean}","${dueStr}","${t.reminderStatus || 'NONE'}"\r\n`;
  });

  const safeName = (customer.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
  downloadCsv(csv, `Statement_${safeName}.csv`);
}

/**
 * Export Entire Customer Directory & Ledger balances to CSV
 */
export function exportAllCustomersCsv(customers = []) {
  let csv = `Digital Udhaar Khata - Full Customer Directory & Balances\r\n`;
  csv += `Generated At,"${new Date().toLocaleString('en-IN')}"\r\n`;
  csv += `Total Accounts,"${customers.length}"\r\n\r\n`;

  csv += `"Customer ID","Name","Phone","Email","Address","Net Balance (INR)","Status","Total Given","Total Received","Credit Limit","Risk Level"\r\n`;

  customers.forEach((c) => {
    const nameClean = (c.name || '').replace(/"/g, '""');
    const emailClean = (c.email || '-').replace(/"/g, '""');
    const addrClean = (c.address || '-').replace(/"/g, '""');

    csv += `"${c.id}","${nameClean}","${c.phone}","${emailClean}","${addrClean}","${c.netBalance || 0}","${c.status || 'SETTLED'}","${c.totalGiven || 0}","${c.totalReceived || 0}","${c.creditLimit || 10000}","${c.riskLevel || 'LOW'}"\r\n`;
  });

  downloadCsv(csv, `Digital_Udhaar_Khata_All_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Generates and downloads a high-fidelity PDF Account Statement using jsPDF
 */
export function generateCustomerPdfStatement(customer, transactions = [], merchant = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const shopName = merchant.shopName || 'Digital Udhaar Khata';
  const merchantName = merchant.name || 'Store Merchant';
  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Colors
  const primaryDark = [15, 23, 42]; // #0f172a
  const accentIndigo = [79, 70, 229]; // #4f46e5
  const emeraldGreen = [22, 163, 74]; // #16a34a
  const roseRed = [220, 38, 38]; // #dc2626
  const textMuted = [100, 116, 139]; // #64748b

  // Top Header Banner
  doc.setFillColor(...primaryDark);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Decorative Accent Line
  doc.setFillColor(...accentIndigo);
  doc.rect(0, 35, pageWidth, 2.5, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(shopName.toUpperCase(), 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Proprietor: ${merchantName}  |  Official Ledger Statement`, 14, 23);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 29);

  // Statement Label on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('KHATA STATEMENT', pageWidth - 14, 20, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Powered by Digital Udhaar Khata', pageWidth - 14, 26, { align: 'right' });

  // Customer Profile Card Box
  let y = 48;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 24, 3, 3, 'FD');

  doc.setTextColor(...primaryDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(customer.name, 19, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.text(`Phone: ${customer.phone}`, 19, y + 15);
  if (customer.email) doc.text(`Email: ${customer.email}`, 70, y + 15);
  if (customer.address) doc.text(`Address: ${customer.address}`, 19, y + 20);

  // Risk Rating Badge in Customer Box
  const riskColor = customer.riskLevel === 'HIGH' ? roseRed : customer.riskLevel === 'MEDIUM' ? [217, 119, 6] : emeraldGreen;
  doc.setTextColor(...riskColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Risk Rating: ${customer.riskLevel || 'LOW'}`, pageWidth - 20, y + 10, { align: 'right' });

  // Financial Metrics Summary Cards
  y = 78;
  const cardWidth = (pageWidth - 28 - 8) / 3;

  // Metric 1: Net Balance
  const owes = customer.netBalance > 0;
  doc.setFillColor(owes ? 254 : 240, owes ? 242 : 253, owes ? 242 : 244);
  doc.setDrawColor(owes ? 254 : 187, owes ? 202 : 247, owes ? 202 : 208);
  doc.roundedRect(14, y, cardWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...(owes ? roseRed : emeraldGreen));
  doc.text('NET BALANCE', 18, y + 6);
  doc.setFontSize(13);
  doc.text(`Rs. ${Math.abs(customer.netBalance || 0).toLocaleString()}`, 18, y + 14);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(owes ? '(Customer Owes)' : '(Advance / Settled)', 18, y + 18);

  // Metric 2: Total Given
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14 + cardWidth + 4, y, cardWidth, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('TOTAL UDHAAR GIVEN', 18 + cardWidth + 4, y + 6);
  doc.setFontSize(13);
  doc.setTextColor(...roseRed);
  doc.text(`Rs. ${(customer.totalGiven || 0).toLocaleString()}`, 18 + cardWidth + 4, y + 14);

  // Metric 3: Total Received
  doc.roundedRect(14 + (cardWidth * 2) + 8, y, cardWidth, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('TOTAL PAISA RECEIVED', 18 + (cardWidth * 2) + 8, y + 6);
  doc.setFontSize(13);
  doc.setTextColor(...emeraldGreen);
  doc.text(`Rs. ${(customer.totalReceived || 0).toLocaleString()}`, 18 + (cardWidth * 2) + 8, y + 14);

  // Transactions Section Header
  y = 106;
  doc.setTextColor(...primaryDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TRANSACTION LEDGER HISTORY', 14, y);

  // Table Column Headers
  y = 112;
  doc.setFillColor(...primaryDark);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('#', 17, y + 5);
  doc.text('Date & Time', 25, y + 5);
  doc.text('Type', 65, y + 5);
  doc.text('Amount', 105, y + 5);
  doc.text('Mode', 130, y + 5);
  doc.text('Note / Items', 150, y + 5);
  doc.text('Due Date', pageWidth - 16, y + 5, { align: 'right' });

  // Table Rows
  y += 7;
  let rowCount = 0;
  transactions.forEach((tx, index) => {
    // Check if new page is needed
    if (y > 265) {
      doc.addPage();
      y = 20;
    }

    const isGive = tx.type === 'GIVE';
    const isEven = index % 2 === 0;

    // Row zebra background
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(14, y, pageWidth - 28, 7.5, 'F');

    // Index & Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryDark);
    doc.text(`${index + 1}`, 17, y + 5);

    const dateStr = new Date(tx.transactionDate || tx.createdAt).toLocaleDateString('en-IN');
    doc.text(dateStr, 25, y + 5);

    // Color-coded Type
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(isGive ? roseRed : emeraldGreen));
    doc.text(isGive ? 'UDHAAR DIYA (-)' : 'PAISA MILA (+)', 65, y + 5);

    // Amount
    doc.setTextColor(...primaryDark);
    doc.text(`Rs. ${parseFloat(tx.amount).toLocaleString()}`, 105, y + 5);

    // Mode
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text(tx.paymentMode || 'CASH', 130, y + 5);

    // Note (Truncated to fit)
    const noteText = (tx.note || '-').length > 22 ? (tx.note || '').substring(0, 20) + '...' : (tx.note || '-');
    doc.text(noteText, 150, y + 5);

    // Due Date
    const dueStr = tx.dueDate ? new Date(tx.dueDate).toLocaleDateString('en-IN') : '-';
    doc.text(dueStr, pageWidth - 16, y + 5, { align: 'right' });

    y += 7.5;
    rowCount++;
  });

  if (transactions.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(14, y, pageWidth - 28, 12, 'F');
    doc.setTextColor(...textMuted);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.text('No transaction entries recorded for this account.', pageWidth / 2, y + 8, { align: 'center' });
    y += 12;
  }

  // Footer / Signature Section
  const footerY = Math.max(y + 16, 260);
  if (footerY > 275) {
    doc.addPage();
  }

  const actualFooterY = doc.internal.pageSize.getHeight() - 25;

  doc.setDrawColor(203, 213, 225);
  doc.line(14, actualFooterY, pageWidth - 14, actualFooterY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('Thank you for your business. For any disputes or questions, please contact the merchant directly.', 14, actualFooterY + 6);
  doc.text('This is an authenticated computer-generated ledger statement.', 14, actualFooterY + 11);

  // Authorized Signatory Line
  doc.line(pageWidth - 65, actualFooterY + 14, pageWidth - 14, actualFooterY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryDark);
  doc.text('Authorized Merchant Signature', pageWidth - 40, actualFooterY + 18, { align: 'center' });

  // Save the PDF
  const safeName = (customer.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Statement_${safeName}_${Date.now()}.pdf`);
}
