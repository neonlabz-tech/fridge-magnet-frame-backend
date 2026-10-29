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
export declare class ReceiptPdfGenerator {
    private static getLogoBase64;
    static generateReceipt(data: ReceiptData): Buffer;
}
