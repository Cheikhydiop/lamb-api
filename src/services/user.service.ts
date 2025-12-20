import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import logger from '../utils/logger';

@Service()
export class UserService {
  constructor(private prisma: PrismaClient) {}

  async getUserById(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isEmailVerified: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          wallet: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Error fetching user', error);
      throw error;
    }
  }

  async updateUser(userId: string, data: any) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isEmailVerified: true,
          isActive: true,
        },
      });
      logger.info(`User updated: ${userId}`);
      return user;
    } catch (error) {
      logger.error('Error updating user', error);
      throw error;
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid current password');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      logger.info(`Password changed for user: ${userId}`);
    } catch (error) {
      logger.error('Error changing password', error);
      throw error;
    }
  }

  async deactivateAccount(userId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });
      logger.info(`Account deactivated: ${userId}`);
    } catch (error) {
      logger.error('Error deactivating account', error);
      throw error;
    }
  }

  async reactivateAccount(userId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      });
      logger.info(`Account reactivated: ${userId}`);
    } catch (error) {
      logger.error('Error reactivating account', error);
      throw error;
    }
  }

  async getUserStats(userId: string) {
    try {
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
      const acceptedBets = betStats.filter((b) => b.status === 'ACCEPTED').length;
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
        wallet,
      };
    } catch (error) {
      logger.error('Error fetching user stats', error);
      throw error;
    }
  }

  async listUsers(limit: number = 20, offset: number = 0) {
    try {
      const users = await this.prisma.user.findMany({
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return users;
    } catch (error) {
      logger.error('Error listing users', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      // Check if user has active bets or transactions
      const activeBets = await this.prisma.bet.count({
        where: { OR: [{ creatorId: userId }, { acceptorId: userId }], status: 'ACCEPTED' },
      });

      if (activeBets > 0) {
        throw new Error('Cannot delete user with active bets');
      }

      await this.prisma.user.delete({
        where: { id: userId },
      });
      logger.info(`User deleted: ${userId}`);
    } catch (error) {
      logger.error('Error deleting user', error);
      throw error;
    }
  }
}
