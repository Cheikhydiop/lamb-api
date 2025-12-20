"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListFightersDTO = exports.UpdateFighterDTO = exports.CreateFighterDTO = void 0;
const zod_1 = require("zod");
exports.CreateFighterDTO = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    nickname: zod_1.z.string().optional(),
    stable: zod_1.z.string().optional(),
    birthDate: zod_1.z.coerce.date().optional(),
    nationality: zod_1.z.string().default('Senegal'),
    weight: zod_1.z.number().positive().optional(),
    height: zod_1.z.number().positive().optional(),
});
exports.UpdateFighterDTO = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    nickname: zod_1.z.string().optional(),
    stable: zod_1.z.string().optional(),
    birthDate: zod_1.z.coerce.date().optional(),
    nationality: zod_1.z.string().optional(),
    weight: zod_1.z.number().positive().optional(),
    height: zod_1.z.number().positive().optional(),
    isActive: zod_1.z.boolean().optional(),
    wins: zod_1.z.number().int().min(0).optional(),
    losses: zod_1.z.number().int().min(0).optional(),
    draws: zod_1.z.number().int().min(0).optional(),
});
exports.ListFightersDTO = zod_1.z.object({
    isActive: zod_1.z.boolean().optional(),
    nationality: zod_1.z.string().optional(),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    offset: zod_1.z.number().int().min(0).default(0),
});
