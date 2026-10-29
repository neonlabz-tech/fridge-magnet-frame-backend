import { OrderStatus } from '../schemas/order.schema';
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
    adminNote?: string;
    sendEmailNotification?: boolean;
    paymentStatus?: string;
    customerName?: string;
    email?: string;
    phone?: string;
    shippingAddress?: string;
}
