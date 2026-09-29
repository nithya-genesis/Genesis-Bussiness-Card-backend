"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'genesis_super_secret_jwt_key_2026_bd_platform',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    defaultHourlyRate: parseFloat(process.env.DEFAULT_HOURLY_RATE || '40'),
    proposalTokenExpiryDays: parseInt(process.env.PROPOSAL_TOKEN_EXPIRY_DAYS || '30', 10),
    company: {
        name: 'Genesis Training & Placement Solutions',
        tagline: 'Transforming Campus Talent into Industry Ready Professionals',
        email: 'partnerships@genesistraining.in',
        phone: '+91 98765 43210',
        website: 'https://genesistraining.in',
        address: 'Genesis Tower, Level 4, Tech Park Boulevard, Bengaluru, Karnataka - 560100',
    },
};
