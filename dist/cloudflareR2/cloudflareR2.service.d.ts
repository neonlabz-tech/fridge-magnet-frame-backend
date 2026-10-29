type StoredImage = {
    secure_url: string;
    public_id: string;
};
export declare class CloudflareR2Service {
    private readonly client;
    private readonly bucket;
    private readonly publicUrl;
    constructor();
    uploadImage(file: Express.Multer.File, folder?: string): Promise<StoredImage>;
    uploadMultipleImages(files: Express.Multer.File[], folder?: string): Promise<StoredImage[]>;
    deleteImage(publicId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteMultipleImages(publicIds: string[]): Promise<{
        success: boolean;
        message: string;
    }[]>;
}
export {};
