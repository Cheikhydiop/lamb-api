"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
exports.QueueService = void 0;
const bullmq_1 = require("bullmq");
const typedi_1 = require("typedi");
const RedisService_1 = require("./RedisService");
const Logger_1 = __importDefault(require("../utils/Logger"));
let QueueService = class QueueService {
    constructor(redisService) {
        this.redisService = redisService;
        const connection = this.redisService.getClient();
        // Initialisation de la file d'attente
        this.winningsQueue = new bullmq_1.Queue('winnings-distribution', { connection });
        // Initialisation du worker
        this.worker = new bullmq_1.Worker('winnings-distribution', (job) => __awaiter(this, void 0, void 0, function* () {
            yield this.processWinnings(job);
        }), { connection });
        this.worker.on('completed', (job) => {
            Logger_1.default.info(`Job ${job.id} completed successfully`);
        });
        this.worker.on('failed', (job, err) => {
            Logger_1.default.error(`Job ${job === null || job === void 0 ? void 0 : job.id} failed: ${err.message}`);
        });
        Logger_1.default.info('Queue system initialized');
    }
    /**
     * Ajoute un combat à la file d'attente pour la distribution des gains
     */
    addWinningsJob(fightId, winner) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.winningsQueue.add('distribute', { fightId, winner }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
            });
            Logger_1.default.info(`Added winnings distribution job for fight ${fightId}`);
        });
    }
    /**
     * Logique de traitement des gains (sera implémentée avec BetService)
     */
    processWinnings(job) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fightId, winner } = job.data;
            Logger_1.default.info(`Processing winnings for fight ${fightId}, winner: ${winner}`);
            // NOTE: Ici, nous injecterons normalement BetService pour appeler settleAllBetsForFight
            // Pour éviter les dépendances circulaires, nous pourrions avoir besoin d'une approche différente
            // ou d'utiliser Container.get(BetService) au moment du traitement.
            // Simulation du travail
            yield new Promise(resolve => setTimeout(resolve, 2000));
        });
    }
    getQueue() {
        return this.winningsQueue;
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = __decorate([
    (0, typedi_1.Service)(),
    __param(0, (0, typedi_1.Inject)()),
    __metadata("design:paramtypes", [RedisService_1.RedisService])
], QueueService);
