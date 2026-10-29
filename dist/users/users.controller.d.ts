import { HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    private normalizeCustomerDto;
    create(createCustomerDto: any): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: any;
    }>;
    findAll(page?: string, limit?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: any[];
        total: number;
        activeTotal: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByEmail(email: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: any;
    }>;
    findOne(id: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: any;
    }>;
    update(id: string, updateCustomerDto: any): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: any;
    }>;
    updateStatus(id: string, body: {
        isActive: boolean;
        source: 'user' | 'customer';
    }): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: any;
    }>;
    updateByToken(token: string, updateCustomerDto: any): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: any;
    }>;
    remove(id: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: any;
    }>;
}
