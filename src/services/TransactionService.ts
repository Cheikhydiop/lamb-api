import { Service } from 'typedi';
import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';
import { CreateTransactionDTOType, WithdrawalDTOType, ConfirmTransactionDTOType, ListTransactionsDTOType } from '../dto/transaction.dto';

@Service()
export class TransactionService {
  constructor(private prisma: PrismaClient) { }

  async createTransaction(userId: string, data: CreateTransactionDTOType) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      throw new Error('User or wallet not found');
    }

    if (data.type === 'WITHDRAWAL' && user.wallet.balance < data.amount) {
      throw new Error('Insufficient balance');
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        userId,
        provider: data.provider as any, // Cast to any or MobileMoneyProvider to resolve mismatch
        notes: data.notes,
      },
    });

    // Update wallet based on transaction type
    if (data.type === 'DEPOSIT') {
      await this.prisma.wallet.update({
        where: { userId },
        data: { balance: { increment: data.amount } },
      });
    } else if (data.type === 'WITHDRAWAL') {
      await this.prisma.wallet.update({
        where: { userId },
        data: { balance: { decrement: data.amount } },
      });
    }

    return transaction;
  }

  async deposit(userId: string, data: { amount: bigint; provider: string; phoneNumber: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      throw new Error('User or wallet not found');
    }

    // Validate amount limits
    const minDeposit = BigInt(500);
    const maxDeposit = BigInt(1000000);

    if (data.amount < minDeposit) {
      throw new Error(`Montant minimum de dépôt: ${minDeposit} FCFA`);
    }

    if (data.amount > maxDeposit) {
      throw new Error(`Montant maximum de dépôt: ${maxDeposit} FCFA`);
    }

    // Create transaction in PENDING state
    const transaction = await this.prisma.transaction.create({
      data: {
        type: 'DEPOSIT',
        amount: data.amount,
        userId,
        provider: data.provider as any,
        status: 'PENDING',
        notes: `Deposit from ${data.phoneNumber}`,
      },
    });

    try {
      // Initiate payment with provider
      const { PaymentService } = await import('./PaymentService');
      const paymentService = new PaymentService();

      const result = await paymentService.initiateDeposit(
        data.provider as 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY',
        data.amount,
        data.phoneNumber,
        userId
      );

      if (!result.success) {
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            notes: `Failed: ${result.message}`,
            processedAt: new Date()
          },
        });

        throw new Error(result.message || 'Deposit initiation failed');
      }

      // Update transaction with external reference
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          externalRef: result.transactionId,
        },
      });

      return {
        ...transaction,
        externalRef: result.transactionId,
        message: result.message,
        requiresUserAction: result.requiresUserAction
      };

    } catch (error: any) {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          notes: `Error: ${error.message}`,
          processedAt: new Date()
        },
      });

      throw error;
    }
  }

  async withdrawal(userId: string, data: WithdrawalDTOType) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      throw new Error('User or wallet not found');
    }

    if (user.wallet.balance < data.amount) {
      throw new Error('Insufficient balance');
    }

    // Validate amount limits
    const minWithdrawal = BigInt(500); // TODO: Move to config
    const maxWithdrawal = BigInt(500000);

    if (data.amount < minWithdrawal) {
      throw new Error(`Montant minimum de retrait: ${minWithdrawal} FCFA`);
    }

    if (data.amount > maxWithdrawal) {
      throw new Error(`Montant maximum de retrait: ${maxWithdrawal} FCFA`);
    }

    // Create transaction in PENDING state
    const transaction = await this.prisma.transaction.create({
      data: {
        type: 'WITHDRAWAL',
        amount: data.amount,
        userId,
        provider: data.provider as any,
        status: 'PENDING',
        notes: `Withdrawal to ${data.phoneNumber}`,
      },
    });

    try {
      // Debit wallet immediately (will be refunded if payment fails)
      await this.prisma.wallet.update({
        where: { userId },
        data: { balance: { decrement: data.amount } },
      });

      // Initiate payment with provider
      const { PaymentService } = await import('./PaymentService');
      const paymentService = new PaymentService();

      const result = await paymentService.initiateWithdrawal(
        data.provider as 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY',
        data.amount,
        data.phoneNumber,
        userId
      );

      if (!result.success) {
        // Rollback wallet debit
        await this.prisma.wallet.update({
          where: { userId },
          data: { balance: { increment: data.amount } },
        });

        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            notes: `Failed: ${result.message}`,
            processedAt: new Date()
          },
        });

        throw new Error(result.message || 'Withdrawal initiation failed');
      }

      // Update transaction with external reference
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          externalRef: result.transactionId,
        },
      });

      return {
        ...transaction,
        externalRef: result.transactionId,
        message: result.message
      };

    } catch (error: any) {
      // Ensure rollback on any error
      await this.prisma.wallet.update({
        where: { userId },
        data: { balance: { increment: data.amount } },
      });

      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          notes: `Error: ${error.message}`,
          processedAt: new Date()
        },
      });

      throw error;
    }
  }

  async confirmTransaction(data: ConfirmTransactionDTOType) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: data.transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const status = data.status === 'CONFIRMED' ? 'CONFIRMED' : 'FAILED';

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id: data.transactionId },
      data: {
        status: status as TransactionStatus,
        externalRef: data.externalRef,
        processedAt: new Date(),
      },
    });

    // Reverse wallet update if failed
    if (status === 'FAILED') {
      if (transaction.type === 'WITHDRAWAL') {
        await this.prisma.wallet.update({
          where: { userId: transaction.userId },
          data: { balance: { increment: transaction.amount } },
        });
      } else if (transaction.type === 'DEPOSIT') {
        await this.prisma.wallet.update({
          where: { userId: transaction.userId },
          data: { balance: { decrement: transaction.amount } },
        });
      }
    }

    return updatedTransaction;
  }

  async listTransactions(userId: string, data: ListTransactionsDTOType) {
    return await this.prisma.transaction.findMany({
      where: {
        userId,
        status: data.status,
        type: data.type as TransactionType,
      },
      take: data.limit,
      skip: data.offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTransactionById(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        winnings: true,
        commissions: true,
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  }

  async getWalletBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return wallet;
  }
}
