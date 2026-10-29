import { PersonalizationLabelDto } from './create-product.dto';
export declare class UpdateProductDto {
    productName?: any;
    productId?: any;
    stock?: number;
    price?: number;
    imagecount?: number;
    manufactureCost?: number;
    isActive?: boolean;
    description?: any;
    personalization?: PersonalizationLabelDto[];
    status?: string;
}
