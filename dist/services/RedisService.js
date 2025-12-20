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
exports.RedisService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const typedi_1 = require("typedi");
const env_1 = __importDefault(require("../config/env"));
const Logger_1 = __importDefault(require("../utils/Logger"));
let RedisService = class RedisService {
    constructor() {
        this.isConnected = false;
        this.client = new ioredis_1.default({
            host: env_1.default.redis.host,
            port: env_1.default.redis.port,
            password: env_1.default.redis.password,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });
        this.client.on('connect', () => {
            this.isConnected = true;
            Logger_1.default.info('Redis connected successfully');
        });
        this.client.on('error', (error) => {
            this.isConnected = false;
            Logger_1.default.error('Redis connection error:', error);
        });
    }
    getClient() {
        return this.client;
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.client.get(key);
            }
            catch (error) {
                Logger_1.default.error(`Redis post GET error for key ${key}:`, error);
                return null;
            }
        });
    }
    set(key, value, ttlSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (ttlSeconds) {
                    yield this.client.set(key, value, 'EX', ttlSeconds);
                }
                else {
                    yield this.client.set(key, value);
                }
            }
            catch (error) {
                Logger_1.default.error(`Redis set error for key ${key}:`, error);
            }
        });
    }
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.del(key);
            }
            catch (error) {
                Logger_1.default.error(`Redis delete error for key ${key}:`, error);
            }
        });
    }
    exists(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.client.exists(key);
                return result === 1;
            }
            catch (error) {
                Logger_1.default.error(`Redis exists check error for key ${key}:`, error);
                return false;
            }
        });
    }
    isReady() {
        return this.isConnected;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [])
], RedisService);
