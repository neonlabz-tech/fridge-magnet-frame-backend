"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PdfGeneratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const jspdf_1 = require("jspdf");
const jspdf_autotable_1 = __importDefault(require("jspdf-autotable"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const NAVY = [0, 32, 91];
const SLATE_900 = [15, 23, 42];
const SLATE_700 = [51, 65, 85];
const SLATE_600 = [71, 85, 105];
const SLATE_500 = [100, 116, 139];
const SLATE_200 = [226, 232, 240];
const SLATE_100 = [241, 245, 249];
const GREEN = [21, 128, 61];
const AMBER = [217, 119, 6];
const RED = [185, 28, 28];
const LOGO_CANVAS = 500;
const LOGO_CONTENT = { x: 40, y: 154, width: 420 };
const TIME_ZONE = 'Asia/Colombo';
let PdfGeneratorService = PdfGeneratorService_1 = class PdfGeneratorService {
    constructor() {
        this.logger = new common_1.Logger(PdfGeneratorService_1.name);
        this.logoCache = undefined;
    }
    async generateReceipt(data) {
        try {
            const buffer = this.buildReceipt(data);
            this.logger.log(`PDF receipt built for order: ${data.orderId}`);
            return buffer;
        }
        catch (error) {
            this.logger.error(`Failed to build PDF for order ${data.orderId}:`, error);
            throw error;
        }
    }
    getLogoBase64() {
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
        }
        catch (error) {
            this.logger.error('Error loading new_logo.png:', error);
            this.logoCache = null;
            return null;
        }
    }
    formatPaymentMethod(method) {
        switch (String(method ?? '').toLowerCase()) {
            case 'cod':
                return 'Cash on Delivery';
            case 'bank_transfer':
                return 'Bank Transfer';
            case 'card':
                return 'Card';
            case '':
                return '-';
            default:
                return String(method);
        }
    }
    buildReceipt(data) {
        const doc = new jspdf_1.jsPDF({ unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 48;
        const right = pageWidth - margin;
        const contentWidth = pageWidth - margin * 2;
        const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-US')}`;
        const created = new Date(data.createdAt);
        const dateText = `${created.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            timeZone: TIME_ZONE,
        })}, ${created.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: TIME_ZONE,
        })}`;
        const deliveryFee = data.deliveryFee ?? 0;
        const subtotal = data.subtotal ?? data.totalValue - deliveryFee;
        const isPaid = String(data.paymentStatus ?? '').toLowerCase() === 'paid';
        const paymentStatusText = String(data.paymentStatus ?? 'pending').toUpperCase();
        const rightLabelValue = (label, value, yy) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...SLATE_900);
            doc.text(value, right, yy, { align: 'right' });
            const valueWidth = doc.getTextWidth(value);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...SLATE_500);
            doc.text(`${label} `, right - valueWidth, yy, { align: 'right' });
        };
        let y = 46;
        const logoBase64 = this.getLogoBase64();
        if (logoBase64) {
            try {
                const scale = 150 / LOGO_CONTENT.width;
                const size = LOGO_CANVAS * scale;
                doc.addImage(logoBase64, 'PNG', margin - LOGO_CONTENT.x * scale, y - LOGO_CONTENT.y * scale, size, size, undefined, 'FAST');
            }
            catch (e) {
                this.logger.error('Logo render failed:', e);
            }
        }
        doc.setFillColor(...NAVY);
        doc.rect(0, 0, pageWidth, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(17);
        doc.setTextColor(...SLATE_900);
        doc.text('PAYMENT RECEIPT', right, y + 14, { align: 'right' });
        rightLabelValue('Receipt No:', `#REC-${data.orderId}`, y + 32);
        rightLabelValue('Order ID:', `#${data.orderId}`, y + 45);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...SLATE_500);
        doc.text(`Date: ${dateText}`, right, y + 58, { align: 'right' });
        y += 100;
        const colWidth = contentWidth / 2 - 12;
        const leftX = margin;
        const rightX = margin + contentWidth / 2 + 12;
        const heading = (text, x, yy) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(...SLATE_900);
            doc.text(text, x, yy, { charSpace: 0.8 });
        };
        heading('CUSTOMER DETAILS', leftX, y);
        heading('DELIVERY DESTINATION', rightX, y);
        const detailLines = (x, startY, lines) => {
            let yy = startY;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(...SLATE_600);
            for (const line of lines) {
                const wrapped = doc.splitTextToSize(line, colWidth);
                for (const w of wrapped) {
                    doc.text(w, x, yy);
                    yy += 14;
                }
            }
            return yy;
        };
        const nameY = y + 20;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...SLATE_900);
        doc.text(data.customerName || '-', leftX, nameY);
        doc.text(data.customerName || '-', rightX, nameY);
        const customerEnd = detailLines(leftX, nameY + 17, [data.email, data.phone ?? ''].filter(Boolean));
        const address = [data.shippingAddress, data.district].filter(Boolean).join(', ');
        const deliveryEnd = detailLines(rightX, nameY + 17, [address, data.phone ? `Contact: ${data.phone}` : ''].filter(Boolean));
        y = Math.max(customerEnd, deliveryEnd) + 22;
        const items = data.items && data.items.length > 0
            ? data.items
            : [{ name: 'Custom Magnet Frame', price: subtotal, quantity: 1 }];
        const getLineTotal = (price, quantity, name) => {
            const normalized = String(name ?? '').trim().toLowerCase();
            const isFourMagnetsPack = normalized === '4 magnets' || normalized.startsWith('4 magnets ');
            const packSize = isFourMagnetsPack ? 4 : 1;
            return price * (quantity / packSize);
        };
        const rowMeta = items.map((item) => ({
            name: item.name || 'Custom Magnet Frame',
            detail: [item.frameType, item.colorOption].filter(Boolean).join(' • '),
        }));
        (0, jspdf_autotable_1.default)(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            theme: 'plain',
            head: [['Product Description', 'Qty', 'Total']],
            body: items.map((item, i) => [
                rowMeta[i].detail ? ' \n ' : ' ',
                String(item.quantity || 1).padStart(2, '0'),
                money(getLineTotal(item.price || 0, item.quantity || 1, item.name)),
            ]),
            styles: {
                font: 'helvetica',
                fontSize: 10,
                textColor: SLATE_700,
                cellPadding: { top: 11, bottom: 11, left: 14, right: 14 },
                valign: 'middle',
            },
            headStyles: {
                fillColor: SLATE_100,
                textColor: SLATE_600,
                fontStyle: 'bold',
                fontSize: 8.5,
                cellPadding: { top: 10, bottom: 10, left: 14, right: 14 },
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 50 },
                2: { cellWidth: 110, halign: 'right', fontStyle: 'bold', textColor: SLATE_900 },
            },
            didParseCell: (hook) => {
                if (hook.section === 'head' && hook.column.index === 2) {
                    hook.cell.styles.halign = 'right';
                }
            },
            didDrawCell: (hook) => {
                if (hook.section !== 'body')
                    return;
                const { cell } = hook;
                if (hook.column.index === 0) {
                    const meta = rowMeta[hook.row.index];
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.setTextColor(...SLATE_900);
                    if (meta.detail) {
                        doc.text(meta.name, cell.x + 14, cell.y + cell.height / 2 - 2);
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(8);
                        doc.setTextColor(...SLATE_500);
                        doc.text(meta.detail, cell.x + 14, cell.y + cell.height / 2 + 10);
                    }
                    else {
                        doc.text(meta.name, cell.x + 14, cell.y + cell.height / 2 + 3.5);
                    }
                }
                doc.setDrawColor(...SLATE_100);
                doc.setLineWidth(0.8);
                doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
            },
        });
        y = doc.lastAutoTable.finalY + 28;
        if (y + 230 > pageHeight - 30) {
            doc.addPage();
            doc.setFillColor(...NAVY);
            doc.rect(0, 0, pageWidth, 8, 'F');
            y = 56;
        }
        const boxWidth = contentWidth * 0.48;
        const boxHeight = 84;
        doc.setFillColor(...SLATE_100);
        doc.roundedRect(margin, y, boxWidth, boxHeight, 8, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...SLATE_900);
        doc.text('PAYMENT INFORMATION', margin + 16, y + 22, { charSpace: 0.8 });
        const infoRow = (label, value, yy, color = SLATE_900) => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(...SLATE_500);
            doc.text(label, margin + 16, yy);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...color);
            doc.text(value, margin + boxWidth - 16, yy, { align: 'right' });
        };
        infoRow('Method', this.formatPaymentMethod(data.paymentMethod), y + 44);
        infoRow('Status', paymentStatusText, y + 64, isPaid ? GREEN : AMBER);
        const totalsX = margin + contentWidth * 0.55;
        let ty = y + 14;
        const totalsRow = (label, value, yy, color = SLATE_600) => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(...SLATE_600);
            doc.text(label, totalsX, yy);
            doc.setTextColor(...color);
            doc.text(value, right, yy, { align: 'right' });
        };
        totalsRow('Subtotal', money(subtotal), ty);
        ty += 22;
        if (deliveryFee > 0) {
            totalsRow('Delivery Charge', money(deliveryFee), ty);
        }
        else {
            totalsRow('Delivery Charge', 'Free', ty, GREEN);
        }
        ty += 14;
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.8);
        doc.setLineDashPattern([3, 3], 0);
        doc.line(totalsX, ty, right, ty);
        doc.setLineDashPattern([], 0);
        ty += 24;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...SLATE_900);
        doc.text(isPaid ? 'Total Amount Paid' : 'Total Amount', totalsX, ty);
        doc.setFontSize(16);
        doc.setTextColor(...RED);
        doc.text(money(data.totalValue), right, ty, { align: 'right' });
        y += boxHeight + 28;
        const bannerText = isPaid
            ? 'Your payment has been received successfully, and your order has been confirmed. Thank you for shopping with us!'
            : 'Your order has been received and confirmed. Thank you for shopping with us!';
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const bannerLines = doc.splitTextToSize(bannerText, contentWidth - 44);
        const bannerHeight = bannerLines.length * 14 + 28;
        doc.setFillColor(...NAVY);
        doc.roundedRect(margin, y, contentWidth, bannerHeight, 8, 8, 'F');
        doc.setTextColor(239, 246, 255);
        doc.text(bannerLines, margin + 22, y + 22);
        y += bannerHeight + 34;
        doc.setDrawColor(...SLATE_200);
        doc.setLineWidth(0.6);
        doc.line(margin, y, right, y);
        y += 24;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...SLATE_700);
        doc.text('WWW.MAGNIFY.LK', pageWidth / 2, y, { align: 'center', charSpace: 1.6 });
        y += 20;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...SLATE_600);
        doc.text('Contact Support: support@magnify.lk', pageWidth / 2, y, { align: 'center' });
        return Buffer.from(doc.output('arraybuffer'));
    }
};
exports.PdfGeneratorService = PdfGeneratorService;
exports.PdfGeneratorService = PdfGeneratorService = PdfGeneratorService_1 = __decorate([
    (0, common_1.Injectable)()
], PdfGeneratorService);
//# sourceMappingURL=pdf-generator.service.js.map