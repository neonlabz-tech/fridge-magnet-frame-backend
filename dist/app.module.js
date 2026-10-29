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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
exports.AppModule = void 0;
const dns = __importStar(require("dns"));
const dotenv = __importStar(require("dotenv"));
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');
dotenv.config();
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const orders_module_1 = require("./orders/orders.module");
const products_module_1 = require("./products/products.module");
const cloudflareR2_module_1 = require("./cloudflareR2/cloudflareR2.module");
const mail_module_1 = require("./mail/mail.module");
const contact_module_1 = require("./contact/contact.module");
const feedback_module_1 = require("./feedback/feedback.module");
const admin_schema_1 = require("./schemas/admin.schema");
const inventory_module_1 = require("./inventory/inventory.module");
const finance_module_1 = require("./finance/finance.module");
const deliveries_module_1 = require("./deliveries/deliveries.module");
const leads_module_1 = require("./leads/leads.module");
const team_module_1 = require("./team/team.module");
const materials_module_1 = require("./materials/materials.module");
const logger = new common_1.Logger('MongoDB');
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            mongoose_1.MongooseModule.forRoot(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                connectionFactory: (connection) => {
                    connection.on('connected', () => {
                        logger.log('✅ MongoDB connected successfully');
                    });
                    connection.on('error', (error) => {
                        logger.error(`❌ MongoDB connection error: ${error.message}`);
                    });
                    return connection;
                },
            }),
            mongoose_1.MongooseModule.forFeature([{ name: admin_schema_1.Admin.name, schema: admin_schema_1.AdminSchema }]),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            orders_module_1.OrdersModule,
            products_module_1.ProductsModule,
            cloudflareR2_module_1.CloudflareR2Module,
            mail_module_1.MailModule,
            contact_module_1.ContactModule,
            feedback_module_1.FeedbackModule,
            inventory_module_1.InventoryModule,
            finance_module_1.FinanceModule,
            deliveries_module_1.DeliveriesModule,
            leads_module_1.LeadsModule,
            team_module_1.TeamModule,
            materials_module_1.MaterialsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map