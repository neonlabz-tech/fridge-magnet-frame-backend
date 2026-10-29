export declare class CreateTransactionDto {
    id?: string;
    kind: string;
    date: string;
    ref?: string;
    party?: string;
    note?: string;
    amount: number;
    method?: string;
    status?: string;
    createdBy?: string;
}
export declare class UpdateTransactionDto {
    kind?: string;
    date?: string;
    ref?: string;
    party?: string;
    note?: string;
    amount?: number;
    method?: string;
    status?: string;
}
