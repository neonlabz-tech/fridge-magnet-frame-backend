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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt = __importStar(require("bcrypt"));
const MONGODB_URI = process.env.MONGODB_URI;
const AdminSchema = new mongoose_1.default.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
    isActive: { type: Boolean, default: true },
    fullName: { type: String },
});
const UserSchema = new mongoose_1.default.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String },
});
const Admin = mongoose_1.default.model('Admin', AdminSchema);
const User = mongoose_1.default.model('User', UserSchema);
async function seed() {
    await mongoose_1.default.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    const email = process.env.ADMIN_EMAIL;
    const deletedUser = await User.deleteOne({ email, role: 'admin' });
    if (deletedUser.deletedCount > 0) {
        console.log('🗑️  Removed old admin from User collection');
    }
    const existing = await Admin.findOne({ email });
    if (existing) {
        console.log('Admin already exists in Admin collection, skipping.');
        await mongoose_1.default.disconnect();
        return;
    }
    const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await Admin.create({
        email,
        password,
        role: 'admin',
        isActive: true,
        fullName: 'Admin',
    });
    console.log('✅ Admin created in Admin collection: ' + email);
    await mongoose_1.default.disconnect();
}
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map