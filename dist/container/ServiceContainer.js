"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeServices = exports.ServiceContainer = void 0;
const typedi_1 = require("typedi");
const Logger_1 = require("../utils/Logger");
const UserService_1 = require("../services/UserService");
const UserRepository_1 = require("../repositories/UserRepository");
class ServiceContainer {
    constructor() {
        this.initialized = false;
    }
    static getInstance() {
        if (!ServiceContainer.instance) {
            ServiceContainer.instance = new ServiceContainer();
        }
        return ServiceContainer.instance;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initialized) {
                Logger_1.AppLogger.info('Service container already initialized');
                return;
            }
            Logger_1.AppLogger.info('Initializing service container...');
            try {
                this.initializeRepositories();
                this.initializeServices();
                this.initialized = true;
                Logger_1.AppLogger.info('Service container initialized successfully');
            }
            catch (error) {
                throw error;
            }
        });
    }
    initializeRepositories() {
        const userRepository = new UserRepository_1.UserRepository();
        typedi_1.Container.set('userRepository', userRepository);
        Logger_1.AppLogger.info('UserRepository initialized');
    }
    initializeServices() {
        // User service
        const userService = new UserService_1.UserService(typedi_1.Container.get('userRepository'));
        typedi_1.Container.set(UserService_1.UserService, userService);
        Logger_1.AppLogger.info('UserService and EmailService initialized');
    }
    getContainer() {
        if (!this.initialized) {
            throw new Error('Service container not initialized');
        }
        return typedi_1.Container;
    }
}
exports.ServiceContainer = ServiceContainer;
const initializeServices = () => __awaiter(void 0, void 0, void 0, function* () {
    const container = ServiceContainer.getInstance();
    yield container.initialize();
    return container.getContainer();
});
exports.initializeServices = initializeServices;
