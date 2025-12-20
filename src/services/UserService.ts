// src/services/UserService.ts
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { generateToken } from '../utils/tokenUtils';
import { 
  ValidationError, 
  DatabaseError, 
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ConflictError 
} from '../errors/customErrors';
import { Register, Login } from '../interfaces/UserInterface';
import UserValidator from '../utils/validators/userValidator';
import { UserRepository } from '../repositories/UserRepository'; // Vérifiez ce chemin
import { WalletRepository } from '../repositories/WalletRepository';
import { EmailVerificationService } from './EmailVerificationService';
import { SessionRepository, DeviceType, SessionStatus } from '../repositories/SessionRepository';
import logger from '../utils/Logger';
import { Request } from 'express';
import { RateLimitUtils } from '../utils/RateLimitInfo';

export class UserService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOGIN_WINDOW_MS = 15 * 60 * 1000;

  constructor(
    private userRepository: UserRepository,
    private walletRepository: WalletRepository,
    private emailVerificationService: EmailVerificationService,
    private sessionRepository: SessionRepository
  ) {
    // Log pour vérifier l'instanciation
    console.log('UserService constructor called');
    console.log('UserRepository methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(userRepository)));
  }

  async login(loginData: Login, req?: Request): Promise<{
    user: any;
    token: string;
    refreshToken: string;
    sessionId: string;
    deviceInfo: any;
    message: string;
  }> {
    try {
      console.log('Login attempt for:', loginData.email);
      
      // Validation des données d'entrée
      const validatedData = UserValidator.validateLogin(loginData);
      console.log('Data validated, searching user...');
      
      // DEBUG: Vérifier si la méthode existe
      console.log('Checking findByEmailWithWallet method...');
      console.log('Method exists:', typeof this.userRepository.findByEmailWithWallet);
      
      // Recherche de l'utilisateur
      const user = await this.userRepository.findByEmailWithWallet(validatedData.email);
      console.log('User found:', !!user);
      
      if (!user) {
        console.log('User not found:', validatedData.email);
        throw new AuthenticationError(
          'Identifiants invalides',
          {
            email: validatedData.email,
            reason: 'USER_NOT_FOUND',
            ipAddress: req?.ip,
            timestamp: new Date().toISOString()
          }
        );
      }

      console.log('User found, checking account status...');
      
      // Vérification du statut du compte
      if (!user.isActive) {
        throw new AuthenticationError(
          'Compte désactivé',
          {
            userId: user.id,
            email: user.email,
            reason: 'ACCOUNT_INACTIVE',
            suggestion: 'Contactez le support pour réactiver votre compte'
          }
        );
      }

      if (!user.isEmailVerified) {
        throw new AuthenticationError(
          'Email non vérifié',
          {
            userId: user.id,
            email: user.email,
            reason: 'EMAIL_NOT_VERIFIED',
            suggestion: 'Vérifiez votre boîte mail ou demandez un nouveau lien de vérification'
          }
        );
      }

      // Vérification du mot de passe
      const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
      
      if (!isPasswordValid) {
        throw new AuthenticationError(
          'Mot de passe incorrect',
          {
            userId: user.id,
            email: user.email,
            reason: 'INVALID_PASSWORD',
            suggestion: 'Réinitialisez votre mot de passe si vous l\'avez oublié'
          }
        );
      }

      // Mise à jour de la dernière connexion
      await this.userRepository.updateLastLogin(user.id, new Date());

      // Génération des tokens
      const token = generateToken({ 
        userId: user.id, 
        role: user.role,
        email: user.email 
      });

      const refreshToken = crypto.randomBytes(40).toString('hex');
      const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Extraction des infos de l'appareil
      let deviceInfo = {
        deviceType: DeviceType.UNKNOWN,
        ipAddress: undefined,
        userAgent: undefined
      };

      if (req) {
        const extractedInfo = this.sessionRepository.extractDeviceInfoFromRequest(req);
        deviceInfo = {
          deviceType: extractedInfo.deviceType || DeviceType.UNKNOWN,
          ipAddress: extractedInfo.ipAddress,
          userAgent: extractedInfo.userAgent
        };
      }

      // Création de la session
      const session = await this.sessionRepository.createSession({
        userId: user.id,
        refreshToken,
        deviceType: deviceInfo.deviceType,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        expiresAt: sessionExpiry
      });

      // Application des limites de sessions
      await this.sessionRepository.enforceSessionLimits(user.id);

      // Nettoyage de la réponse
      const { password, ...userWithoutPassword } = user;

      logger.info(`✅ Connexion réussie: ${user.email} (${user.id})`, {
        userId: user.id,
        ip: deviceInfo.ipAddress,
        deviceType: deviceInfo.deviceType
      });

      return { 
        user: userWithoutPassword, 
        token,
        refreshToken,
        sessionId: session.id,
        deviceInfo,
        message: 'Connexion réussie'
      };

    } catch (error: any) {
      console.error('❌ Login error details:', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        userEmail: loginData.email
      });
      
      logger.error('❌ Échec de la connexion', {
        email: loginData.email,
        errorCode: error.code,
        errorMessage: error.message,
        ip: req?.ip,
        userAgent: req?.headers['user-agent']
      });

      // Propagation des erreurs spécifiques
      if (error instanceof AuthenticationError || 
          error instanceof ValidationError || 
          error instanceof RateLimitError) {
        throw error;
      }
      
      // Erreur générique avec plus de détails
      throw new DatabaseError(
        'Une erreur est survenue lors de la connexion',
        'LOGIN_OPERATION',
        'USER',
        req?.headers['x-request-id'] as string
      );
    }
  }
}