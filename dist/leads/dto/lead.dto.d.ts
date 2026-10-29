export declare class CreateLeadDto {
    id?: string;
    dateAdded?: string;
    business: string;
    phone?: string;
    source?: string;
    callStatus?: string;
    result?: string;
    product?: string;
    status?: string;
    nextFollowUp?: string;
    owner?: string;
    email?: string;
    address?: string;
    notes?: string;
    history?: Record<string, any>[];
    customerId?: string;
    order?: Record<string, any>;
    actor?: string;
}
export declare class ImportLeadsDto {
    leads: CreateLeadDto[];
}
export declare class UpdateLeadDto {
    business?: string;
    phone?: string;
    source?: string;
    callStatus?: string;
    result?: string;
    product?: string;
    status?: string;
    nextFollowUp?: string;
    owner?: string;
    email?: string;
    address?: string;
    notes?: string;
    history?: Record<string, any>[];
    customerId?: string;
    order?: Record<string, any>;
    actor?: string;
}
export declare class AddFollowUpDto {
    by?: string;
    callStatus: string;
    result?: string;
    product?: string;
    notes?: string;
    nextFollowUp?: string;
}
export declare class ConvertLeadDto {
    by?: string;
    product: string;
    quantity: number;
    unitPrice: number;
    address?: string;
    phone?: string;
}
export declare class ReassignLeadsDto {
    from: string;
    to: string;
}
export declare class UpsertTargetDto {
    monthlyOrders: number;
    salesAmount: number;
    dailyCalls: number;
    dailyLeads: number;
}
