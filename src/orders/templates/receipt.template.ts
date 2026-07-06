import * as fs from 'fs';
import * as path from 'path';

export interface ReceiptData {
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

export class ReceiptTemplate {
  private static getLogoBase64(): string {
    try {
      const possiblePaths = [
        path.join(__dirname, 'logo.png'),
        path.join(__dirname, '..', 'templates', 'logo.png'),
        path.join(process.cwd(), 'src', 'orders', 'templates', 'logo.png'),
        path.join(process.cwd(), 'dist', 'orders', 'templates', 'logo.png'),
      ];

      let logoBuffer: Buffer | null = null;

      for (const logoPath of possiblePaths) {
        try {
          if (fs.existsSync(logoPath)) {
            logoBuffer = fs.readFileSync(logoPath);
            break;
          }
        } catch {
          continue;
        }
      }

      if (logoBuffer) {
        return `data:image/png;base64,${logoBuffer.toString('base64')}`;
      } else {
        throw new Error('Logo file not found');
      }
    } catch (error) {
      console.error('Error loading logo.png:', error);
      return `data:image/svg+xml;base64,${Buffer.from(`
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" fill="white" rx="20"/>
          <circle cx="100" cy="80" r="45" fill="url(#logoGradient)"/>
          <text x="100" y="88" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">M</text>
          <text x="100" y="175" text-anchor="middle" fill="#334155" font-family="Arial" font-size="16" font-weight="bold">MAGNIFY</text>
        </svg>
      `).toString('base64')}`;
    }
  }

  public static generateReceipt(data: ReceiptData): string {
    const date = new Date(data.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const logoSrc = this.getLogoBase64();
    const deliveryFee = data.deliveryFee ?? 0;
    const subtotal = data.subtotal ?? data.totalValue - deliveryFee;

    let itemsHTML = '';
    if (data.items && data.items.length > 0) {
      itemsHTML = data.items
        .map((item) => {
          const itemTotal = (item.price || 0) * (item.quantity || 1);
          const imageHTML = item.image
            ? `<img src="${item.image}" alt="${item.name || 'Product'}" class="item-image" />`
            : `<div class="item-image-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
              </div>`;

          const detailParts: string[] = [];
          if (item.frameType) detailParts.push(item.frameType);
          if (item.colorOption) detailParts.push(item.colorOption);
          const detailText = detailParts.length > 0 ? `<div class="item-detail">${detailParts.join(' | ')}</div>` : '';

          return `
            <tr class="item-row">
              <td class="item-image-cell">${imageHTML}</td>
              <td class="item-desc">
                <div class="item-name">${item.name || 'Custom Magnet Frame'}</div>
                ${detailText}
              </td>
              <td class="item-qty">${item.quantity || 1}</td>
              <td class="item-price">Rs ${(item.price || 0).toLocaleString()}</td>
              <td class="item-total">Rs ${itemTotal.toLocaleString()}</td>
            </tr>
          `;
        })
        .join('');
    } else {
      const unitPrice = Math.round(subtotal / (data.qty || 1));
      itemsHTML = `
        <tr class="item-row">
          <td class="item-image-cell">
            <div class="item-image-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
          </td>
          <td class="item-desc">
            <div class="item-name">Custom Magnet Frame</div>
          </td>
          <td class="item-qty">${data.qty || 1}</td>
          <td class="item-price">Rs ${unitPrice.toLocaleString()}</td>
          <td class="item-total">Rs ${subtotal.toLocaleString()}</td>
        </tr>
      `;
    }

    const statusClass = data.status ? data.status.toLowerCase() : 'pending';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt - ${data.orderId}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
            color: #1e293b;
            background: #ffffff;
            padding: 24px;
            max-width: 800px;
            margin: 0 auto;
          }

          .receipt-container {
            background: white;
            padding: 32px;
          }

          /* ===== HEADER ===== */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 24px;
            border-bottom: 3px solid #1e40af;
            margin-bottom: 28px;
          }

          .logo-section {
            display: flex;
            align-items: center;
          }

          .logo img {
            width: 130px;
            height: auto;
            max-height: 90px;
            object-fit: contain;
          }

          .company-info {
            text-align: right;
            font-size: 12px;
            color: #475569;
            line-height: 1.7;
          }

          .company-info .company-name {
            font-size: 18px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 4px;
          }

          /* ===== RECEIPT TITLE ===== */
          .receipt-title {
            text-align: center;
            margin-bottom: 32px;
          }

          .receipt-title h1 {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            letter-spacing: -0.5px;
          }

          .receipt-title .order-number {
            font-size: 14px;
            color: #64748b;
            margin-top: 4px;
          }

          .receipt-title .order-date {
            font-size: 13px;
            color: #64748b;
            margin-top: 2px;
          }

          /* ===== STATUS BADGE ===== */
          .status-section {
            text-align: center;
            margin-bottom: 28px;
          }

