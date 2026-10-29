"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let statusCode;
        let message;
        const maybeMulterError = exception;
        if (maybeMulterError?.code === 'LIMIT_UNEXPECTED_FILE' && maybeMulterError?.field === 'galleryImages') {
            statusCode = common_1.HttpStatus.BAD_REQUEST;
            message = 'You can upload a maximum of 5 gallery images.';
        }
        else if (exception instanceof common_1.HttpException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const res = exceptionResponse;
                if (Array.isArray(res.message)) {
                    message = res.message.join(', ');
                }
                else {
                    message = res.message || exception.message;
                }
            }
            else {
                message = exception.message;
            }
            if (statusCode === common_1.HttpStatus.BAD_REQUEST && message.includes('galleryImages')) {
                message = 'You can upload a maximum of 5 gallery images.';
            }
        }
        else if (exception instanceof Error) {
            statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = exception.message || 'Internal server error';
        }
        else {
            statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
        }
        response.status(statusCode).json({
            statusCode,
            message,
            error: true,
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map