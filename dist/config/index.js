"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATABASE_CONFIG = exports.JWT_SECRET = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
exports.JWT_SECRET = process.env.JWT_SECRET || 'secret-inesic';
exports.DATABASE_CONFIG = {
    type: process.env.DB_TYPE || 'prisma',
    url: process.env.DATABASE_URL
};
console.log(`🔧 Config loaded - DB Type: ${exports.DATABASE_CONFIG.type}, Port: ${exports.PORT}`);
