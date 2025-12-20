// src/controllers/BetController.ts
import { Request, Response } from 'express';
import { BetService } from '../services/BetService';
import { asyncHandler } from '../middlewares/asyncHandler';
import { BetStatus, FighterChoice } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { WebSocketService } from '../services/WebSocketService';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const webSocketService = new WebSocketService();
const betService = new BetService(prisma, webSocketService);

class BetController {
  /**
   * POST /api/bets
   * Créer un nouveau pari
   */
  static createBet = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Non authentifié' 
      });
      return;
    }

    const { fightId, amount, chosenFighter } = req.body;

    if (!fightId || !amount || !chosenFighter) {
      res.status(400).json({ 
        success: false, 
        message: 'Données invalides: fightId, amount et chosenFighter sont requis' 
      });
      return;
    }

    if (!['A', 'B'].includes(chosenFighter)) {
      res.status(400).json({ 
        success: false, 
        message: 'chosenFighter doit être "A" ou "B"' 
      });
      return;
    }

    const betData = {
      fightId,
      amount: Number(amount),
      chosenFighter: chosenFighter as FighterChoice
    };

    const bet = await betService.createBet(userId, betData);

    res.status(201).json({
      success: true,
      message: 'Pari créé avec succès',
      data: bet
    });
  });

  /**
   * POST /api/bets/:betId/accept
   * Accepter un pari
   */
  static acceptBet = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { betId } = req.params;

    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Non authentifié' 
      });
      return;
    }

    if (!betId) {
      res.status(400).json({ 
        success: false, 
        message: 'ID du pari requis' 
      });
      return;
    }

    const bet = await betService.acceptBet(userId, betId);

    res.status(200).json({
      success: true,
      message: 'Pari accepté avec succès',
      data: bet
    });
  });

  /**
   * DELETE /api/bets/:betId
   * Annuler un pari
   */
  static cancelBet = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { betId } = req.params;
    const isAdmin = (req as any).user?.role === 'ADMIN';

    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Non authentifié' 
      });
      return;
    }

    if (!betId) {
      res.status(400).json({ 
        success: false, 
        message: 'ID du pari requis' 
      });
      return;
    }

    const bet = await betService.cancelBet(betId, userId, isAdmin);

    res.status(200).json({
      success: true,
      message: 'Pari annulé avec succès',
      data: bet
    });
  });

  /**
   * GET /api/bets/:betId
   * Obtenir les détails d'un pari
   */
  static getBet = asyncHandler(async (req: Request, res: Response) => {
    const { betId } = req.params;

    if (!betId) {
      res.status(400).json({ 
        success: false, 
        message: 'ID du pari requis' 
      });
      return;
    }

    const bet = await betService.getBet(betId);

    res.status(200).json({
      success: true,
      data: bet
    });
  });

  /**
   * GET /api/bets
   * Liste des paris avec filtres
   */
  static listBets = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const fightId = req.query.fightId as string | undefined;
    const dayEventId = req.query.dayEventId as string | undefined;
    const status = req.query.status as BetStatus | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await betService.listBets({
      userId,
      fightId,
      dayEventId,
      status,
      limit,
      offset
    });

    res.status(200).json({
      success: true,
      data: result.bets,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.offset + result.limit < result.total
      }
    });
  });
  static getPendingBets = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const fightId = req.query.fightId as string | undefined;
    const dayEventId = req.query.dayEventId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  
    const result = await betService.getPendingBets({
      userId,
      fightId,
      dayEventId,
      limit,
      offset
    });
  
    res.status(200).json({
      success: true,
      data: result.bets,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.offset + result.limit < result.total
      }
    });
  });
  /**
   * GET /api/bets/available/:fightId
   * Obtenir les paris disponibles pour un combat
   */
  static getAvailableBets = asyncHandler(async (req: Request, res: Response) => {
    const { fightId } = req.params;

    if (!fightId) {
      res.status(400).json({ 
        success: false, 
        message: 'ID du combat requis' 
      });
      return;
    }

    const bets = await betService.getAvailableBets(fightId);

    res.status(200).json({
      success: true,
      data: bets
    });
  });

  /**
   * GET /api/bets/my-bets
   * Obtenir mes paris (créés et acceptés)
   */
  static getMyBets = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Non authentifié' 
      });
      return;
    }

    const bets = await betService.getUserBets(userId);

    res.status(200).json({
      success: true,
      data: bets
    });
  });

  /**
   * GET /api/bets/active
   * Obtenir les paris actifs d'un utilisateur
   */
  static getActiveBets = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Non authentifié' 
      });
      return;
    }

    const bets = await betService.getActiveBetsForUser(userId);

    res.status(200).json({
      success: true,
      data: bets
    });
  });

  /**
   * GET /api/bets/stats
   * Obtenir les statistiques de paris d'un utilisateur
   */
  static getBetStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Non authentifié' 
      });
      return;
    }

    const stats = await betService.getBetStats(userId);

    res.status(200).json({
      success: true,
      data: stats
    });
  });

  /**
   * POST /api/bets/:betId/settle
   * Régler un pari (admin seulement)
   */
  static settleBet = asyncHandler(async (req: Request, res: Response) => {
    const isAdmin = (req as any).user?.role === 'ADMIN';
    const { betId } = req.params;
    const { winner } = req.body;

    if (!isAdmin) {
      res.status(403).json({ 
        success: false, 
        message: 'Accès interdit: administrateur requis' 
      });
      return;
    }

    if (!betId || !winner) {
      res.status(400).json({ 
        success: false, 
        message: 'betId et winner sont requis' 
      });
      return;
    }

    if (!['A', 'B', 'DRAW'].includes(winner)) {
      res.status(400).json({ 
        success: false, 
        message: 'winner doit être "A", "B" ou "DRAW"' 
      });
      return;
    }

    const bet = await betService.settleBet(betId, winner as 'A' | 'B' | 'DRAW');

    res.status(200).json({
      success: true,
      message: 'Pari réglé avec succès',
      data: bet
    });
  });

  /**
   * POST /api/bets/expire-check
   * Vérifier et expirer les paris (tâche cron/admin)
   */
  static checkExpiredBets = asyncHandler(async (req: Request, res: Response) => {
    const isAdmin = (req as any).user?.role === 'ADMIN';

    if (!isAdmin) {
      res.status(403).json({ 
        success: false, 
        message: 'Accès interdit: administrateur requis' 
      });
      return;
    }

    const expiredPending = await betService.expirePendingBetsBeforeFight();

    res.status(200).json({
      success: true,
      message: 'Vérification des paris expirés effectuée',
      data: {
        expiredPendingBets: expiredPending
      }
    });
  });
}

export default BetController;