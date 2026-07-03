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
      // Try multiple possible paths for the logo
      const possiblePaths = [
        path.join(__dirname, 'logo.png'),
        path.join(__dirname, '..', 'templates', 'logo.png'),
        path.join(process.cwd(), 'src', 'orders', 'templates', 'logo.png'),
        path.join(process.cwd(), 'dist', 'orders', 'templates', 'logo.png')
      ];

      let logoBuffer: Buffer | null = null;
      let usedPath = '';

      for (const logoPath of possiblePaths) {
        try {
          if (fs.existsSync(logoPath)) {
            logoBuffer = fs.readFileSync(logoPath);
            usedPath = logoPath;
            break;
          }
        } catch (pathError) {
          // Continue to next path
          continue;
        }
      }

      if (logoBuffer) {
        return `data:image/png;base64,${logoBuffer.toString('base64')}`;
      } else {
        console.warn('Logo file not found in any expected location, using fallback');
        throw new Error('Logo file not found');
      }
    } catch (error) {
      console.error('Error loading logo.png:', error);
      // Return a better fallback SVG logo
      return `data:image/svg+xml;base64,${Buffer.from(`
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
            </filter>
          </defs>
          <rect width="200" height="200" fill="white" rx="20"/>
          <circle cx="100" cy="80" r="45" fill="url(#logoGradient)" filter="url(#shadow)"/>
          <rect x="70" y="110" width="60" height="40" rx="5" fill="url(#logoGradient)" filter="url(#shadow)"/>
          <circle cx="85" cy="65" r="8" fill="white" opacity="0.7"/>
          <text x="100" y="88" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">M</text>
          <text x="100" y="175" text-anchor="middle" fill="#334155" font-family="Arial, sans-serif" font-size="16" font-weight="bold">MAGNIFY</text>
        </svg>
      `).toString('base64')}`;
    }
  }

  public static generateReceipt(data: ReceiptData): string {
    const date = new Date(data.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const logoSrc = this.getLogoBase64();


    const deliveryFee = data.deliveryFee ?? 0;
    const subtotal = data.subtotal ?? (data.totalValue - deliveryFee);

    let itemsHTML = '';
    if (data.items && data.items.length > 0) {
      itemsHTML = data.items.map((item) => `
        <tr>
          <td class="item-desc">${item.name || 'Custom Magnet Frame'}</td>
          <td class="item-qty">${item.quantity || 1}</td>
          <td class="item-price">Rs ${(item.price || 0).toLocaleString()}</td>
          <td class="item-total">Rs ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
        </tr>
      `).join('');
    } else {
      const unitPrice = Math.round(subtotal / (data.qty || 1));
      itemsHTML = `
        <tr>
          <td class="item-desc">Custom Magnet Frame</td>
          <td class="item-qty">${data.qty || 1}</td>
          <td class="item-price">Rs ${unitPrice.toLocaleString()}</td>
          <td class="item-total">Rs ${subtotal.toLocaleString()}</td>
        </tr>
      `;
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Purchase Order Confirmation - ${data.orderId}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.5;
            color: #333;
            background: #ffffff;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }

          .receipt-container {
            background: white;
            border: 1px solid #ddd;
            padding: 30px;
            height: auto;
            max-height: none;
          }

          /* Header Section */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding: 20px 0 15px 0;
            border-bottom: 2px solid #333;
            min-height: 140px;
          }

          .logo-section {
            display: flex;
            align-items: center;
            flex: 1;
            max-width: 50%;
          }

          .logo {
            width: 160px;
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 30px;
            flex-shrink: 0;
            overflow: hidden;
          }

          .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .company-info {
            text-align: right;
            font-size: 13px;
            color: #666;
            line-height: 1.4;
            flex: 1;
            max-width: 45%;
          }

          .company-info div {
            margin-bottom: 3px;
          }

          /* Title Section */
          .title-section {
            text-align: center;
            margin: 30px 0 40px 0;
          }

          .title-section h1 {
            font-size: 28px;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
          }

          .title-section h2 {
            font-size: 20px;
            font-weight: normal;
            color: #333;
            margin-bottom: 15px;
          }

          .instructions {
            font-size: 12px;
            color: #666;
            max-width: 600px;
            margin: 0 auto;
            text-align: left;
            line-height: 1.6;
          }

          /* Vendor Information Section */
          .section {
            margin-bottom: 35px;
          }

          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }

          .info-field {
            border: 1px solid #ddd;
            padding: 10px 15px;
            background: #f9f9f9;
          }

          .info-field .label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
          }

          .info-field .value {
            font-size: 14px;
            color: #333;
            font-weight: 500;
          }

          /* Order Details Table */
          .order-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }

          .order-table th {
            background: #f5f5f5;
            color: #333;
            font-weight: bold;
            padding: 12px 10px;
            text-align: center;
            border: 1px solid #ddd;
            font-size: 12px;
            text-transform: uppercase;
          }

          .order-table td {
            padding: 15px 10px;
            border: 1px solid #ddd;
            font-size: 13px;
            color: #555;
            text-align: center;
          }

          .item-desc {
            text-align: left !important;
            font-weight: 500;
            color: #333;
          }

          .item-qty, .item-price, .item-total {
            text-align: center;
            font-weight: 500;
          }

          .total-row {
            background: #f9f9f9;
            font-weight: bold;
            border-top: 2px solid #333;
          }

          .total-row td {
            color: #333;
            font-size: 14px;
            padding: 18px 10px;
          }

          .subtotal-row td, .delivery-row td {
            padding: 12px 10px;
            border-top: 1px solid #ddd;
          }

          /* Status Badge */
          .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
          }

          .status-pending { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
          .status-processing { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
          .status-shipped { background: #cce5ff; color: #004085; border: 1px solid #99d6ff; }
          .status-delivered { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
          .status-canceled { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

          /* Print Styles */
          @media print {
            body { 
              padding: 0; 
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .receipt-container {
              border: none;
              box-shadow: none;
            }
            .logo img {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }

          /* Mobile Responsive */
          @media (max-width: 768px) {
            body {
              padding: 10px;
            }
            
            .receipt-container {
              padding: 20px;
            }
            
            .header {
              flex-direction: column;
              text-align: center;
            }
            
            .logo {
              width: 140px;
              height: 100px;
              margin: 0 auto 15px auto;
            }
            
            .company-info {
              text-align: center;
              margin-top: 15px;
            }
            
            .info-grid {
              grid-template-columns: 1fr;
            }
            
            .order-table th,
            .order-table td {
              padding: 8px 5px;
              font-size: 11px;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- Header Section -->
          <div class="header">
            <div class="logo-section">
              <div class="logo">
                <img src="${logoSrc}" alt="MAGNIFY Logo" />
              </div>
            </div>
            <div class="company-info">
              <div>magnifyofficials@gmail.com</div>
              <div>www.magnifyframes.com</div>
              <div>+94 75 391 2534</div>
              <div>@magnify_officials</div>
            </div>
          </div>

          <!-- Title Section -->
          <div class="title-section">
            <h1>Customer Receipt</h1>
            <h2>Order Confirmation</h2>
            <div class="instructions">
              <strong>Thank you for choosing MAGNIFY!</strong> This receipt contains complete details of your purchase. 
              Your custom fridge magnets are being prepared with care. Please keep this document for your records. 
              For any questions about your order, please contact us using the information above.
            </div>
          </div>

          <!-- Customer Information -->
          <div class="section">
            <h3 class="section-title">Customer Information</h3>
            <div class="info-grid">
              <div class="info-field">
                <div class="label">Customer Name</div>
                <div class="value">${data.customerName}</div>
              </div>
              <div class="info-field">
                <div class="label">Email Address</div>
                <div class="value">${data.email}</div>
              </div>
              <div class="info-field">
                <div class="label">Order Number</div>
                <div class="value">${data.orderId}</div>
              </div>
              <div class="info-field">
                <div class="label">Order Date</div>
                <div class="value">${date}</div>
              </div>
              ${data.phone ? `
              <div class="info-field">
                <div class="label">Phone Number</div>
                <div class="value">${data.phone}</div>
              </div>
              ` : ''}
              <div class="info-field">
                <div class="label">Order Status</div>
                <div class="value">
                  <span class="status-badge status-${data.status.toLowerCase()}">${data.status}</span>
                </div>
              </div>
            </div>
            ${data.shippingAddress ? `
            <div class="info-grid">
              <div class="info-field" style="grid-column: 1 / -1;">
                <div class="label">Delivery Address</div>
                <div class="value">${data.shippingAddress}${data.district ? `, ${data.district}` : ''}</div>
              </div>
            </div>
            ` : ''}
          </div>

          <!-- Order Details -->
          <div class="section">
            <h3 class="section-title">Order Details</h3>
            <table class="order-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
                <tr class="subtotal-row">
                  <td colspan="3" style="text-align: right; font-weight: 600; color: #666;">Subtotal</td>
                  <td style="font-weight: 600; color: #666;">Rs ${subtotal.toLocaleString()}</td>
                </tr>
                ${data.shippingAddress || deliveryFee > 0 ? `
                <tr class="delivery-row">
                  <td colspan="3" style="text-align: right; font-weight: 600; color: #666;">Delivery Fee</td>
                  <td style="font-weight: 600; color: #666;">Rs ${deliveryFee.toLocaleString()}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right; font-weight: bold; font-size: 16px;">Total Amount</td>
                  <td style="font-weight: bold; font-size: 16px;">Rs ${data.totalValue.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            ${data.adminNote ? `
            <div class="info-field" style="margin-top: 20px;">
              <div class="label">Additional Notes</div>
              <div class="value">${data.adminNote}</div>
            </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  }
}