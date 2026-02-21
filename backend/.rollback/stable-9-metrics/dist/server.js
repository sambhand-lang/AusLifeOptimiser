"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const suburbs_1 = __importDefault(require("./routes/suburbs"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// CORS configuration: dev-friendly, production-safe
const corsOptions = (() => {
    // In development, allow requests from common local dev ports
    if (process.env.NODE_ENV !== 'production') {
        return {
            origin: (origin, callback) => {
                // Allow localhost and common dev ports, no-origin (curl/Postman), or explicit FRONTEND_URL
                const devOrigins = [
                    /^http:\/\/localhost:\d+$/, // localhost on any port
                    /^http:\/\/127.0.0.1:\d+$/, // 127.0.0.1 on any port
                ];
                const allowedOrigins = process.env.FRONTEND_URL
                    ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
                    : [];
                if (!origin || devOrigins.some(pattern => pattern.test(origin)) || allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    callback(new Error('CORS not allowed'), false);
                }
            },
            credentials: true,
        };
    }
    // Production: strict CORS
    return {
        origin: process.env.FRONTEND_URL || 'https://your-production-domain.com',
        credentials: true,
    };
})();
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Routes
app.use('/api/suburbs', suburbs_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend server is running' });
});
// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Australian Finance Tools Backend API' });
});
// Error handling middleware
app.use((err, req, res) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
    });
});
// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map