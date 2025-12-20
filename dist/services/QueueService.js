"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const bullmq_1 = require("bullmq");
const typedi_1 = require("typedi");
const Logger_1 = __importDefault(require("../utils/Logger"));
let QueueService = (() => {
    let _classDecorators = [(0, typedi_1.Service)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var QueueService = _classThis = class {
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
    __setFunctionName(_classThis, "QueueService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        QueueService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return QueueService = _classThis;
})();
exports.QueueService = QueueService;