          .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .status-pending { background: #fef3c7; color: #92400e; }
          .status-processing { background: #dbeafe; color: #1e40af; }
          .status-shipped { background: #e0e7ff; color: #3730a3; }
          .status-delivered { background: #d1fae5; color: #065f46; }
          .status-canceled { background: #fee2e2; color: #991b1b; }

          /* ===== CUSTOMER INFO ===== */
          .section {
            margin-bottom: 28px;
          }

          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px solid #e2e8f0;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .info-field {
            padding: 10px 14px;
            background: #f8fafc;
            border-radius: 6px;
            border-left: 3px solid #e2e8f0;
          }

          .info-field .label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 3px;
            font-weight: 500;
          }

          .info-field .value {
            font-size: 13px;
            color: #1e293b;
            font-weight: 500;
          }

          .info-field.full-width {
            grid-column: 1 / -1;
          }

          /* ===== ORDER TABLE ===== */
          .order-table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }

          .order-table thead tr {
            background: #1e40af;
          }

          .order-table th {
            color: #ffffff;
            font-weight: 600;
            padding: 12px 10px;
            text-align: center;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .order-table th:first-child {
            text-align: center;
            width: 80px;
          }

          .order-table th:nth-child(2) {
            text-align: left;
          }

          .item-row td {
            padding: 12px 10px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
          }

          .item-row:last-child td {
            border-bottom: none;
          }

          .item-image-cell {
            text-align: center;
            width: 80px;
          }

          .item-image {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }

          .item-image-placeholder {
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f1f5f9;
            border-radius: 6px;
            margin: 0 auto;
          }

          .item-desc {
            text-align: left !important;
          }

          .item-name {
            font-weight: 600;
            color: #1e293b;
            font-size: 13px;
          }

          .item-detail {
            font-size: 11px;
            color: #64748b;
            margin-top: 3px;
          }

          .item-qty, .item-price, .item-total {
            text-align: center;
            font-size: 13px;
            color: #334155;
            font-weight: 500;
          }

          /* ===== TOTALS ===== */
          .totals-section {
            margin-top: 16px;
            border-top: 2px solid #e2e8f0;
            padding-top: 12px;
          }

          .totals-table {
            width: 100%;
            border-collapse: collapse;
          }

          .totals-table td {
            padding: 8px 10px;
            font-size: 13px;
          }

          .totals-table .label-cell {
            text-align: right;
            color: #64748b;
            font-weight: 500;
          }

          .totals-table .value-cell {
            text-align: right;
            width: 140px;
            color: #334155;
            font-weight: 500;
          }

          .totals-table .total-final .label-cell {
            font-size: 15px;
            font-weight: 700;
            color: #1e293b;
            padding-top: 12px;
            border-top: 2px solid #1e40af;
          }

          .totals-table .total-final .value-cell {
            font-size: 15px;
            font-weight: 700;
            color: #1e40af;
            padding-top: 12px;
            border-top: 2px solid #1e40af;
          }

          /* ===== NOTES ===== */
          .admin-note {
            margin-top: 20px;
            padding: 14px 16px;
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            border-radius: 4px;
          }

          .admin-note .label {
            font-size: 11px;
            color: #92400e;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 4px;
          }

          .admin-note .value {
            font-size: 13px;
            color: #78350f;
          }

          /* ===== FOOTER ===== */
          .footer {
            margin-top: 36px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
          }

          .footer .thank-you {
            font-size: 16px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 8px;
          }

          .footer .footer-text {
            font-size: 11px;
            color: #94a3b8;
            line-height: 1.6;
          }

          /* ===== PRINT ===== */
          @media print {
            body {
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .receipt-container {
              border: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">

          <!-- Header -->
          <div class="header">
            <div class="logo-section">
              <div class="logo">
                <img src="${logoSrc}" alt="MAGNIFY" />
              </div>
            </div>
            <div class="company-info">
              <div class="company-name">MAGNIFY</div>
              <div>magnifyofficials@gmail.com</div>
              <div>+94 75 391 2534</div>
              <div>125A, KKS Road, Kokuvil, Jaffna</div>
              <div>Instagram: @magnify_magnets</div>
            </div>
          </div>

          <!-- Receipt Title -->
          <div class="receipt-title">
            <h1>Order Receipt</h1>
            <div class="order-number">Order #${data.orderId}</div>
            <div class="order-date">${date}</div>
          </div>

          <!-- Status -->
          <div class="status-section">
            <span class="status-badge status-${statusClass}">${data.status}</span>
          </div>

          <!-- Customer Information -->
          <div class="section">
            <h3 class="section-title">Customer Details</h3>
            <div class="info-grid">
              <div class="info-field">
                <div class="label">Name</div>
                <div class="value">${data.customerName}</div>
              </div>
              <div class="info-field">
                <div class="label">Email</div>
                <div class="value">${data.email}</div>
              </div>
              ${data.phone ? `
              <div class="info-field">
                <div class="label">Phone</div>
                <div class="value">${data.phone}</div>
              </div>
              ` : ''}
              ${data.shippingAddress ? `
              <div class="info-field${!data.phone ? ' full-width' : ''}">
                <div class="label">Delivery Address</div>
                <div class="value">${data.shippingAddress}${data.district ? `, ${data.district}` : ''}</div>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Order Items -->
          <div class="section">
            <h3 class="section-title">Order Items</h3>
            <table class="order-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <!-- Totals -->
            <div class="totals-section">
              <table class="totals-table">
                <tr>
                  <td class="label-cell">Subtotal</td>
                  <td class="value-cell">Rs ${subtotal.toLocaleString()}</td>
                </tr>
                ${data.shippingAddress || deliveryFee > 0 ? `
                <tr>
                  <td class="label-cell">Delivery Fee</td>
                  <td class="value-cell">Rs ${deliveryFee.toLocaleString()}</td>
                </tr>
                ` : ''}
                <tr class="total-final">
                  <td class="label-cell">Total Amount</td>
                  <td class="value-cell">Rs ${data.totalValue.toLocaleString()}</td>
                </tr>
              </table>
            </div>

            ${data.adminNote ? `
            <div class="admin-note">
              <div class="label">Note</div>
              <div class="value">${data.adminNote}</div>
            </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="thank-you">Thank you for choosing MAGNIFY!</div>
            <div class="footer-text">
              Your custom fridge magnets are being prepared with care.<br/>
              For any questions, contact us at magnifyofficials@gmail.com or call +94 75 391 2534.<br/>
              125A, KKS Road, Kokuvil, Jaffna
            </div>
          </div>

        </div>
      </body>
      </html>
    `;
  }
}
