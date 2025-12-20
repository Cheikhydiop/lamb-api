import { z } from 'zod';
import { BetStatus, FighterChoice } from '@prisma/client';

export const CreateBetDTO = z.object({
  amount: z.bigint().positive('Amount must be positive'),
  chosenFighter: z.enum(['A', 'B']),
  fightId: z.string().cuid('Invalid fight ID'),
  taggedUserId: z.string().cuid('Invalid user ID').optional(),
});

export const AcceptBetDTO = z.object({
  betId: z.string().cuid('Invalid bet ID'),
});

export const CancelBetDTO = z.object({
  betId: z.string().cuid('Invalid bet ID'),
});

export const ListBetsDTO = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'CANCELLED', 'POSTPONED']).optional(),
  fightId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type CreateBetDTOType = z.infer<typeof CreateBetDTO>;
export type AcceptBetDTOType = z.infer<typeof AcceptBetDTO>;
export type CancelBetDTOType = z.infer<typeof CancelBetDTO>;
export type ListBetsDTOType = z.infer<typeof ListBetsDTO>;
