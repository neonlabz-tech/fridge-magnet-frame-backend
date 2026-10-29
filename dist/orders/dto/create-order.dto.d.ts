declare class CreateOrderItemDto {
    productId?: string;
    name?: string;
    price?: number;
    quantity?: number;
    uploadedImages?: string[];
    primaryImage?: string;
    frameType?: string;
    colorOption?: string;
}
export declare class CreateOrderDto {
    orderId?: string;
    customerName?: string;
    customerId?: string;
    email?: string;
    phone?: string;
    qty?: number;
    totalValue?: number;
    deliveryFee?: number;
    shippingAddress?: string;
    district?: string;
    adminNote?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    paymentSlipUrl?: string;
    orderSource?: string;
    uploadedImages?: string[];
    items?: CreateOrderItemDto[];
}
export {};
