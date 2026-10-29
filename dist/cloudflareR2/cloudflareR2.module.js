"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudflareR2Module = void 0;
const common_1 = require("@nestjs/common");
const cloudflareR2_service_1 = require("./cloudflareR2.service");
let CloudflareR2Module = class CloudflareR2Module {
};
exports.CloudflareR2Module = CloudflareR2Module;
exports.CloudflareR2Module = CloudflareR2Module = __decorate([
    (0, common_1.Module)({
        providers: [cloudflareR2_service_1.CloudflareR2Service],
        exports: [cloudflareR2_service_1.CloudflareR2Service],
    })
], CloudflareR2Module);
//# sourceMappingURL=cloudflareR2.module.js.map