"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRONG_PASSWORD_MESSAGE = exports.STRONG_PASSWORD_RX = void 0;
exports.assertStrongPassword = assertStrongPassword;
exports.generateTempPassword = generateTempPassword;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
exports.STRONG_PASSWORD_RX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
exports.STRONG_PASSWORD_MESSAGE = 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter and a number';
function assertStrongPassword(password) {
    if (!exports.STRONG_PASSWORD_RX.test(password ?? '')) {
        throw new common_1.BadRequestException(exports.STRONG_PASSWORD_MESSAGE);
    }
}
function generateTempPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const bytes = crypto.randomBytes(10);
    const body = Array.from(bytes, (b) => chars[b % chars.length]).join('');
    return `${body}@7`;
}
//# sourceMappingURL=password.js.map