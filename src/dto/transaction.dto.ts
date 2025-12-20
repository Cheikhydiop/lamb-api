import { z } from 'zod';

export const CreateTransactionDTO = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'BET_PLACED', 'BET_WIN', 'BET_REFUND', 'COMMISSION', 'BONUS', 'PENALTY']),
  amount: z.bigint().positive('Amount must be positive'),
  provider: z.enum(['WAVE', 'ORANGE_MONEY', 'FREE_MONEY']).optional(),
  notes: z.string().optional(),
});

export const DepositDTO = z.object({
  amount: z.bigint().positive('Amount must be positive'),
  provider: z.enum(['WAVE', 'ORANGE_MONEY', 'FREE_MONEY']),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
});

export const WithdrawalDTO = z.object({
  amount: z.bigint().positive('Amount must be positive'),
  provider: z.enum(['WAVE', 'ORANGE_MONEY', 'FREE_MONEY']),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
});

export const ConfirmTransactionDTO = z.object({
  transactionId: z.string().cuid(),
  externalRef: z.string(),
  status: z.enum(['CONFIRMED', 'FAILED']),
});

export const ListTransactionsDTO = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED']).optional(),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'BET_PLACED', 'BET_WIN', 'BET_REFUND', 'COMMISSION', 'BONUS', 'PENALTY']).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type CreateTransactionDTOType = z.infer<typeof CreateTransactionDTO>;
export type DepositDTOType = z.infer<typeof DepositDTO>;
export type WithdrawalDTOType = z.infer<typeof WithdrawalDTO>;
export type ConfirmTransactionDTOType = z.infer<typeof ConfirmTransactionDTO>;
export type ListTransactionsDTOType = z.infer<typeof ListTransactionsDTO>;
