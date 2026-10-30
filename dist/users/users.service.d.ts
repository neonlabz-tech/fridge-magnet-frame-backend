import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { OrderDocument } from '../orders/schemas/order.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class UsersService {
    private userModel;
    private orderModel;
    constructor(userModel: Model<User>, orderModel: Model<OrderDocument>);
    private orderStatsByEmail;
    private serializeCustomerWithStats;
    create(email: string, password: string, role?: string, fullName?: string, customerFields?: {
        phoneNumber?: string;
        customerAddress?: string;
        customerId?: string;
        registrationType?: 'website' | 'manual';
        emailVerified?: boolean;
    }): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findByResetToken(token: string): Promise<User | null>;
    findByActivationToken(token: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    findById(id: string): Promise<User | null>;
    updateActiveStatus(id: string, isActive: boolean): Promise<User | null>;
    findByIdWithPassword(id: string): Promise<User | null>;
    updateProfile(id: string, update: Partial<Pick<User, 'fullName' | 'email' | 'bio' | 'avatar' | 'twoFactorEnabled' | 'phoneNumber' | 'customerAddress'>>): Promise<User | null>;
    updateAvatar(id: string, avatar: string, avatarPublicId: string): Promise<User | null>;
    updatePassword(id: string, newHashedPassword: string): Promise<void>;
    createAdmin(email: string, password: string): Promise<User>;
    findAllByRole(role: string): Promise<User[]>;
    findCustomerByIdOrCustomerId(id: string): Promise<User | null>;
    updateCustomerFields(id: string, fields: Partial<Pick<User, 'fullName' | 'phoneNumber' | 'customerAddress' | 'isActive'>>): Promise<User | null>;
    generateAndAssignCustomerId(userId: string): Promise<string>;
    findCustomerByEmail(email: string): Promise<User | null>;
    private serializeCustomer;
    private normalisePhone;
    private static readonly NO_EMAIL_DOMAIN;
    private assertPhoneOk;
    createCustomer(dto: CreateCustomerDto): Promise<any>;
    findCustomerByEmailAddress(email: string): Promise<any | null>;
    findAllCustomers(page?: number, limit?: number): Promise<{
        data: any[];
        total: number;
        activeTotal: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOneCustomer(id: string): Promise<any>;
    updateCustomer(id: string, dto: UpdateCustomerDto): Promise<any>;
    removeCustomer(id: string): Promise<any>;
    setCustomerActiveStatus(id: string, isActive: boolean, _source: 'user' | 'customer'): Promise<any>;
    updateCustomerByToken(token: string, dto: UpdateCustomerDto): Promise<any>;
    ensureForRegisteredUser(user: {
        email: string;
        fullName?: string;
    }): Promise<any>;
    updateFromOrder(order: {
        email: string;
        customerName: string;
        phone?: string;
        shippingAddress: string;
        manual?: boolean;
    }): Promise<any>;
}
