import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import logger from '../utils/logger';
import { FighterService } from '../services/FighterService';
import { PrismaClient } from '@prisma/client';

// Instanciation manuelle comme dans AuthController
const prisma = new PrismaClient();
const fighterService = new FighterService(prisma);

class FighterController {
  /**
   * GET /api/fighters
   * Récupération de la liste des lutteurs
   */
  static listFighters = asyncHandler(async (req: Request, res: Response) => {
    try {
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        stable: req.query.stable as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        orderBy: (req.query.orderBy as any) || 'name',
        orderDirection: (req.query.orderDirection as any) || 'asc'
      };

      const result = await fighterService.listFighters(filters);

      res.status(200).json({
        success: true,
        data: result.fighters,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.offset + result.limit < result.total
        }
      });
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des lutteurs:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération des lutteurs'
      });
    }
  });

  /**
   * GET /api/fighters/:fighterId
   * Récupération d'un lutteur par son ID
   */
  static getFighterById = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { fighterId } = req.params;

      if (!fighterId) {
        res.status(400).json({
          success: false,
          message: 'ID du lutteur requis'
        });
        return;
      }

      const fighter = await fighterService.getFighter(fighterId);

      res.status(200).json({
        success: true,
        data: fighter
      });
    } catch (error: any) {
      logger.error('Erreur lors de la récupération du lutteur:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Lutteur non trouvé'
      });
    }
  });

  /**
   * POST /api/fighters
   * Création d'un nouveau lutteur
   */
  static createFighter = asyncHandler(async (req: Request, res: Response) => {
    try {
      const fighter = await fighterService.createFighter(req.body);

      res.status(201).json({
        success: true,
        message: 'Lutteur créé avec succès',
        data: fighter
      });
    } catch (error: any) {
      logger.error('Erreur lors de la création du lutteur:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la création du lutteur'
      });
    }
  });

  /**
   * PATCH /api/fighters/:fighterId
   * Mise à jour d'un lutteur
   */
  static updateFighter = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { fighterId } = req.params;
      const fighter = await fighterService.updateFighter(fighterId, req.body);

      res.status(200).json({
        success: true,
        message: 'Lutteur mis à jour avec succès',
        data: fighter
      });
    } catch (error: any) {
      logger.error('Erreur lors de la mise à jour du lutteur:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du lutteur'
      });
    }
  });

  /**
   * DELETE /api/fighters/:fighterId
   * Suppression d'un lutteur
   */
  static deleteFighter = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { fighterId } = req.params;
      await fighterService.deleteFighter(fighterId);

      res.status(200).json({
        success: true,
        message: 'Lutteur supprimé avec succès'
      });
    } catch (error: any) {
      logger.error('Erreur lors de la suppression du lutteur:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la suppression du lutteur'
      });
    }
  });

  /**
   * GET /api/fighters/search
   * Recherche de lutteurs
   */
  // Dans FighterController.ts
  static async searchFighters(req: Request, res: Response) {
    try {
      // Vérifier si le paramètre 'query' est présent
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Paramètre de recherche requis"
        });
      }
      
      const limit = req.query.limit 
        ? parseInt(req.query.limit as string) 
        : 20;
      
      const fighters = await fighterService.searchFighters(query, limit);
      
      return res.status(200).json({
        success: true,
        data: fighters
      });
    } catch (error: any) {
      logger.error('Erreur dans searchFighters:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }

  /**
   * GET /api/fighters/top
   * Récupération des meilleurs lutteurs
   */
  static getTopFighters = asyncHandler(async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const fighters = await fighterService.getTopFighters(limit);

      res.status(200).json({
        success: true,
        data: fighters
      });
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des top lutteurs:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur serveur'
      });
    }
  });

  /**
   * GET /api/fighters/:fighterId/stats
   * Récupération des statistiques d'un lutteur
   */
  static getFighterStats = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { fighterId } = req.params;
      const stats = await fighterService.getFighterStats(fighterId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des stats:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Stats non trouvées'
      });
    }
  });
}

export default FighterController;