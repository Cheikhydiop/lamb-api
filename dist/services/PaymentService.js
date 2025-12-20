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
exports.PaymentService = exports.FreeMoneyPaymentProvider = exports.OrangeMoneyPaymentProvider = exports.WavePaymentProvider = void 0;
const typedi_1 = require("typedi");
const axios_1 = __importDefault(require("axios"));
const env_1 = __importDefault(require("../config/env"));
const logger_1 = __importDefault(require("../utils/logger"));
// ==================== MOCK STORE (TEST MODE) ====================
const mockTransactionStore = new Map();
// ==================== WAVE PAYMENT PROVIDER ====================
let WavePaymentProvider = class WavePaymentProvider {
    constructor() {
        this.isTestMode = env_1.default.payment.mode === 'TEST';
        this.httpClient = axios_1.default.create({
            baseURL: env_1.default.payment.wave.apiUrl,
            headers: {
                'Authorization': `Bearer ${env_1.default.payment.wave.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
    }
    initiateDeposit(amount, phoneNumber, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (this.isTestMode) {
                return this.mockInitiateDeposit(amount, phoneNumber);
            }
            try {
                // PRODUCTION: Appel API Wave réelle
                const response = yield this.httpClient.post('/checkout/sessions', {
                    amount: Number(amount),
                    currency: 'XOF',
                    customer_phone_number: phoneNumber,
                    merchant_reference: `DEP-${userId}-${Date.now()}`,
                    success_url: `${env_1.default.app.apiUrl}/api/v1/webhooks/wave/success`,
                    error_url: `${env_1.default.app.apiUrl}/api/v1/webhooks/wave/error`,
                    webhook_url: `${env_1.default.app.apiUrl}/api/v1/webhooks/wave`
                });
                logger_1.default.info(`Wave deposit initiated: ${response.data.id}`);
                return {
                    success: true,
                    transactionId: response.data.id,
                    externalRef: response.data.wave_launch_url,
                    requiresUserAction: true,
                    message: 'Veuillez confirmer le paiement sur votre téléphone'
                };
            }
            catch (error) {
                logger_1.default.error('Wave deposit initiation failed:', error);
                return {
                    success: false,
                    transactionId: '',
                    message: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Erreur lors de l\'initiation du paiement'
                };
            }
        });
    }
    initiateWithdrawal(amount, phoneNumber, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (this.isTestMode) {
                return this.mockInitiateWithdrawal(amount, phoneNumber);
            }
            try {
                // PRODUCTION: Appel API Wave pour transfert sortant
                const response = yield this.httpClient.post('/transfers', {
                    amount: Number(amount),
                    currency: 'XOF',
                    recipient_phone_number: phoneNumber,
                    merchant_reference: `WDR-${userId}-${Date.now()}`,
                    webhook_url: `${env_1.default.app.apiUrl}/api/v1/webhooks/wave`
                });
                logger_1.default.info(`Wave withdrawal initiated: ${response.data.id}`);
                return {
                    success: true,
                    transactionId: response.data.id,
                    externalRef: response.data.id,
                    message: 'Retrait en cours de traitement'
                };
            }
            catch (error) {
                logger_1.default.error('Wave withdrawal initiation failed:', error);
                return {
                    success: false,
                    transactionId: '',
                    message: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Erreur lors du retrait'
                };
            }
        });
    }
    verifyPayment(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isTestMode) {
                return this.mockVerifyPayment(transactionId);
            }
            try {
                const response = yield this.httpClient.get(`/checkout/sessions/${transactionId}`);
                const statusMap = {
                    'pending': 'PENDING',
                    'completed': 'COMPLETED',
                    'failed': 'FAILED',
                    'cancelled': 'FAILED'
                };
                return {
                    success: true,
                    status: statusMap[response.data.status] || 'PENDING',
                    amount: BigInt(response.data.amount),
                    externalRef: response.data.id
                };
            }
            catch (error) {
                logger_1.default.error(`Wave payment verification failed for ${transactionId}:`, error);
                return {
                    success: false,
                    status: 'FAILED'
                };
            }
        });
    }
    refund(transactionId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isTestMode) {
                return this.mockRefund(transactionId);
            }
            try {
                yield this.httpClient.post(`/checkout/sessions/${transactionId}/refund`, {
                    amount: Number(amount)
                });
                logger_1.default.info(`Wave refund successful: ${transactionId}`);
                return true;
            }
            catch (error) {
                logger_1.default.error(`Wave refund failed for ${transactionId}:`, error);
                return false;
            }
        });
    }
    // ==================== TEST MODE METHODS ====================
    mockInitiateDeposit(amount, phoneNumber) {
        const transactionId = `WAVE-DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        mockTransactionStore.set(transactionId, {
            status: 'PENDING',
            amount,
            phoneNumber,
            provider: 'WAVE',
            type: 'DEPOSIT',
            createdAt: new Date()
        });
        // Simulate async confirmation
        setTimeout(() => {
            const tx = mockTransactionStore.get(transactionId);
            if (tx && Math.random() > 0.1) {
                tx.status = 'COMPLETED';
                logger_1.default.info(`[TEST] Wave deposit ${transactionId} COMPLETED`);
            }
            else if (tx) {
                tx.status = 'FAILED';
                logger_1.default.info(`[TEST] Wave deposit ${transactionId} FAILED`);
            }
        }, 2000 + Math.random() * 3000);
        return {
            success: true,
            transactionId,
            requiresUserAction: true,
            message: '[TEST MODE] Paiement simulé - sera confirmé automatiquement'
        };
    }
    mockInitiateWithdrawal(amount, phoneNumber) {
        const transactionId = `WAVE-WDR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        mockTransactionStore.set(transactionId, {
            status: 'PENDING',
            amount,
            phoneNumber,
            provider: 'WAVE',
            type: 'WITHDRAWAL',
            createdAt: new Date()
        });
        setTimeout(() => {
            const tx = mockTransactionStore.get(transactionId);
            if (tx && Math.random() > 0.05) {
                tx.status = 'COMPLETED';
                logger_1.default.info(`[TEST] Wave withdrawal ${transactionId} COMPLETED`);
            }
            else if (tx) {
                tx.status = 'FAILED';
                logger_1.default.info(`[TEST] Wave withdrawal ${transactionId} FAILED`);
            }
        }, 1500 + Math.random() * 2500);
        return {
            success: true,
            transactionId,
            message: '[TEST MODE] Retrait simulé'
        };
    }
    mockVerifyPayment(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise(resolve => setTimeout(resolve, 500));
            const tx = mockTransactionStore.get(transactionId);
            if (!tx) {
                return { success: false, status: 'FAILED' };
            }
            return {
                success: true,
                status: tx.status,
                amount: tx.amount,
                externalRef: transactionId
            };
        });
    }
    mockRefund(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise(resolve => setTimeout(resolve, 1000));
            const tx = mockTransactionStore.get(transactionId);
            if (tx && tx.status === 'COMPLETED') {
                tx.status = 'REFUNDED';
                logger_1.default.info(`[TEST] Wave refund successful: ${transactionId}`);
                return true;
            }
            return false;
        });
    }
};
exports.WavePaymentProvider = WavePaymentProvider;
exports.WavePaymentProvider = WavePaymentProvider = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [])
], WavePaymentProvider);
// ==================== ORANGE MONEY PAYMENT PROVIDER ====================
let OrangeMoneyPaymentProvider = class OrangeMoneyPaymentProvider {
    constructor() {
        this.isTestMode = env_1.default.payment.mode === 'TEST';
        this.httpClient = axios_1.default.create({
            baseURL: env_1.default.payment.orangeMoney.apiUrl,
            headers: {
                'Authorization': `Bearer ${env_1.default.payment.orangeMoney.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
    }
    initiateDeposit(amount, phoneNumber, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isTestMode) {
                return this.mockInitiateDeposit(amount, phoneNumber);
            }
            try {
                const response = yield this.httpClient.post('/webpayment', {
                    merchant_key: env_1.default.payment.orangeMoney.merchantId,
                    currency: 'OUV',
                    order_id: `DEP-${userId}-${Date.now()}`,
                    amount: Number(amount),
                    return_url: `${env_1.default.app.apiUrl}/api/v1/webhooks/orange-money/return`,
                    cancel_url: `${env_1.default.app.apiUrl}/api/v1/webhooks/orange-money/cancel`,
                    notif_url: `${env_1.default.app.apiUrl}/api/v1/webhooks/orange-money`,
                    lang: 'fr',
                    reference: phoneNumber
                });
                return {
                    success: true,
                    transactionId: response.data.payment_token,
                    externalRef: response.data.payment_url,
                    requiresUserAction: true,
                    message: 'Veuillez confirmer le paiement'
                };
            }
            catch (error) {
                logger_1.default.error('Orange Money deposit failed:', error);
                return {
                    success: false,
                    transactionId: '',
                    message: 'Erreur Orange Money'
                };
            }
        });
    }
    initiateWithdrawal(amount, phoneNumber, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isTestMode) {
                return this.mockInitiateWithdrawal(amount, phoneNumber);
            }
            try {
                const response = yield this.httpClient.post('/cashin', {
                    merchant_key: env_1.default.payment.orangeMoney.merchantId,
                    currency: 'OUV',
                    order_id: `WDR-${userId}-${Date.now()}`,
                    amount: Number(amount),
                    subscriber_msisdn: phoneNumber,
                    notif_url: `${env_1.default.app.apiUrl}/api/v1/webhooks/orange-money`
                });
                return {
                    success: true,
                    transactionId: response.data.txnid,
                    message: 'Retrait en cours'
                };
            }
            catch (error) {
                logger_1.default.error('Orange Money withdrawal failed:', error);
                return {
                    success: false,
                    transactionId: '',
                    message: 'Erreur de retrait'
                };
            }
        });
    }
    verifyPayment(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isTestMode) {
                return this.mockVerifyPayment(transactionId);
            }
            try {
                const response = yield this.httpClient.post('/transactionstatus', {
                    merchant_key: env_1.default.payment.orangeMoney.merchantId,
                    payment_token: transactionId
                });
                const statusMap = {
                    'SUCCESS': 'COMPLETED',
                    'PENDING': 'PENDING',
                    'FAILED': 'FAILED',
                    'EXPIRED': 'FAILED'
                };
                return {
                    success: true,
                    status: statusMap[response.data.status] || 'PENDING',
                    amount: BigInt(response.data.amount)
                };
            }
            catch (error) {
                logger_1.default.error('Orange Money verification failed:', error);
                return { success: false, status: 'FAILED' };
            }
        });
    }
    refund(transactionId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isTestMode) {
                return this.mockRefund(transactionId);
            }
            logger_1.default.warn('Orange Money refunds not yet implemented');
            return false;
        });
    }
    // Mock methods (same pattern as Wave)
    mockInitiateDeposit(amount, phoneNumber) {
        const transactionId = `OM-DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        mockTransactionStore.set(transactionId, {
            status: 'PENDING',
            amount,
            phoneNumber,
            provider: 'ORANGE_MONEY',
            type: 'DEPOSIT',
            createdAt: new Date()
        });
        setTimeout(() => {
            const tx = mockTransactionStore.get(transactionId);
            if (tx && Math.random() > 0.1) {
                tx.status = 'COMPLETED';
            }
            else if (tx) {
                tx.status = 'FAILED';
            }
        }, 1500);
        return {
            success: true,
            transactionId,
            requiresUserAction: true,
            message: '[TEST] Orange Money simulé'
        };
    }
    mockInitiateWithdrawal(amount, phoneNumber) {
        const transactionId = `OM-WDR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        mockTransactionStore.set(transactionId, {
            status: 'PENDING',
            amount,
            phoneNumber,
            provider: 'ORANGE_MONEY',
            type: 'WITHDRAWAL',
            createdAt: new Date()
        });
        setTimeout(() => {
            const tx = mockTransactionStore.get(transactionId);
            if (tx && Math.random() > 0.05)
                tx.status = 'COMPLETED';
            else if (tx)
                tx.status = 'FAILED';
        }, 1200);
        return { success: true, transactionId, message: '[TEST] Retrait OM simulé' };
    }
    mockVerifyPayment(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise(resolve => setTimeout(resolve, 300));
            const tx = mockTransactionStore.get(transactionId);
            if (!tx)
                return { success: false, status: 'FAILED' };
            return { success: true, status: tx.status, amount: tx.amount };
        });
    }
    mockRefund(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = mockTransactionStore.get(transactionId);
            if (tx && tx.status === 'COMPLETED') {
                tx.status = 'REFUNDED';
                return true;
            }
            return false;
        });
    }
};
exports.OrangeMoneyPaymentProvider = OrangeMoneyPaymentProvider;
exports.OrangeMoneyPaymentProvider = OrangeMoneyPaymentProvider = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [])
], OrangeMoneyPaymentProvider);
// ==================== FREE MONEY PAYMENT PROVIDER ====================
let FreeMoneyPaymentProvider = class FreeMoneyPaymentProvider {
    constructor() {
        this.isTestMode = env_1.default.payment.mode === 'TEST';
        this.httpClient = axios_1.default.create({
            baseURL: env_1.default.payment.freeMoney.apiUrl,
            headers: {
                'X-API-Key': env_1.default.payment.freeMoney.apiKey,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
    }
    initiateDeposit(amount, phoneNumber, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isTestMode) {
                return this.mockInitiateDeposit(amount, phoneNumber);
            }
            // TODO: Implement real Free Money API when available
            logger_1.default.warn('Free Money API not yet implemented - using TEST mode');
            return this.mockInitiateDeposit(amount, phoneNumber);
        });
    }
    initiateWithdrawal(amount, phoneNumber, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isTestMode) {
                return this.mockInitiateWithdrawal(amount, phoneNumber);
            }
            logger_1.default.warn('Free Money API not yet implemented - using TEST mode');
            return this.mockInitiateWithdrawal(amount, phoneNumber);
        });
    }
    verifyPayment(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isTestMode) {
                return this.mockVerifyPayment(transactionId);
            }
            return this.mockVerifyPayment(transactionId);
        });
    }
    refund(transactionId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isTestMode) {
                return this.mockRefund(transactionId);
            }
            return this.mockRefund(transactionId);
        });
    }
    // Mock methods
    mockInitiateDeposit(amount, phoneNumber) {
        const transactionId = `FREE-DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        mockTransactionStore.set(transactionId, {
            status: 'PENDING',
            amount,
            phoneNumber,
            provider: 'FREE_MONEY',
            type: 'DEPOSIT',
            createdAt: new Date()
        });
        setTimeout(() => {
            const tx = mockTransactionStore.get(transactionId);
            if (tx && Math.random() > 0.1)
                tx.status = 'COMPLETED';
            else if (tx)
                tx.status = 'FAILED';
        }, 1800);
        return { success: true, transactionId, requiresUserAction: true, message: '[TEST] Free Money simulé' };
    }
    mockInitiateWithdrawal(amount, phoneNumber) {
        const transactionId = `FREE-WDR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        mockTransactionStore.set(transactionId, {
            status: 'PENDING',
            amount,
            phoneNumber,
            provider: 'FREE_MONEY',
            type: 'WITHDRAWAL',
            createdAt: new Date()
        });
        setTimeout(() => {
            const tx = mockTransactionStore.get(transactionId);
            if (tx && Math.random() > 0.05)
                tx.status = 'COMPLETED';
            else if (tx)
                tx.status = 'FAILED';
        }, 1400);
        return { success: true, transactionId, message: '[TEST] Retrait Free Money simulé' };
    }
    mockVerifyPayment(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise(resolve => setTimeout(resolve, 400));
            const tx = mockTransactionStore.get(transactionId);
            if (!tx)
                return { success: false, status: 'FAILED' };
            return { success: true, status: tx.status, amount: tx.amount };
        });
    }
    mockRefund(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = mockTransactionStore.get(transactionId);
            if (tx && tx.status === 'COMPLETED') {
                tx.status = 'REFUNDED';
                return true;
            }
            return false;
        });
    }
};
exports.FreeMoneyPaymentProvider = FreeMoneyPaymentProvider;
exports.FreeMoneyPaymentProvider = FreeMoneyPaymentProvider = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [])
], FreeMoneyPaymentProvider);
// ==================== PAYMENT SERVICE (FACTORY) ====================
let PaymentService = class PaymentService {
    constructor() {
        this.waveProvider = new WavePaymentProvider();
        this.orangeMoneyProvider = new OrangeMoneyPaymentProvider();
        this.freeMoneyProvider = new FreeMoneyPaymentProvider();
        logger_1.default.info(`Payment Service initialized in ${env_1.default.payment.mode} mode`);
    }
    getProvider(provider) {
        switch (provider) {
            case 'WAVE':
                return this.waveProvider;
            case 'ORANGE_MONEY':
                return this.orangeMoneyProvider;
            case 'FREE_MONEY':
                return this.freeMoneyProvider;
            default:
                throw new Error(`Unknown payment provider: ${provider}`);
        }
    }
    initiateDeposit(provider, amount, phoneNumber, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const paymentProvider = this.getProvider(provider);
            return paymentProvider.initiateDeposit(amount, phoneNumber, userId);
        });
    }
    initiateWithdrawal(provider, amount, phoneNumber, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const paymentProvider = this.getProvider(provider);
            return paymentProvider.initiateWithdrawal(amount, phoneNumber, userId);
        });
    }
    verifyPayment(provider, transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const paymentProvider = this.getProvider(provider);
            return paymentProvider.verifyPayment(transactionId);
        });
    }
    refund(provider, transactionId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const paymentProvider = this.getProvider(provider);
            return paymentProvider.refund(transactionId, amount);
        });
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [])
], PaymentService);
