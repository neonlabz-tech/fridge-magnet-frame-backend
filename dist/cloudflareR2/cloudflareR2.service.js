"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudflareR2Service = void 0;
const crypto_1 = require("crypto");
const path_1 = require("path");
const client_s3_1 = require("@aws-sdk/client-s3");
const common_1 = require("@nestjs/common");
let CloudflareR2Service = class CloudflareR2Service {
    constructor() {
        const accountId = process.env.R2_ACCOUNT_ID;
        const accessKeyId = process.env.R2_ACCESS_KEY_ID;
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
        const endpoint = process.env.R2_ENDPOINT ||
            (accountId
                ? `https://${accountId}.r2.cloudflarestorage.com`
                : undefined);
        const bucket = process.env.R2_BUCKET_NAME;
        const publicUrl = process.env.R2_PUBLIC_URL;
        if (!endpoint ||
            !accessKeyId ||
            !secretAccessKey ||
            !bucket ||
            !publicUrl) {
            throw new Error('Cloudflare R2 configuration is incomplete. Check R2_ACCOUNT_ID/R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and R2_PUBLIC_URL.');
        }
        this.bucket = bucket;
        this.publicUrl = publicUrl.replace(/\/+$/, '');
        this.client = new client_s3_1.S3Client({
            region: 'auto',
            endpoint,
            credentials: { accessKeyId, secretAccessKey },
        });
    }
    async uploadImage(file, folder = 'products') {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        const safeFolder = folder.replace(/^\/+|\/+$/g, '');
        const extension = (0, path_1.extname)(file.originalname || '').toLowerCase();
        const key = `${safeFolder}/${(0, crypto_1.randomUUID)()}${extension}`;
        try {
            await this.client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype || 'application/octet-stream',
            }));
            return {
                secure_url: `${this.publicUrl}/${key
                    .split('/')
                    .map(encodeURIComponent)
                    .join('/')}`,
                public_id: key,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(`Cloudflare R2 upload error: ${message}`);
        }
    }
    async uploadMultipleImages(files, folder = 'products') {
        if (!files?.length) {
            throw new common_1.BadRequestException('No files provided');
        }
        return Promise.all(files.map((file) => this.uploadImage(file, folder)));
    }
    async deleteImage(publicId) {
        if (!publicId) {
            throw new common_1.BadRequestException('Object key is required');
        }
        try {
            await this.client.send(new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucket,
                Key: publicId,
            }));
            return { success: true, message: 'Image deleted successfully' };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(`Cloudflare R2 delete error: ${message}`);
        }
    }
    async deleteMultipleImages(publicIds) {
        if (!publicIds?.length) {
            throw new common_1.BadRequestException('No object keys provided');
        }
        return Promise.all(publicIds.map((publicId) => this.deleteImage(publicId)));
    }
};
exports.CloudflareR2Service = CloudflareR2Service;
exports.CloudflareR2Service = CloudflareR2Service = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CloudflareR2Service);
//# sourceMappingURL=cloudflareR2.service.js.map