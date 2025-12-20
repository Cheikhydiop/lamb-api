import { Container } from 'typedi';
import { AppLogger } from '../utils/Logger';
import {UserService} from '../services/UserService';
import {UserRepository} from '../repositories/UserRepository';
import { EmailVerificationService } from '../services/EmailVerificationService';

export class ServiceContainer {
  private static instance: ServiceContainer;
  private initialized = false;

  private constructor() {}

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      AppLogger.info('Service container already initialized');
      return;
    }

    AppLogger.info('Initializing service container...');

    try {
      this.initializeRepositories();
      this.initializeServices();

      this.initialized = true;
      AppLogger.info('Service container initialized successfully');
    } catch (error) {
      throw error;
    }
  }

  private initializeRepositories(): void {
    const userRepository = new UserRepository();
    Container.set('userRepository', userRepository);
    AppLogger.info('UserRepository initialized');
  }

  private initializeServices(): void {
    
  

    // User service
    const userService = new UserService(
      Container.get('userRepository'),

    );
    Container.set(UserService, userService);

    AppLogger.info('UserService and EmailService initialized');
  }

  public getContainer(): typeof Container {
    if (!this.initialized) {
      throw new Error('Service container not initialized');
    }
    return Container;
  }
}

export const initializeServices = async (): Promise<typeof Container> => {
  const container = ServiceContainer.getInstance();
  await container.initialize();
  return container.getContainer();
};
