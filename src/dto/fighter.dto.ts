import { z } from 'zod';

export const CreateFighterDTO = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  nickname: z.string().optional(),
  stable: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  nationality: z.string().default('Senegal'),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

export const UpdateFighterDTO = z.object({
  name: z.string().min(2).optional(),
  nickname: z.string().optional(),
  stable: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  nationality: z.string().optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  wins: z.number().int().min(0).optional(),
  losses: z.number().int().min(0).optional(),
  draws: z.number().int().min(0).optional(),
});

export const ListFightersDTO = z.object({
  isActive: z.boolean().optional(),
  nationality: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});


// dto/fighter.dto.ts
export interface CreateFighterDTO {
  name: string;
  nickname?: string;
  stable?: string;
  birthDate?: string | Date;
  nationality?: string;
  weight?: number;
  height?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  isActive?: boolean;
}

export interface UpdateFighterDTO {
  name?: string;
  nickname?: string;
  stable?: string;
  birthDate?: string | Date;
  nationality?: string;
  weight?: number;
  height?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  isActive?: boolean;
}

export interface FighterFiltersDTO {
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchFightersDTO {
  query: string;
  limit?: number;
}

// Pour la réponse des statistiques
export interface FighterStatsDTO {
  totalFights: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: string;
  knockoutWins: number;
  submissionWins: number;
  decisionWins: number;
  avgFightDuration: string;
  lastFightDate: number | null;
}
export type CreateFighterDTOType = z.infer<typeof CreateFighterDTO>;
export type UpdateFighterDTOType = z.infer<typeof UpdateFighterDTO>;
export type ListFightersDTOType = z.infer<typeof ListFightersDTO>;
