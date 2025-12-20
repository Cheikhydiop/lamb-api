import { PrismaClient, Wallet, User } from '@prisma/client';
import { DatabaseError } from '../errors/customErrors';

export class WalletRepository {
  constructor(private prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<(Wallet & { user: User }) | null> {
    try {
      return await this.prisma.wallet.findUnique({
        where: { userId },
        include: { user: true }
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to find wallet by user ID: ${error.message}`);
    }
  }

  async findById(walletId: string): Promise<Wallet | null> {
    try {
      return await this.prisma.wallet.findUnique({
        where: { id: walletId }
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to find wallet by ID: ${error.message}`);
    }
  }

  async create(walletData: {
    userId: string;
    balance?: bigint;
    lockedBalance?: bigint;
  }): Promise<Wallet> {
    try {
      return await this.prisma.wallet.create({
        data: {
          userId: walletData.userId,
          balance: walletData.balance ?? 0,
          lockedBalance: walletData.lockedBalance ?? 0
        }
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to create wallet: ${error.message}`);
    }
  }

  async updateBalance(userId: string, balance: bigint): Promise<Wallet> {
    try {
      return await this.prisma.wallet.update({
        where: { userId },
        data: { balance }
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to update wallet balance: ${error.message}`);
    }
  }

  async updateLockedBalance(userId: string, lockedBalance: bigint): Promise<Wallet> {
    try {
      return await this.prisma.wallet.update({
        where: { userId },
        data: { lockedBalance }
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to update locked balance: ${error.message}`);
    }
  }

  async lockFunds(userId: string, amount: bigint): Promise<Wallet> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId }
        });

        if (!wallet) {
          throw new Error('Wallet not found');
        }

        if (wallet.balance < amount) {
          throw new Error('Insufficient balance');
        }

        return await tx.wallet.update({
          where: { userId },
          data: {
            balance: wallet.balance - amount,
            lockedBalance: wallet.lockedBalance + amount
          }
        });
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to lock funds: ${error.message}`);
    }
  }

  async unlockFunds(userId: string, amount: bigint): Promise<Wallet> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId }
        });

        if (!wallet) {
          throw new Error('Wallet not found');
        }

        if (wallet.lockedBalance < amount) {
          throw new Error('Insufficient locked balance');
        }

        return await tx.wallet.update({
          where: { userId },
          data: {
            balance: wallet.balance + amount,
            lockedBalance: wallet.lockedBalance - amount
          }
        });
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to unlock funds: ${error.message}`);
    }
  }

  async transferLockedFunds(fromUserId: string, toUserId: string, amount: bigint): Promise<{
    fromWallet: Wallet;
    toWallet: Wallet;
  }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const fromWallet = await tx.wallet.findUnique({
          where: { userId: fromUserId }
        });

        const toWallet = await tx.wallet.findUnique({
          where: { userId: toUserId }
        });

        if (!fromWallet || !toWallet) {
          throw new Error('One or both wallets not found');
        }

        if (fromWallet.lockedBalance < amount) {
          throw new Error('Insufficient locked balance');
        }

        const updatedFromWallet = await tx.wallet.update({
          where: { userId: fromUserId },
          data: {
            lockedBalance: fromWallet.lockedBalance - amount
          }
        });

        const updatedToWallet = await tx.wallet.update({
          where: { userId: toUserId },
          data: {
            balance: toWallet.balance + amount
          }
        });

        return {
          fromWallet: updatedFromWallet,
          toWallet: updatedToWallet
        };
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to transfer locked funds: ${error.message}`);
    }
  }

  async addFunds(userId: string, amount: bigint): Promise<Wallet> {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        throw new DatabaseError('Wallet not found');
      }

      return await this.prisma.wallet.update({
        where: { userId },
        data: {
          balance: wallet.balance + amount
        }
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to add funds: ${error.message}`);
    }
  }

  async deductFunds(userId: string, amount: bigint): Promise<Wallet> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId }
        });

        if (!wallet) {
          throw new Error('Wallet not found');
        }

        if (wallet.balance < amount) {
          throw new Error('Insufficient balance');
        }

        return await tx.wallet.update({
          where: { userId },
          data: {
            balance: wallet.balance - amount
          }
        });
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to deduct funds: ${error.message}`);
    }
  }
}