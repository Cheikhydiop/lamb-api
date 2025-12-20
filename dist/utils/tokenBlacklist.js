"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToBlacklist = exports.isBlacklisted = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.JWT_SECRET, { expiresIn: '1d' });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.JWT_SECRET);
        return decoded;
    }
    catch (error) {
        throw new Error('Invalid token');
    }
};
exports.verifyToken = verifyToken;
const blacklist = new Set();
const isBlacklisted = (token) => {
    return blacklist.has(token);
};
exports.isBlacklisted = isBlacklisted;
const addToBlacklist = (token) => {
    blacklist.add(token);
};
exports.addToBlacklist = addToBlacklist;
