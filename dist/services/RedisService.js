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
exports.RedisService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const typedi_1 = require("typedi");
const env_1 = __importDefault(require("../config/env"));
const Logger_1 = __importDefault(require("../utils/Logger"));
let RedisService = (() => {
    let _classDecorators = [(0, typedi_1.Service)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RedisService = _classThis = class {
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
    __setFunctionName(_classThis, "RedisService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RedisService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RedisService = _classThis;
})();
exports.RedisService = RedisService;
