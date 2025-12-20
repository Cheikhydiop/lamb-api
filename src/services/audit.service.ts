import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

@Service()
export class AuditService {
  constructor(private prisma: PrismaClient) { }

  async logAction(
    action: string,
    table: string,
    recordId: string | null,
    oldData: any = null,
    newData: any = null,
    userId: string | null = null,
    ipAddress: string | null = null,
    userAgent: string | null = null
  ) {
    try {
      const auditLog = await this.prisma.auditLog.create({
        data: {
          action,
          table,
          recordId,
          oldData,
          newData,
          userId,
          ipAddress,
          userAgent,
        },
      });
      logger.info(`Audit log created: ${action} on ${table}#${recordId}`);
      return auditLog;
    } catch (error) {
      logger.error('Error creating audit log', error);
      throw error;
    }
  }

  async getAuditLogs(
    table?: string,
    action?: string,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      const logs = await this.prisma.auditLog.findMany({
        where: {
          table: table ? { equals: table } : undefined,
          action: action ? { contains: action } : undefined,
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      return logs;
    } catch (error) {
      logger.error('Error fetching audit logs', error);
      throw error;
    }
  }

  async getAuditLogsByUser(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const logs = await this.prisma.auditLog.findMany({
        where: { userId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      });
      return logs;
    } catch (error) {
      logger.error('Error fetching audit logs for user', error);
      throw error;
    }
  }

  async getAuditLogsForRecord(table: string, recordId: string) {
    try {
      const logs = await this.prisma.auditLog.findMany({
        where: { table, recordId },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      return logs;
    } catch (error) {
      logger.error('Error fetching audit logs for record', error);
      throw error;
    }
  }

  async logBetCreated(betId: string, userId: string, data: any, ipAddress?: string, userAgent?: string) {
    return this.logAction('BET_CREATED', 'bets', betId, null, data, userId, ipAddress, userAgent);
  }

  async logBetAccepted(betId: string, acceptorId: string, data: any, ipAddress?: string, userAgent?: string) {
    return this.logAction('BET_ACCEPTED', 'bets', betId, null, data, acceptorId, ipAddress, userAgent);
  }

  async logBetCancelled(betId: string, userId: string, data: any, ipAddress?: string, userAgent?: string) {
    return this.logAction('BET_CANCELLED', 'bets', betId, null, data, userId, ipAddress, userAgent);
  }

  async logTransactionCreated(transactionId: string, userId: string, data: any, ipAddress?: string, userAgent?: string) {
    return this.logAction('TRANSACTION_CREATED', 'transactions', transactionId, null, data, userId, ipAddress, userAgent);
  }

  async logTransactionConfirmed(transactionId: string, adminId: string, data: any, ipAddress?: string, userAgent?: string) {
    return this.logAction('TRANSACTION_CONFIRMED', 'transactions', transactionId, null, data, adminId, ipAddress, userAgent);
  }

  async logFightCreated(fightId: string, adminId: string, data: any, ipAddress?: string, userAgent?: string) {
    return this.logAction('FIGHT_CREATED', 'fights', fightId, null, data, adminId, ipAddress, userAgent);
  }

  async logFightResultValidated(resultId: string, adminId: string, data: any, ipAddress?: string, userAgent?: string) {
    return this.logAction('FIGHT_RESULT_VALIDATED', 'fight_results', resultId, null, data, adminId, ipAddress, userAgent);
  }
}
