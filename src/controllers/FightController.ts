// src/controllers/FightController.ts
import { Request, Response, NextFunction } from 'express';
import { FightService } from '../services/FightService';
import { BetService } from '../services/BetService';
import { WebSocketService } from '../services/WebSocketService';
import { PrismaClient } from '@prisma/client';
import {
  CreateFightDTO,
  UpdateFightStatusDTO,
  ValidateFightResultDTO,
  ListFightsDTO,
  CreateDayEventDTO,
  ListDayEventsDTO,
  UpdateDayEventDTO
} from '../dto/fight.dto';
import { FightStatus, Winner } from '@prisma/client';
import logger from '../utils/logger';

// Créer les instances des dépendances
const prisma = new PrismaClient();
const webSocketService = new WebSocketService();
const betService = new BetService(prisma, webSocketService);

// Créer une instance du service avec les dépendances
const fightService = new FightService(prisma, betService, webSocketService);

// Déclaration globale pour req.user
// (Global declaration removed to avoid conflict with express.d.ts)

class FightController {
  // ========== COMBATS INDIVIDUELS ==========

  async createFight(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Non authentifié'
        });
        return;
      }

      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Accès réservé aux administrateurs'
        });
        return;
      }

      const fightData: CreateFightDTO = {
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        scheduledAt: req.body.scheduledAt,
        fighterAId: req.body.fighterAId,
        fighterBId: req.body.fighterBId,
        oddsA: req.body.oddsA,
        oddsB: req.body.oddsB,
        dayEventId: req.body.dayEventId
      };

      // Validation basique
      if (!fightData.title || !fightData.scheduledAt || !fightData.fighterAId || !fightData.fighterBId) {
        res.status(400).json({
          success: false,
          message: 'Champs requis manquants: title, scheduledAt, fighterAId, fighterBId'
        });
        return;
      }

      const fight = await fightService.createFight(fightData);

      res.status(201).json({
        success: true,
        message: 'Combat créé avec succès',
        data: fight
      });
    } catch (error: any) {
      logger.error('Erreur lors de la création du combat:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la création du combat'
      });
    }
  }

  async getFight(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fightId } = req.params;

      if (!fightId) {
        res.status(400).json({
          success: false,
          message: 'ID du combat requis'
        });
        return;
      }

      const fight = await fightService.getFight(fightId);

      res.status(200).json({
        success: true,
        data: fight
      });
    } catch (error: any) {
      logger.error('Erreur lors de la récupération du combat:', error);
      if (error.message === 'Combat non trouvé') {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Erreur serveur'
        });
      }
    }
  }

  async listFights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: ListFightsDTO = {
        status: req.query.status as string,
        fighterId: req.query.fighterId as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined
      };

      const result = await fightService.listFights(filters);

      res.status(200).json({
        success: true,
        data: result.fights,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.offset + result.limit < result.total
        }
      });
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des combats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur serveur'
      });
    }
  }

  async updateFightStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { fightId } = req.params;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Non authentifié'
        });
        return;
      }

      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Accès réservé aux administrateurs'
        });
        return;
      }

      if (!fightId) {
        res.status(400).json({
          success: false,
          message: 'ID du combat requis'
        });
        return;
      }

      const statusData: UpdateFightStatusDTO = {
        status: req.body.status
      };

      if (!Object.values(FightStatus).includes(statusData.status as any)) {
        res.status(400).json({
          success: false,
          message: `Statut invalide. Valeurs acceptées: ${Object.values(FightStatus).join(', ')}`
        });
        return;
      }

      const fight = await fightService.updateFightStatus(fightId, statusData);

      res.status(200).json({
        success: true,
        message: 'Statut du combat mis à jour avec succès',
        data: fight
      });
    } catch (error: any) {
      logger.error('Erreur lors de la mise à jour du statut du combat:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur serveur'
      });
    }
  }

  async requestFightValidationOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { fightId } = req.params;

      if (!adminId) {
        res.status(401).json({ success: false, message: 'Non authentifié' });
        return;
      }

      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
        return;
      }

      const result = await fightService.requestFightValidationOTP(adminId, fightId);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Erreur requestFightValidationOTP:', error);
      res.status(500).json({ success: false, message: error.message || 'Erreur serveur' });
    }
  }

  async validateFightResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { fightId } = req.params;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Non authentifié'
        });
        return;
      }

      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Accès réservé aux administrateurs'
        });
        return;
      }

      if (!fightId) {
        res.status(400).json({
          success: false,
          message: 'ID du combat requis'
        });
        return;
      }

      const resultData: ValidateFightResultDTO = {
        fightId,
        winner: req.body.winner,
        victoryMethod: req.body.victoryMethod,
        round: req.body.round,
        duration: req.body.duration,
        notes: req.body.notes,
        password: req.body.password,
        otpCode: req.body.otpCode
      };

      if (!Object.values(Winner).includes(resultData.winner as any)) {
        res.status(400).json({
          success: false,
          message: `Vainqueur invalide. Valeurs acceptées: ${Object.values(Winner).join(', ')}`
        });
        return;
      }

      const result = await fightService.validateFightResult(adminId, resultData);

      res.status(200).json({
        success: true,
        message: 'Résultat du combat validé avec succès',
        data: result
      });
    } catch (error: any) {
      logger.error('Erreur lors de la validation du résultat du combat:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur serveur'
      });
    }
  }

  async getUpcomingFights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const fights = await fightService.getUpcomingFights(limit);

      res.status(200).json({
        success: true,
        data: fights
      });
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des prochains combats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur serveur'
      });
    }
  }

  async getPopularFights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const fights = await fightService.getPopularFights(limit);

      res.status(200).json({
        success: true,
        data: fights
      });
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des combats populaires:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur serveur'
      });
    }
  }

  // ========== JOURNÉES DE LUTTE ==========

  async createDayEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Non authentifié'
        });
        return;
      }

      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Accès réservé aux administrateurs'
        });
        return;
      }

      const dayEventData: CreateDayEventDTO = {
        title: req.body.title,
        date: req.body.date,
        location: req.body.location,
        description: req.body.description,
        bannerImage: req.body.bannerImage,
        isFeatured: req.body.isFeatured,
        fights: req.body.fights
      };

      // Validation basique
      if (!dayEventData.title || !dayEventData.date || !dayEventData.location) {
        res.status(400).json({
          success: false,
          message: 'Champs requis manquants: title, date, location'
        });
        return;
      }

      if (dayEventData.fights && dayEventData.fights.length !== 5) {
        res.status(400).json({
          success: false,
          message: 'Une journée doit avoir exactement 5 combats si spécifiés'
        });
        return;
      }

      const dayEvent = await fightService.createDayEvent(dayEventData);

      res.status(201).json({
        success: true,
        message: 'Journée de lutte créée avec succès',
        data: dayEvent
      });
    } catch (error: any) {
      logger.error('Erreur lors de la création de la journée:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur serveur'
      });
    }
  }

  async getDayEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;

      if (!eventId) {
        res.status(400).json({
          success: false,
          message: 'ID de la journée requis'
        });
        return;
      }

      const dayEvent = await fightService.getDayEvent(eventId);

      res.status(200).json({
        success: true,
        data: dayEvent
      });
    } catch (error: any) {
      logger.error('Erreur lors de la récupération de la journée:', error);
      if (error.message === 'Journée non trouvée') {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Erreur serveur'
        });
      }
    }
  }

  async listDayEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: ListDayEventsDTO = {
        status: req.query.status as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined
      };

      const result = await fightService.listDayEvents(filters);

      res.status(200).json({
        success: true,
        data: result.events,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.offset + result.limit < result.total
        }
      });
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des journées:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur serveur'
      });
    }
  }

  async getUpcomingDayEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const events = await fightService.getUpcomingDayEvents(limit);

      res.status(200).json({
        success: true,
        data: events
      });
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des journées à venir:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur serveur'
      });
    }
  }

  async getCurrentDayEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dayEvent = await fightService.getCurrentDayEvent();

      if (!dayEvent) {
        res.status(200).json({
          success: true,
          data: null,
          message: 'Aucune journée en cours'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: dayEvent
      });
    } catch (error: any) {
      logger.error('Erreur lors de la récupération de la journée actuelle:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur serveur'
      });
    }
  }

  async updateDayEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { eventId } = req.params;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Non authentifié'
        });
        return;
      }

      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Accès réservé aux administrateurs'
        });
        return;
      }

      if (!eventId) {
        res.status(400).json({
          success: false,
          message: 'ID de la journée requis'
        });
        return;
      }

      const eventData: UpdateDayEventDTO = {
        title: req.body.title,
        date: req.body.date,
        location: req.body.location,
        description: req.body.description,
        bannerImage: req.body.bannerImage,
        isFeatured: req.body.isFeatured,
        status: req.body.status
      };

      const updatedEvent = await fightService.updateDayEvent(eventId, eventData);

      res.status(200).json({
        success: true,
        message: 'Journée mise à jour avec succès',
        data: updatedEvent
      });
    } catch (error: any) {
      logger.error('Erreur lors de la mise à jour de la journée:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur serveur'
      });
    }
  }

  async deleteDayEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id;
      const { eventId } = req.params;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Non authentifié'
        });
        return;
      }

      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Accès réservé aux administrateurs'
        });
        return;
      }

      if (!eventId) {
        res.status(400).json({
          success: false,
          message: 'ID de la journée requis'
        });
        return;
      }

      const result = await fightService.deleteDayEvent(eventId);

      res.status(200).json({
        success: true,
        message: 'Journée supprimée avec succès',
        data: result
      });
    } catch (error: any) {
      logger.error('Erreur lors de la suppression de la journée:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur serveur'
      });
    }
  }

  async expirePastFights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Non authentifié'
        });
        return;
      }

      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Accès réservé aux administrateurs'
        });
        return;
      }

      const expiredCount = await fightService.expirePastFights();

      res.status(200).json({
        success: true,
        message: `Expiration des combats terminée`,
        data: {
          expiredCount
        }
      });
    } catch (error: any) {
      logger.error('Erreur lors de l\'expiration des combats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur serveur'
      });
    }
  }
}

// Exportez une instance de la classe
export default new FightController();