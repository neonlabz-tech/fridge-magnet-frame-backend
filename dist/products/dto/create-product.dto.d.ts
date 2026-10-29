export declare class PersonalizationLabelDto {
    label: string;
}
export declare class CreateProductDto {
    productName: string;
    productId: string;
    stock: number;
    price: number;
    imagecount: number;
    manufactureCost?: number;
    isActive?: boolean;
    description: string;
    personalization?: PersonalizationLabelDto[];
    status?: string;
}
