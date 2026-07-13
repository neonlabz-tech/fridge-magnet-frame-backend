import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';

export interface ReceiptPdfData {
  orderId: string;
  customerName: string;
  email: string;
  phone?: string;
  shippingAddress?: string;
  district?: string;
  status: string;
  totalValue: number;
  qty: number;
  subtotal?: number;
  deliveryFee?: number;
  items?: Array<{
    productId?: string;
    name?: string;
    price?: number;
    quantity?: number;
    image?: string;
    frameType?: string;
    colorOption?: string;
  }>;
  createdAt: Date | string;
  adminNote?: string;
}

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  /**
   * Generate a PDF receipt using PDFKit (pure JS, no browser needed).
   * Works on Railway, Render, Vercel, AWS, or any Node.js environment.
   */
  async generateReceipt(data: ReceiptPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 40, bottom: 40, left: 50, right: 50 },
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.buildReceipt(doc, data);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private buildReceipt(doc: any, data: ReceiptPdfData): void {
    const leftMargin = 50;
    const rightMargin = doc.page.width - 50;
    const pageWidth = rightMargin - leftMargin;
    const darkText = '#2d2d2d';
    const grayText = '#666666';
    const labelColor = '#8b4513';
    const headerLineColor = '#333333';

    // ===== HEADER =====
    this.drawHeader(doc, leftMargin, rightMargin, pageWidth, headerLineColor, grayText);

    // ===== RECEIPT TITLE =====
    doc.moveDown(2);
    doc.fontSize(26).font('Helvetica-Bold').fillColor(darkText)
      .text('Customer Receipt', leftMargin, doc.y, { width: pageWidth, align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(14).font('Helvetica').fillColor(grayText)
      .text('Order Confirmation', leftMargin, doc.y, { width: pageWidth, align: 'center' });

    // ===== THANK YOU MESSAGE =====
    doc.moveDown(1);
    const thankYouY = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#8b4513')
      .text('Thank you for choosing MAGNIFY! ', leftMargin, thankYouY, { continued: true });
    doc.font('Helvetica-Oblique').fillColor(grayText)
      .text(
        'This receipt contains complete details of your purchase. Your custom fridge magnets are being prepared with care. Please keep this document for your records. For any questions about your order, please contact us using the information above.',
        { width: pageWidth - 10 },
      );

    // ===== CUSTOMER INFORMATION =====
    doc.moveDown(1.5);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(darkText)
      .text('Customer Information', leftMargin, doc.y);
    doc.moveDown(0.8);

    const date = new Date(data.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    // Row 1: Customer Name | Email Address
    this.drawInfoRow(doc, leftMargin, pageWidth, [
      { label: 'CUSTOMER NAME', value: data.customerName },
      { label: 'EMAIL ADDRESS', value: data.email },
    ], labelColor, darkText);

    // Row 2: Order Number | Order Date
    this.drawInfoRow(doc, leftMargin, pageWidth, [
      { label: 'ORDER NUMBER', value: data.orderId },
      { label: 'ORDER DATE', value: date },
    ], labelColor, darkText);

    // Row 3: Phone Number | Order Status
    this.drawInfoRow(doc, leftMargin, pageWidth, [
      { label: 'PHONE NUMBER', value: data.phone || 'N/A' },
      { label: 'ORDER STATUS', value: data.status, isBadge: true },
    ], labelColor, darkText);

    // Row 4: Delivery Address (full width)
    if (data.shippingAddress) {
      const address = data.district
        ? `${data.shippingAddress}, ${data.district}`
        : data.shippingAddress;
      this.drawInfoRow(doc, leftMargin, pageWidth, [
        { label: 'DELIVERY ADDRESS', value: address, fullWidth: true },
      ], labelColor, darkText);
    }

    // ===== ORDER DETAILS =====
    doc.moveDown(1.2);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(darkText)
      .text('Order Details', leftMargin, doc.y);
    doc.moveDown(0.8);

    const deliveryFee = data.deliveryFee ?? 0;
    const subtotal = data.subtotal ?? data.totalValue - deliveryFee;

    this.drawOrderTable(doc, data, subtotal, deliveryFee, leftMargin, pageWidth, darkText, grayText);

    // ===== ADMIN NOTE =====
    if (data.adminNote) {
      doc.moveDown(1.5);
      this.drawAdminNote(doc, data.adminNote, leftMargin, pageWidth);
    }

    // ===== FOOTER =====
    doc.moveDown(2);
    this.drawFooter(doc, leftMargin, pageWidth, grayText);
  }

  private drawHeader(doc: any, leftMargin: number, rightMargin: number, pageWidth: number, lineColor: string, grayText: string): void {
    const startY = doc.y;

    // Header block height reserved for the logo/contact info
    const headerBlockHeight = 60;

    // Try to load logo on the left (constrained inside a fixed box)
    this.tryDrawLogo(doc, leftMargin, startY, headerBlockHeight);

    // Company contact info on the right
    const rightInfoX = rightMargin - 180;
    doc.fontSize(9).font('Helvetica').fillColor(grayText);
    doc.text('magnifyofficials@gmail.com', rightInfoX, startY + 2, { width: 180, align: 'right' });
    doc.text('www.magnifyframes.com', rightInfoX, startY + 15, { width: 180, align: 'right' });
    doc.text('+94 75 391 2534', rightInfoX, startY + 28, { width: 180, align: 'right' });
    doc.text('@magnify_officials', rightInfoX, startY + 41, { width: 180, align: 'right' });

    // Horizontal line separator below the entire header block
    const lineY = startY + headerBlockHeight + 8;
    doc.moveTo(leftMargin, lineY).lineTo(rightMargin, lineY)
      .strokeColor(lineColor).lineWidth(1).stroke();
    doc.y = lineY + 5;
  }

  private tryDrawLogo(doc: any, x: number, y: number, blockHeight: number): boolean {
    const possiblePaths = [
      path.join(__dirname, '..', 'assets', 'logo.png'),
      path.join(process.cwd(), 'src', 'orders', 'assets', 'logo.png'),
      path.join(process.cwd(), 'dist', 'orders', 'assets', 'logo.png'),
    ];

    // Bounding box for the logo - constrains both width and height so it is
    // never cut off, regardless of the source image aspect ratio.
    const boxWidth = 130;
    const boxHeight = blockHeight;

    for (const logoPath of possiblePaths) {
      try {
        if (fs.existsSync(logoPath)) {
          // fit scales the image to fit within the box while preserving aspect
          // ratio, and we vertically center it within the header block.
          doc.image(logoPath, x, y, {
            fit: [boxWidth, boxHeight],
            valign: 'center',
            align: 'left',
          });
          return true;
        }
      } catch {
        continue;
      }
    }

    // Fallback: text logo, vertically centered in the block
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e40af')
      .text('magnify', x, y + (blockHeight - 20) / 2);
    return false;
  }

  private drawInfoRow(
    doc: any,
    leftMargin: number,
    pageWidth: number,
    fields: Array<{ label: string; value: string; isBadge?: boolean; fullWidth?: boolean }>,
    labelColor: string,
    darkText: string,
  ): void {
    const rowHeight = 48;
    const startY = doc.y;
    const borderColor = '#cccccc';
    const gap = 16;

    if (fields.length === 1 && fields[0].fullWidth) {
      // Full width field
      const field = fields[0];
      const boxWidth = pageWidth;
      doc.rect(leftMargin, startY, boxWidth, rowHeight)
        .strokeColor(borderColor).lineWidth(0.5).stroke();

      doc.fontSize(8).font('Helvetica').fillColor(labelColor)
        .text(field.label, leftMargin + 12, startY + 8);
      doc.fontSize(11).font('Helvetica').fillColor(darkText)
        .text(field.value, leftMargin + 12, startY + 24, { width: boxWidth - 24 });
    } else {
      // Two-column fields
      const colWidth = (pageWidth - gap) / 2;

      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const x = i === 0 ? leftMargin : leftMargin + colWidth + gap;

        doc.rect(x, startY, colWidth, rowHeight)
          .strokeColor(borderColor).lineWidth(0.5).stroke();

        doc.fontSize(8).font('Helvetica').fillColor(labelColor)
          .text(field.label, x + 12, startY + 8);

        if (field.isBadge) {
          // Draw status badge
          this.drawStatusBadgeInline(doc, field.value, x + 12, startY + 24);
        } else {
          doc.fontSize(11).font('Helvetica').fillColor(darkText)
            .text(field.value, x + 12, startY + 26, { width: colWidth - 24 });
        }
      }
    }

    doc.y = startY + rowHeight + 8;
  }

  private drawStatusBadgeInline(doc: any, status: string, x: number, y: number): void {
    const statusColors: Record<string, { bg: string; text: string }> = {
      PENDING: { bg: '#fef3c7', text: '#92400e' },
      PROCESSING: { bg: '#dbeafe', text: '#1e40af' },
      SHIPPED: { bg: '#e0e7ff', text: '#3730a3' },
      DELIVERED: { bg: '#d1fae5', text: '#065f46' },
      CANCELED: { bg: '#fee2e2', text: '#991b1b' },
    };

    const colors = statusColors[status] || statusColors.PENDING;
    const badgeText = status || 'PENDING';

    doc.fontSize(9).font('Helvetica-Bold');
    const textWidth = doc.widthOfString(badgeText);
    const badgeWidth = textWidth + 16;
    const badgeHeight = 18;

    // Badge background
    doc.roundedRect(x, y, badgeWidth, badgeHeight, 3).fill(colors.bg);

    // Badge text
    doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.text)
      .text(badgeText, x + 8, y + 4);
  }

  private drawOrderTable(
    doc: any,
    data: ReceiptPdfData,
    subtotal: number,
    deliveryFee: number,
    leftMargin: number,
    pageWidth: number,
    darkText: string,
    grayText: string,
  ): void {
    const tableX = leftMargin;
    const borderColor = '#999999';
    const lightBorder = '#cccccc';
    const totalRowBg = '#e8e8e8';
    const headerHeight = 32;
    const rowHeight = 34;

    // Column widths matching the template proportions
    const col1 = pageWidth * 0.42; // Item Description
    const col2 = pageWidth * 0.14; // Quantity
    const col3 = pageWidth * 0.22; // Unit Price
    const col4 = pageWidth * 0.22; // Total

    // ===== TABLE HEADER =====
    const headerY = doc.y;

    // Header top and bottom borders
    doc.moveTo(tableX, headerY).lineTo(tableX + pageWidth, headerY)
      .strokeColor(borderColor).lineWidth(0.8).stroke();
    doc.moveTo(tableX, headerY + headerHeight).lineTo(tableX + pageWidth, headerY + headerHeight)
      .strokeColor(borderColor).lineWidth(0.8).stroke();

    // Header vertical lines
    this.drawVerticalLines(doc, tableX, headerY, headerHeight, [col1, col2, col3, col4], borderColor);

    // Header text
    doc.fontSize(9).font('Helvetica-Bold').fillColor(darkText);
    doc.text('ITEM DESCRIPTION', tableX + 10, headerY + 11, { width: col1 - 10 });
    doc.text('QUANTITY', tableX + col1, headerY + 11, { width: col2, align: 'center' });
    doc.text('UNIT PRICE', tableX + col1 + col2, headerY + 11, { width: col3, align: 'center' });
    doc.text('TOTAL', tableX + col1 + col2 + col3, headerY + 11, { width: col4, align: 'center' });

    let currentY = headerY + headerHeight;

    // ===== TABLE ROWS (items) =====
    const items = data.items && data.items.length > 0
      ? data.items
      : [{ name: 'Custom Magnet Frame', quantity: data.qty || 1, price: Math.round(subtotal / (data.qty || 1)) }];

    for (const item of items) {
      const itemName = item.name || 'Custom Magnet Frame';
      const qty = item.quantity || 1;
      const unitPrice = item.price || 0;
      const total = unitPrice * qty;

      // Row content - italic like the template
      doc.fontSize(10).font('Helvetica-Oblique').fillColor(darkText)
        .text(itemName, tableX + 10, currentY + 11, { width: col1 - 20 });
      doc.fontSize(10).font('Helvetica-Oblique').fillColor(darkText)
        .text(String(qty), tableX + col1, currentY + 11, { width: col2, align: 'center' });
      doc.text(`Rs ${unitPrice.toLocaleString()}`, tableX + col1 + col2, currentY + 11, { width: col3, align: 'center' });
      doc.text(`Rs ${total.toLocaleString()}`, tableX + col1 + col2 + col3, currentY + 11, { width: col4, align: 'center' });

      currentY += rowHeight;

      // Bottom border for each item row
      doc.moveTo(tableX, currentY).lineTo(tableX + pageWidth, currentY)
        .strokeColor(lightBorder).lineWidth(0.5).stroke();
    }

    // ===== SUBTOTAL ROW =====
    // No left border, just right-aligned text
    doc.fontSize(10).font('Helvetica-Bold').fillColor(darkText)
      .text('Subtotal', tableX, currentY + 11, { width: col1 + col2 + col3, align: 'right' });
    doc.fontSize(10).font('Helvetica-Bold').fillColor(darkText)
      .text(`Rs ${subtotal.toLocaleString()}`, tableX + col1 + col2 + col3, currentY + 11, { width: col4, align: 'center' });

    currentY += rowHeight;

    // Thin line after subtotal
    doc.moveTo(tableX, currentY).lineTo(tableX + pageWidth, currentY)
      .strokeColor(lightBorder).lineWidth(0.5).stroke();

    // ===== DELIVERY FEE ROW =====
    doc.fontSize(10).font('Helvetica-BoldOblique').fillColor(darkText)
      .text('Delivery Fee', tableX, currentY + 11, { width: col1 + col2 + col3, align: 'right' });
    doc.fontSize(10).font('Helvetica-Bold').fillColor(darkText)
      .text(`Rs ${deliveryFee.toLocaleString()}`, tableX + col1 + col2 + col3, currentY + 11, { width: col4, align: 'center' });

    currentY += rowHeight;

    // ===== TOTAL AMOUNT ROW =====
    const totalRowHeight = 38;

    // Dark gray background for total row
    doc.rect(tableX, currentY, pageWidth, totalRowHeight).fill(totalRowBg);

    // Top border of total row
    doc.moveTo(tableX, currentY).lineTo(tableX + pageWidth, currentY)
      .strokeColor(borderColor).lineWidth(0.8).stroke();
    // Bottom border of total row
    doc.moveTo(tableX, currentY + totalRowHeight).lineTo(tableX + pageWidth, currentY + totalRowHeight)
      .strokeColor(borderColor).lineWidth(0.8).stroke();

    doc.fontSize(12).font('Helvetica-Bold').fillColor(darkText)
      .text('Total Amount', tableX, currentY + 12, { width: col1 + col2 + col3, align: 'right' });
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#c0392b')
      .text(`Rs ${data.totalValue.toLocaleString()}`, tableX + col1 + col2 + col3, currentY + 12, { width: col4, align: 'center' });

    doc.y = currentY + totalRowHeight;
  }

  private drawVerticalLines(
    doc: any,
    tableX: number,
    y: number,
    height: number,
    colWidths: number[],
    borderColor: string,
  ): void {
    let xPos = tableX;
    for (let i = 0; i < colWidths.length - 1; i++) {
      xPos += colWidths[i];
      doc.moveTo(xPos, y).lineTo(xPos, y + height)
        .strokeColor(borderColor).lineWidth(0.5).stroke();
    }
  }

  private drawAdminNote(doc: any, note: string, leftMargin: number, pageWidth: number): void {
    const noteY = doc.y;

    // Yellow background
    doc.rect(leftMargin, noteY, pageWidth, 40).fill('#fffbeb');
    // Left accent bar
    doc.rect(leftMargin, noteY, 3, 40).fill('#f59e0b');

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#92400e')
      .text('NOTE', leftMargin + 12, noteY + 6);
    doc.fontSize(10).font('Helvetica').fillColor('#78350f')
      .text(note, leftMargin + 12, noteY + 20, { width: pageWidth - 24 });

    doc.y = noteY + 46;
  }

  private drawFooter(doc: any, leftMargin: number, pageWidth: number, grayText: string): void {
    // Thin line above footer
    const lineY = doc.y;
    doc.moveTo(leftMargin, lineY).lineTo(leftMargin + pageWidth, lineY)
      .strokeColor('#cccccc').lineWidth(0.5).stroke();
    doc.y = lineY + 15;

    doc.fontSize(9).font('Helvetica-Oblique').fillColor(grayText)
      .text(
        'This is a system-generated receipt. For any inquiries, please contact magnifyofficials@gmail.com',
        leftMargin,
        doc.y,
        { width: pageWidth, align: 'center' },
      );
  }
}
