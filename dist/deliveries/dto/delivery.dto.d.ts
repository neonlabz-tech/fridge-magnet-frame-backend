export declare class CreateDeliveryDto {
    id?: string;
    orderId: string;
    orderTotal?: number;
    method?: string;
    tracking?: string;
    driver?: string;
    place?: string;
    recipient?: string;
    phone?: string;
    address?: string;
    date?: string;
    timeSlot?: string;
    status?: string;
    vehicleType?: string;
    licenseNo?: string;
    plateNo?: string;
    emergencyContact?: string;
    zones?: string[];
}
export declare class UpdateDeliveryDto {
    orderId?: string;
    orderTotal?: number;
    method?: string;
    tracking?: string;
    driver?: string;
    place?: string;
    recipient?: string;
    phone?: string;
    address?: string;
    date?: string;
    timeSlot?: string;
    status?: string;
    vehicleType?: string;
    licenseNo?: string;
    plateNo?: string;
    emergencyContact?: string;
    zones?: string[];
}
export declare class UpdateDeliveryStatusDto {
    status: string;
}
export declare class BulkDeliveryStatusDto {
    ids: string[];
    status: string;
}
