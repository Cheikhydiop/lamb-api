"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsDTO = exports.ConfirmTransactionDTO = exports.WithdrawalDTO = exports.DepositDTO = exports.CreateTransactionDTO = void 0;
const zod_1 = require("zod");
exports.CreateTransactionDTO = zod_1.z.object({
    type: zod_1.z.enum(['DEPOSIT', 'WITHDRAWAL', 'BET_PLACED', 'BET_WIN', 'BET_REFUND', 'COMMISSION', 'BONUS', 'PENALTY']),
    amount: zod_1.z.bigint().positive('Amount must be positive'),
    provider: zod_1.z.enum(['WAVE', 'ORANGE_MONEY', 'FREE_MONEY']).optional(),
    notes: zod_1.z.string().optional(),
});
exports.DepositDTO = zod_1.z.object({
    amount: zod_1.z.bigint().positive('Amount must be positive'),
    provider: zod_1.z.enum(['WAVE', 'ORANGE_MONEY', 'FREE_MONEY']),
    phoneNumber: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
});
exports.WithdrawalDTO = zod_1.z.object({
    amount: zod_1.z.bigint().positive('Amount must be positive'),
    provider: zod_1.z.enum(['WAVE', 'ORANGE_MONEY', 'FREE_MONEY']),
    phoneNumber: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
});
exports.ConfirmTransactionDTO = zod_1.z.object({
    transactionId: zod_1.z.string().cuid(),
    externalRef: zod_1.z.string(),
    status: zod_1.z.enum(['CONFIRMED', 'FAILED']),
});
exports.ListTransactionsDTO = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED']).optional(),
    type: zod_1.z.enum(['DEPOSIT', 'WITHDRAWAL', 'BET_PLACED', 'BET_WIN', 'BET_REFUND', 'COMMISSION', 'BONUS', 'PENALTY']).optional(),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    offset: zod_1.z.number().int().min(0).default(0),
});
