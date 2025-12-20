"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListBetsDTO = exports.CancelBetDTO = exports.AcceptBetDTO = exports.CreateBetDTO = void 0;
const zod_1 = require("zod");
exports.CreateBetDTO = zod_1.z.object({
    amount: zod_1.z.bigint().positive('Amount must be positive'),
    chosenFighter: zod_1.z.enum(['A', 'B']),
    fightId: zod_1.z.string().cuid('Invalid fight ID'),
    taggedUserId: zod_1.z.string().cuid('Invalid user ID').optional(),
});
exports.AcceptBetDTO = zod_1.z.object({
    betId: zod_1.z.string().cuid('Invalid bet ID'),
});
exports.CancelBetDTO = zod_1.z.object({
    betId: zod_1.z.string().cuid('Invalid bet ID'),
});
exports.ListBetsDTO = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'ACCEPTED', 'CANCELLED', 'POSTPONED']).optional(),
    fightId: zod_1.z.string().cuid().optional(),
    userId: zod_1.z.string().cuid().optional(),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    offset: zod_1.z.number().int().min(0).default(0),
});
