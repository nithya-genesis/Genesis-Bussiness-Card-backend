"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = require("./app.js");
const index_js_1 = require("./config/index.js");
const prisma_js_1 = require("./models/prisma.js");
async function bootstrap() {
    try {
        // Verify database connection
        await prisma_js_1.prisma.$connect();
        console.log('✅ Database connected successfully');
        app_js_1.app.listen(index_js_1.config.port, () => {
            console.log(`🚀 Genesis Business Card Backend running on http://localhost:${index_js_1.config.port}`);
            console.log(`📡 Environment: ${index_js_1.config.nodeEnv}`);
            console.log(`🔗 Frontend URL: ${index_js_1.config.frontendUrl}`);
        });
    }
    catch (err) {
        console.error('❌ Failed to start backend server:', err);
        process.exit(1);
    }
}
bootstrap();
