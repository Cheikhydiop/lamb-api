import { Service } from 'typedi';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from '../utils/Logger';
import jwt from 'jsonwebtoken';
import config from '../config/env';

// Types de messages WebSocket (Events Socket.io)
export enum WebSocketEvent {
  CONNECTION_STATUS = 'connection_status',
  AUTH_ERROR = 'auth_error',
  FIGHT_STATUS_UPDATE = 'fight_status_update',
  FIGHT_RESULT = 'fight_result',
  FIGHT_STARTED = 'fight_started',
  FIGHT_FINISHED = 'fight_finished',
  FIGHT_CANCELLED = 'fight_cancelled',
  BET_CREATED = 'bet_created',
  BET_ACCEPTED = 'bet_accepted',
  BET_CANCELLED = 'bet_cancelled',
  BET_WON = 'bet_won',
  BET_LOST = 'bet_lost',
  TRANSACTION_CONFIRMED = 'transaction_confirmed',
  TRANSACTION_FAILED = 'transaction_failed',
  WALLET_UPDATE = 'wallet_update',
  NOTIFICATION = 'notification',
  SYSTEM_ALERT = 'system_alert',
  SUBSCRIBE_FIGHT = 'subscribe_fight',
  UNSUBSCRIBE_FIGHT = 'unsubscribe_fight',
  SUBSCRIBE_BETS = 'subscribe_bets',
  UNSUBSCRIBE_BETS = 'unsubscribe_bets',
  PING = 'ping',
  PONG = 'pong'
}

export interface FightUpdatePayload {
  fightId: string;
  status: 'SCHEDULED' | 'ONGOING' | 'FINISHED' | 'CANCELLED';
  data?: any;
  timestamp: string;
}

export interface BetUpdatePayload {
  betId: string;
  fightId: string;
  userId: string;
  amount: number;
  chosenFighter: 'A' | 'B';
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'WON' | 'LOST';
  timestamp: string;
}

export interface TransactionUpdatePayload {
  transactionId: string;
  userId: string;
  type: string;
  amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  timestamp: string;
}

export interface WalletUpdatePayload {
  userId: string;
  balance: number;
  lockedBalance: number;
  timestamp: string;
}

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

@Service()
export class WebSocketService {
  private static instance: WebSocketService | null = null;
  private io: SocketIOServer | null = null;
  private initialized = false;

  constructor() {
    if (WebSocketService.instance) {
      return WebSocketService.instance;
    }
    WebSocketService.instance = this;
  }

  public initialize(server: HttpServer): void {
    if (this.initialized) {
      logger.info('Socket.io server already initialized');
      return;
    }

    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/ws'
    });

    // Authentication Middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.query.token as string;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      try {
        const decoded = jwt.verify(token, config.jwt.secret) as any;
        socket.data.userId = decoded.userId;
        socket.data.role = decoded.role;
        next();
      } catch (err) {
        next(new Error('Invalid or expired token'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    this.initialized = true;
    logger.info('Socket.io server initialized on path /ws');
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public destroy(): void {
    if (this.io) {
      this.io.close();
      this.io = null;
    }
    this.initialized = false;
    WebSocketService.instance = null;
    logger.info('WebSocket service destroyed');
  }

  private handleConnection(socket: Socket): void {
    const userId = socket.data.userId;
    logger.info(`[Socket.io] User ${userId} connected (${socket.id})`);

    // Join user-specific room for private notifications/updates
    socket.join(`user:${userId}`);

    socket.on(WebSocketEvent.SUBSCRIBE_FIGHT, (payload: { fightId: string }) => {
      if (payload.fightId) {
        socket.join(`fight:${payload.fightId}`);
        logger.info(`[Socket.io] User ${userId} joined room fight:${payload.fightId}`);
        socket.emit('subscription_confirmed', { type: 'fight', fightId: payload.fightId });
      }
    });

    socket.on(WebSocketEvent.UNSUBSCRIBE_FIGHT, (payload: { fightId: string }) => {
      if (payload.fightId) {
        socket.leave(`fight:${payload.fightId}`);
        logger.info(`[Socket.io] User ${userId} left room fight:${payload.fightId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`[Socket.io] User ${userId} disconnected: ${reason}`);
    });

    // Welcome message
    socket.emit(WebSocketEvent.CONNECTION_STATUS, {
      status: 'connected',
      userId,
      serverTime: new Date().toISOString()
    });
  }

  // ================ MÉTHODES DE BROADCAST ================

  public broadcastFightUpdate(fightId: string, update: FightUpdatePayload): void {
    if (!this.io) return;
    this.io.to(`fight:${fightId}`).emit(WebSocketEvent.FIGHT_STATUS_UPDATE, update);
    logger.info(`[Socket.io] Broadcast fight update to room fight:${fightId}`);
  }

  public broadcastBetUpdate(betUpdate: BetUpdatePayload): void {
    if (!this.io) return;
    this.io.to(`user:${betUpdate.userId}`).emit(this.getBetEvent(betUpdate.status), betUpdate);
  }

  private getBetEvent(status: string): WebSocketEvent {
    switch (status) {
      case 'PENDING': return WebSocketEvent.BET_CREATED;
      case 'ACCEPTED': return WebSocketEvent.BET_ACCEPTED;
      case 'CANCELLED': return WebSocketEvent.BET_CANCELLED;
      case 'WON': return WebSocketEvent.BET_WON;
      case 'LOST': return WebSocketEvent.BET_LOST;
      default: return WebSocketEvent.BET_CREATED;
    }
  }

  public broadcastTransactionUpdate(transactionUpdate: TransactionUpdatePayload): void {
    if (!this.io) return;
    const event = transactionUpdate.status === 'CONFIRMED'
      ? WebSocketEvent.TRANSACTION_CONFIRMED
      : WebSocketEvent.TRANSACTION_FAILED;
    this.io.to(`user:${transactionUpdate.userId}`).emit(event, transactionUpdate);
  }

  public broadcastWalletUpdate(walletUpdate: WalletUpdatePayload): void {
    if (!this.io) return;
    this.io.to(`user:${walletUpdate.userId}`).emit(WebSocketEvent.WALLET_UPDATE, walletUpdate);
  }

  public broadcastNotification(notification: NotificationPayload, userId: string): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(WebSocketEvent.NOTIFICATION, notification);
  }

  public broadcastSystemAlert(alert: any): void {
    if (!this.io) return;
    this.io.emit(WebSocketEvent.SYSTEM_ALERT, { ...alert, timestamp: new Date().toISOString() });
  }

  public getConnectionStats(): any {
    if (!this.io) return { totalConnections: 0 };
    return {
      totalConnections: this.io.sockets.sockets.size,
    };
  }
}