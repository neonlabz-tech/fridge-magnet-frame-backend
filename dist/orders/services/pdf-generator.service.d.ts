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
    paymentMethod?: string;
    paymentStatus?: string;
}
export declare class PdfGeneratorService {
    private readonly logger;
    private logoCache;
    generateReceipt(data: ReceiptPdfData): Promise<Buffer>;
    private getLogoBase64;
    private formatPaymentMethod;
    private buildReceipt;
}
