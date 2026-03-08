"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const dropdowns_1 = __importDefault(require("./routes/dropdowns"));
const suburbs_1 = __importDefault(require("./routes/suburbs"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
const dbPath = path_1.default.resolve(__dirname, '../suburbs.db');
app.use(express_1.default.json());
// Test route
app.get('/', (_req, res) => res.send('Server is running!'));
// Mount dropdown routes
app.use('/api/dropdowns', dropdowns_1.default);
app.use('/api/suburbs', suburbs_1.default);
// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Backend CWD:', process.cwd());
    console.log('DB absolute path:', dbPath);
});
//# sourceMappingURL=server.js.map