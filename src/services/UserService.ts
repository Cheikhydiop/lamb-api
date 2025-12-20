import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/tokenUtils';
import {
  ValidationError,
  DatabaseError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ConflictError
} from '../errors/customErrors';
import { SignUpDto as Register } from '../types/auth/sign-up';
import { SignInDto as Login } from '../types/auth/sign-in';
import UserValidator from '../utils/validators/userValidator';
import { UserRepository } from '../repositories/UserRepository'; // Vérifiez ce chemin
import { WalletRepository } from '../repositories/WalletRepository';
import { EmailVerificationService } from './EmailVerificationService';
import { SessionRepository, DeviceType, SessionStatus } from '../repositories/SessionRepository';
import logger from '../utils/logger';
import { Request } from 'express';
import { RateLimitUtils } from '../utils/RateLimitInfo';

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private walletRepository: WalletRepository,
    private emailVerificationService: EmailVerificationService,
    private sessionRepository: SessionRepository,
    private prisma: PrismaClient // Injected for complex queries/aggregations not yet in repositories
  ) {
    logger.info('UserService initialized');
  }

  /**
   * Récupère un utilisateur par son ID
   */
  async getUserById(userId: string) {
    try {
      const user = await this.userRepository.findByIdWithWallet(userId);

      if (!user) {
        throw new NotFoundError('Utilisateur non trouvé');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error fetching user', error);
      throw new DatabaseError('Erreur lors de la récupération de l\'utilisateur');
    }
  }

  /**
   * Met à jour les informations d'un utilisateur
   */
  async updateUser(userId: string, data: any) {
    try {
      // Validate input if needed
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.phone) updateData.phone = data.phone;
      if (data.email) updateData.email = data.email;

      const user = await this.userRepository.update(userId, updateData);
      logger.info(`User updated: ${userId}`);
      return user;
    } catch (error) {
      logger.error('Error updating user', error);
      throw new DatabaseError('Erreur lors de la mise à jour de l\'utilisateur');
    }
  }

  /**
   * Change le mot de passe d'un utilisateur
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    try {
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new NotFoundError('Utilisateur non trouvé');
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        throw new AuthenticationError('Mot de passe actuel incorrect');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.userRepository.updatePassword(userId, hashedPassword);

      logger.info(`Password changed for user: ${userId}`);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof AuthenticationError) throw error;
      logger.error('Error changing password', error);
      throw new DatabaseError('Erreur lors du changement de mot de passe');
    }
  }

  /**
   * Désactive un compte utilisateur
   */
  async deactivateAccount(userId: string) {
    try {
      await this.userRepository.update(userId, { isActive: false });
      logger.info(`Account deactivated: ${userId}`);
    } catch (error) {
      logger.error('Error deactivating account', error);
      throw new DatabaseError('Erreur lors de la désactivation du compte');
    }
  }

  /**
   * Réactive un compte utilisateur
   */
  async reactivateAccount(userId: string) {
    try {
      await this.userRepository.update(userId, { isActive: true });
      logger.info(`Account reactivated: ${userId}`);
    } catch (error) {
      logger.error('Error reactivating account', error);
      throw new DatabaseError('Erreur lors de la réactivation du compte');
    }
  }

  /**
   * Récupère les statistiques d'un utilisateur
   */
  async getUserStats(userId: string) {
    try {
      // Using direct prisma queries for stats as repositories might not have these specific aggregations
      const [betStats, transactionStats, wallet] = await Promise.all([
        this.prisma.bet.findMany({
          where: { OR: [{ creatorId: userId }, { acceptorId: userId }] },
        }),
        this.prisma.transaction.findMany({
          where: { userId },
        }),
        this.prisma.wallet.findUnique({
          where: { userId },
        }),
      ]);

      const totalBets = betStats.length;
      const acceptedBets = betStats.filter((b) => b.status === valFromEnum('ACCEPTED')).length;
      const totalTransactions = transactionStats.length;
      const totalWinnings = await this.prisma.winning.aggregate({
        where: { userId },
        _sum: { amount: true },
      });

      return {
        totalBets,
        acceptedBets,
        totalTransactions,
        totalWinnings: totalWinnings._sum.amount || BigInt(0),
        wallet: wallet ? this.sanitizeBigInt(wallet) : null,
      };
    } catch (error) {
      logger.error('Error fetching user stats', error);
      throw new DatabaseError('Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * Liste les utilisateurs (Admin)
   */
  async listUsers(limit: number = 20, offset: number = 0) {
    try {
      const result = await this.userRepository.findAll(Math.floor(offset / limit) + 1, limit);
      return result.users;
    } catch (error) {
      logger.error('Error listing users', error);
      throw new DatabaseError('Erreur lors de la récupération de la liste des utilisateurs');
    }
  }

  /**
   * Supprime un utilisateur (Admin)
   */
  async deleteUser(userId: string) {
    try {
      // Check if user has active bets or transactions
      // Implementation migrated from user.service.ts
      const activeBets = await this.prisma.bet.count({
        where: { OR: [{ creatorId: userId }, { acceptorId: userId }], status: 'ACCEPTED' },
      });

      if (activeBets > 0) {
        throw new ConflictError('Impossible de supprimer un utilisateur avec des paris actifs');
      }

      await this.userRepository.delete(userId);
      logger.info(`User deleted: ${userId}`);
    } catch (error) {
      if (error instanceof ConflictError) throw error;
      logger.error('Error deleting user', error);
      throw new DatabaseError('Erreur lors de la suppression de l\'utilisateur');
    }
  }

  // Helper for BigInt serialization (duplicated from repo, but useful here if returning direct prisma results)
  private sanitizeBigInt<T>(data: T): T {
    if (data === null || data === undefined) return data;
    if (typeof data === 'bigint') return String(data) as any;
    if (Array.isArray(data)) return data.map(item => this.sanitizeBigInt(item)) as any;
    if (typeof data === 'object') {
      const sanitized: any = {};
      for (const key in data) sanitized[key] = this.sanitizeBigInt(data[key]);
      return sanitized;
    }
    return data;
  }
}

// Helper to handle Enum strings if needed, though Prisma Enums are usually available via import
function valFromEnum(val: string): any { return val; } 