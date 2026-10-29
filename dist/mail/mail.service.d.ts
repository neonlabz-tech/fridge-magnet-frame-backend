import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class MailService implements OnModuleInit {
    private readonly logger;
    private readonly resend;
    private fromAddress;
    private readonly adminAddress;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    private logSendError;
    private sendWithResend;
    sendActivationEmail(opts: {
        to: string;
        fullName?: string;
        activationLink: string;
    }): Promise<void>;
    sendMail(options: {
        to: string;
        subject: string;
        text: string;
        html?: string;
        replyTo?: string;
    }): Promise<void>;
    sendOrderStatusUpdate(opts: {
        to: string;
        customerName: string;
        orderId: string;
        newStatus: string;
        adminNote?: string;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    sendOrderPlacedAdminNotification(order: {
        orderId: string;
        customerName: string;
        email: string;
        phone?: string;
        qty: number;
        totalValue: number;
        subtotal: number;
        deliveryFee: number;
        paymentMethod?: string;
        paymentSlipUrl?: string;
        shippingAddress?: string;
        district?: string;
        items?: {
            name?: string;
            price?: number;
            quantity?: number;
            frameType?: string;
            colorOption?: string;
        }[];
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    private stripName;
}
