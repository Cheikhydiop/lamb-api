import { PrismaClient, Prisma } from '@prisma/client';
import logger from '../utils/logger';

export interface CreateFighterDTO {
  name: string;
  nickname?: string;
  stable?: string;
  birthDate?: Date;
  birthPlace?: string;
  nationality?: string;
  weight?: number;
  height?: number;
  profileImage?: string;
}

export interface UpdateFighterDTO {
  name?: string;
  nickname?: string;
  stable?: string;
  birthDate?: Date;
  birthPlace?: string;
  nationality?: string;
  weight?: number;
  height?: number;
  status?: string;
  profileImage?: string;
}

export interface ListFightersDTO {
  search?: string;
  status?: string;
  stable?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'name' | 'wins' | 'totalFights';
  orderDirection?: 'asc' | 'desc';
}

export class FighterService {
  constructor(private prisma: PrismaClient) { }

  async listFighters(filters: ListFightersDTO) {
    try {
      const {
        search,
        status,
        stable,
        limit = 50,
        offset = 0,
        orderBy = 'name',
        orderDirection = 'asc'
      } = filters;

      const where: Prisma.FighterWhereInput = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { nickname: { contains: search, mode: 'insensitive' } },
          { stable: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (status) {
        where.status = status as any;
      }

      if (stable) {
        where.stable = { contains: stable, mode: 'insensitive' };
      }

      const orderByClause: Prisma.FighterOrderByWithRelationInput = {};
      orderByClause[orderBy] = orderDirection;

      const [fighters, total] = await Promise.all([
        this.prisma.fighter.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: orderByClause
        }),
        this.prisma.fighter.count({ where })
      ]);

      return {
        fighters,
        total,
        limit,
        offset
      };
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des lutteurs:', error);
      throw error;
    }
  }

  async createFighter(data: CreateFighterDTO) {
    try {
      // Vérifier l'existence d'un lutteur avec le même nom (insensible à la casse)
      const existing = await this.prisma.fighter.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: 'insensitive'
          }
        }
      });

      if (existing) {
        throw new Error(`Un lutteur avec le nom "${data.name}" existe déjà`);
      }

      const fighter = await this.prisma.fighter.create({
        data: {
          name: data.name,
          nickname: data.nickname,
          stable: data.stable,
          birthDate: data.birthDate,
          birthPlace: data.birthPlace,
          nationality: data.nationality || 'SN',
          weight: data.weight,
          height: data.height,
          profileImage: data.profileImage,
          status: 'ACTIVE'
        }
      });

      logger.info(`Lutteur créé: ${fighter.id} - ${fighter.name}`);
      return fighter;
    } catch (error: any) {
      logger.error('Erreur lors de la création du lutteur:', error);
      throw error;
    }
  }

  async getFighter(fighterId: string) {
    try {
      const fighter = await this.prisma.fighter.findUnique({
        where: { id: fighterId },
        include: {
          fightsAsA: {
            include: {
              fighterB: true,
              result: true,
              dayEvent: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          fightsAsB: {
            include: {
              fighterA: true,
              result: true,
              dayEvent: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!fighter) {
        throw new Error('Lutteur non trouvé');
      }

      return fighter;
    } catch (error: any) {
      logger.error(`Erreur lors de la récupération du lutteur ${fighterId}:`, error);
      throw error;
    }
  }

  async updateFighter(fighterId: string, data: UpdateFighterDTO) {
    try {
      const fighter = await this.prisma.fighter.findUnique({
        where: { id: fighterId }
      });

      if (!fighter) {
        throw new Error('Lutteur non trouvé');
      }

      if (data.name) {
        const existingName = await this.prisma.fighter.findFirst({
          where: {
            name: {
              equals: data.name,
              mode: 'insensitive'
            },
            id: {
              not: fighterId
            }
          }
        });

        if (existingName) {
          throw new Error(`Un lutteur avec le nom "${data.name}" existe déjà`);
        }
      }

      const updated = await this.prisma.fighter.update({
        where: { id: fighterId },
        data: {
          name: data.name,
          nickname: data.nickname,
          stable: data.stable,
          birthDate: data.birthDate,
          birthPlace: data.birthPlace,
          nationality: data.nationality,
          weight: data.weight,
          height: data.height,
          status: data.status as any,
          profileImage: data.profileImage
        }
      });

      logger.info(`Lutteur mis à jour: ${fighterId}`);
      return updated;
    } catch (error: any) {
      logger.error(`Erreur lors de la mise à jour du lutteur ${fighterId}:`, error);
      throw error;
    }
  }

  async deleteFighter(fighterId: string) {
    try {
      const fighter = await this.prisma.fighter.findUnique({
        where: { id: fighterId }
      });

      if (!fighter) {
        throw new Error('Lutteur non trouvé');
      }

      await this.prisma.fighter.delete({
        where: { id: fighterId }
      });

      logger.info(`Lutteur supprimé: ${fighterId}`);
      return { success: true };
    } catch (error: any) {
      logger.error(`Erreur lors de la suppression du lutteur ${fighterId}:`, error);
      throw error;
    }
  }

  async searchFighters(query: string, limit: number = 20) {
    try {
      const fighters = await this.prisma.fighter.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { nickname: { contains: query, mode: 'insensitive' } },
            { stable: { contains: query, mode: 'insensitive' } }
          ],
          status: 'ACTIVE'
        },
        take: limit,
        orderBy: { name: 'asc' }
      });

      return fighters;
    } catch (error: any) {
      logger.error('Erreur lors de la recherche de lutteurs:', error);
      throw error;
    }
  }

  async getTopFighters(limit: number = 10) {
    try {
      const fighters = await this.prisma.fighter.findMany({
        where: {
          status: 'ACTIVE'
        },
        orderBy: [
          { wins: 'desc' },
          { totalFights: 'desc' }
        ],
        take: limit
      });

      return fighters;
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des meilleurs lutteurs:', error);
      throw error;
    }
  }

  async getFighterStats(fighterId: string) {
    try {
      const fighter = await this.prisma.fighter.findUnique({
        where: { id: fighterId }
      });

      if (!fighter) {
        throw new Error('Lutteur non trouvé');
      }

      return {
        id: fighter.id,
        name: fighter.name,
        nickname: fighter.nickname,
        stable: fighter.stable,
        totalFights: fighter.totalFights,
        wins: fighter.wins,
        losses: fighter.losses,
        draws: fighter.draws,
        knockouts: fighter.knockouts,
        winRate: fighter.totalFights > 0
          ? ((fighter.wins / fighter.totalFights) * 100).toFixed(1)
          : '0.0'
      };
    } catch (error: any) {
      logger.error(`Erreur lors de la récupération des stats du lutteur ${fighterId}:`, error);
      throw error;
    }
  }
}