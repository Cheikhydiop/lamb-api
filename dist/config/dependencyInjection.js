"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDependencyInjection = setupDependencyInjection;
require("reflect-metadata");
const typedi_1 = require("typedi");
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
function setupDependencyInjection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.default.info('🔄 Setting up dependency injection...');
            // Vérifier si Prisma est déjà enregistré
            if (!typedi_1.Container.has(client_1.PrismaClient)) {
                const prisma = new client_1.PrismaClient({
                    log: process.env.NODE_ENV === 'development'
                        ? ['query', 'info', 'warn', 'error']
                        : ['error'],
                });
                typedi_1.Container.set(client_1.PrismaClient, prisma);
                logger_1.default.info('✅ PrismaClient registered');
            }
            // Enregistrer dynamiquement les services
            yield registerServices();
            logger_1.default.info('✅ Dependency injection setup complete');
        }
        catch (error) {
            logger_1.default.error('❌ Failed to setup dependency injection:', error);
            throw error;
        }
    });
}
function registerServices() {
    return __awaiter(this, void 0, void 0, function* () {
        const serviceImports = [
            Promise.resolve().then(() => __importStar(require('../services/FighterService'))),
            Promise.resolve().then(() => __importStar(require('../services/BetService'))),
            Promise.resolve().then(() => __importStar(require('../services/FightService'))),
            // Ajoutez d'autres services ici
        ];
        for (const serviceImport of serviceImports) {
            try {
                const module = yield serviceImport;
                const ServiceClass = Object.values(module)[0];
                if (ServiceClass && typeof ServiceClass === 'function') {
                    const prisma = typedi_1.Container.get(client_1.PrismaClient);
                    const serviceInstance = new ServiceClass(prisma);
                    typedi_1.Container.set(ServiceClass, serviceInstance);
                    logger_1.default.debug(`✅ Registered: ${ServiceClass.name}`);
                }
            }
            catch (error) {
                logger_1.default.warn(`⚠️ Could not register service:`, error);
            }
        }
    });
}
