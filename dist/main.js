"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const node_dns_1 = require("node:dns");
async function bootstrap() {
    (0, node_dns_1.setServers)(['1.1.1.1', '8.8.8.8']);
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const allowedOrigins = [
        'https://admin.magnifycreation.lk',
        'https://magnifycreation.lk',
        'https://www.magnifycreation.lk',
        'https://www.admin.magnifycreation.lk',
    ];
    app.enableCors({
        origin: (origin, callback) => {
            const isLocalDev = process.env.NODE_ENV !== 'production' &&
                !!origin &&
                /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
            if (!origin || isLocalDev || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });
    app.use((0, cookie_parser_1.default)());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(process.env.PORT || 4000);
}
bootstrap();
//# sourceMappingURL=main.js.map