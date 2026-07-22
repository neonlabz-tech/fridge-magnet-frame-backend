import { Injectable, Logger } from '@nestjs/common';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

// Status badge colors [background, text] - RGB
const STATUS_COLORS: Record<string, { bg: [number, number, number]; text: [number, number, number] }> = {
  pending: { bg: [254, 243, 199], text: [146, 64, 14] },
  processing: { bg: [219, 234, 254], text: [30, 64, 175] },
  shipped: { bg: [224, 231, 255], text: [55, 48, 163] },
  delivered: { bg: [209, 250, 229], text: [6, 95, 70] },
  canceled: { bg: [254, 226, 226], text: [153, 27, 27] },
};

const BRAND_BLUE: [number, number, number] = [30, 64, 175]; // #1e40af


@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  // Cache the base64 logo so we don't re-read it from disk and re-encode it on
  // every request. `undefined` = not yet resolved, `null` = resolved but missing.
  private logoCache: string | null | undefined = undefined;

  async generateReceipt(data: ReceiptPdfData): Promise<Buffer> {
    try {
      const buffer = this.buildReceipt(data);
      this.logger.log(`PDF receipt built for order: ${data.orderId}`);
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to build PDF for order ${data.orderId}:`, error as Error);
      throw error;
    }
  }

  private getLogoBase64(): string | null {
    // Return the cached result once resolved (either the data URL or null).
    if (this.logoCache !== undefined) {
      return this.logoCache;
    }

    try {
      const possiblePaths = [
        path.join(__dirname, '..', 'assets', 'new_logo.png'),
        path.join(process.cwd(), 'src', 'orders', 'assets', 'new_logo.png'),
        path.join(process.cwd(), 'dist', 'orders', 'assets', 'new_logo.png'),
      ];

      for (const logoPath of possiblePaths) {
        if (fs.existsSync(logoPath)) {
          const fileBuffer = fs.readFileSync(logoPath);
          this.logoCache = `data:image/png;base64,${fileBuffer.toString('base64')}`;
          return this.logoCache;
        }
      }
      this.logoCache = null;
      return null;
    } catch (error) {
      this.logger.error('Error loading new_logo.png:', error as Error);
      this.logoCache = null;
      return null;
    }
  }

  private buildReceipt(data: ReceiptPdfData): Buffer {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' }); // pt units, easier to reason with font sizes
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = 40;

    const date = new Date(data.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const deliveryFee = data.deliveryFee ?? 0;
    const subtotal = data.subtotal ?? data.totalValue - deliveryFee;

    // ===== HEADER: Logo (left) + Company info (right) =====
    // The header spans a fixed band so both the logo and the company info can
    // use the full vertical space instead of hugging the top.
    const headerTop = y;
    const headerHeight = 120;
    const headerCenterY = headerTop + headerHeight / 2;

    const logoBase64 = this.getLogoBase64();
    let logoRendered = false;
    if (logoBase64) {
      try {
        // Source logo is a 500x500 square. Keep it square so it isn't
        // stretched/squished, and let it fill the header band vertically.
        const logoSize = headerHeight; // fill the full header height
        const logoY = headerTop; // top-aligned so it occupies the whole band
        doc.addImage(logoBase64, 'PNG', margin, logoY, logoSize, logoSize, undefined, 'FAST');
        logoRendered = true;
      } catch (e) {
        this.logger.error('Logo render failed:', e as Error);
      }
    }

    if (!logoRendered) {
      doc.setFontSize(34);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...BRAND_BLUE);
      doc.text('MAGNIFY', margin, headerCenterY + 8);
    }

    // Company info block, vertically centered within the header band and right
    // aligned so it balances the large logo on the left.
    const companyLines = [
      'magnifyofficials@gmail.com',
      '+94 75 391 2534',
      '125A, KKS Road, Kokuvil, Jaffna',
      'Instagram: @magnify_magnets',
    ];
    const titleGap = 20; // space between the MAGNIFY title and the first info line
    const infoLineHeight = 13;
    const infoBlockHeight = titleGap + companyLines.length * infoLineHeight;
    let infoY = headerCenterY - infoBlockHeight / 2 + 4;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND_BLUE);
    doc.text('MAGNIFY', pageWidth - margin, infoY, { align: 'right' });
    infoY += titleGap;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // slate-600
    companyLines.forEach((line, i) => {
      doc.text(line, pageWidth - margin, infoY + i * infoLineHeight, { align: 'right' });
    });

    y = headerTop + headerHeight;

    // Header bottom border
    doc.setDrawColor(...BRAND_BLUE);
    doc.setLineWidth(2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 30;

    // ===== RECEIPT TITLE =====
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('Order Receipt', pageWidth / 2, y, { align: 'center' });
    y += 18;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Order #${data.orderId}`, pageWidth / 2, y, { align: 'center' });
    y += 14;
    doc.text(date, pageWidth / 2, y, { align: 'center' });
    y += 24;

    // ===== STATUS BADGE =====
    const statusKey = (data.status || 'pending').toLowerCase();
    const statusColor = STATUS_COLORS[statusKey] || STATUS_COLORS.pending;
    const badgeText = (data.status || 'pending').toUpperCase();

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const badgeWidth = doc.getTextWidth(badgeText) + 24;
    const badgeX = pageWidth / 2 - badgeWidth / 2;

    doc.setFillColor(...statusColor.bg);
    doc.roundedRect(badgeX, y - 12, badgeWidth, 20, 10, 10, 'F');
    doc.setTextColor(...statusColor.text);
    doc.text(badgeText, pageWidth / 2, y + 2, { align: 'center' });
    y += 35;

    // ===== CUSTOMER DETAILS =====
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND_BLUE);
    doc.text('CUSTOMER DETAILS', margin, y);
    y += 5;

    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    const fieldBoxWidth = (pageWidth - margin * 2 - 12) / 2;

    // Returns the box height it drew, based on how many lines the value wraps to.
    // This is what lets a long delivery address grow the box instead of overflowing it.
    const drawInfoField = (x: number, boxY: number, label: string, value: string, fullWidth = false): number => {
      const w = fullWidth ? pageWidth - margin * 2 : fieldBoxWidth;
      const innerWidth = w - 20;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const valueLines: string[] = doc.splitTextToSize(value || '', innerWidth);
      const lineHeight = 12;
      const boxHeight = Math.max(34, 22 + valueLines.length * lineHeight);

      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(x, boxY, w, boxHeight, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(2);
      doc.line(x, boxY, x, boxY + boxHeight); // left accent border

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), x + 10, boxY + 12);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(valueLines, x + 10, boxY + 26);

      return boxHeight;
    };

    const nameBoxHeight = drawInfoField(margin, y, 'Name', data.customerName);
    const emailBoxHeight = drawInfoField(margin + fieldBoxWidth + 12, y, 'Email', data.email);
    y += Math.max(nameBoxHeight, emailBoxHeight) + 12;

    let secondRowHeight = 0;
    if (data.phone) {
      secondRowHeight = Math.max(secondRowHeight, drawInfoField(margin, y, 'Phone', data.phone));
    }
    if (data.shippingAddress) {
      const addressText = `${data.shippingAddress}${data.district ? `, ${data.district}` : ''}`;
      if (data.phone) {
        secondRowHeight = Math.max(
          secondRowHeight,
          drawInfoField(margin + fieldBoxWidth + 12, y, 'Delivery Address', addressText),
        );
      } else {
        secondRowHeight = Math.max(secondRowHeight, drawInfoField(margin, y, 'Delivery Address', addressText, true));
      }
    }
    y += secondRowHeight + 25;

    // ===== ORDER ITEMS TABLE =====
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND_BLUE);
    doc.text('ORDER ITEMS', margin, y);
    y += 5;
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    const items =
      data.items && data.items.length > 0
        ? data.items
        : [{ name: 'Custom Magnet Frame', price: Math.round(subtotal / (data.qty || 1)), quantity: data.qty || 1 }];

    // Build table rows. Image column left blank in text; drawn separately via didDrawCell.
    const tableBody = items.map((item) => {
      const detailParts: string[] = [];
      if (item.frameType) detailParts.push(item.frameType);
      if (item.colorOption) detailParts.push(item.colorOption);
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      const productCell = `${item.name || 'Custom Magnet Frame'}${
        detailParts.length ? `\n${detailParts.join(' | ')}` : ''
      }`;
      return [
        productCell,
        String(item.quantity || 1),
        `Rs ${(item.price || 0).toLocaleString()}`,
        `Rs ${itemTotal.toLocaleString()}`,
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Product', 'Qty', 'Price', 'Total']],
      body: tableBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 8, valign: 'middle' },
      headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'center', cellWidth: 40 },
        2: { halign: 'center', cellWidth: 70 },
        3: { halign: 'center', cellWidth: 70 },
      },
    });

    // Y position after table - CRITICAL for dynamic item count support
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

    // ===== TOTALS =====
    const totalsX = pageWidth - margin - 160;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Subtotal', totalsX, y);
    doc.setTextColor(51, 65, 85);
    doc.text(`Rs ${subtotal.toLocaleString()}`, pageWidth - margin, y, { align: 'right' });
    y += 18;

    if (data.shippingAddress || deliveryFee > 0) {
      doc.setTextColor(100, 116, 139);
      doc.text('Delivery Fee', totalsX, y);
      doc.setTextColor(51, 65, 85);
      doc.text(`Rs ${deliveryFee.toLocaleString()}`, pageWidth - margin, y, { align: 'right' });
      y += 18;
    }

    doc.setDrawColor(...BRAND_BLUE);
    doc.setLineWidth(1.5);
    doc.line(totalsX - 10, y, pageWidth - margin, y);
    y += 16;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Total Amount', totalsX, y);
    doc.setTextColor(...BRAND_BLUE);
    doc.text(`Rs ${data.totalValue.toLocaleString()}`, pageWidth - margin, y, { align: 'right' });
    y += 30;

    // ===== ADMIN NOTE (variable length - wrap + recalculate y) =====
    if (data.adminNote) {
      doc.setFont('helvetica', 'normal');
      const noteLines: string[] = doc.splitTextToSize(data.adminNote, pageWidth - margin * 2 - 24);
      const noteBoxHeight = noteLines.length * 12 + 20;

      // background box drawn behind text
      doc.setFillColor(255, 251, 235);
      doc.rect(margin, y - 24, pageWidth - margin * 2, noteBoxHeight, 'F');
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(3);
      doc.line(margin, y - 24, margin, y - 24 + noteBoxHeight);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(146, 64, 14);
      doc.text('NOTE', margin + 12, y - 12);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 53, 15);
      doc.text(noteLines, margin + 12, y);

      y += noteLines.length * 12 + 20;
    }

    y += 20;

    // ===== FOOTER =====
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND_BLUE);
    doc.text('Thank you for choosing MAGNIFY!', pageWidth / 2, y, { align: 'center' });
    y += 16;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    const footerLines = [
      'Your custom fridge magnets are being prepared with care.',
      'For any questions, contact us at magnifyofficials@gmail.com or call +94 75 391 2534.',
      '125A, KKS Road, Kokuvil, Jaffna',
    ];
    footerLines.forEach((line, i) => {
      doc.text(line, pageWidth / 2, y + i * 11, { align: 'center' });
    });

    // Return as Node Buffer (matches what orders.controller.ts expects)
    return Buffer.from(doc.output('arraybuffer'));
  }
}
