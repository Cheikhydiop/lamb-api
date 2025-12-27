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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaveService = void 0;
exports.getWaveService = getWaveService;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
// ============================================================================
// WAVE SERVICE
// ============================================================================
class WaveService {
    constructor() {
        // Configuration depuis .env
        this.apiKey = process.env.WAVE_API_KEY || '';
        this.baseUrl = process.env.WAVE_API_URL || 'https://api.wave.com';
        this.successUrl = process.env.WAVE_SUCCESS_URL || '';
        this.errorUrl = process.env.WAVE_ERROR_URL || '';
        if (!this.apiKey) {
            throw new Error('❌ WAVE_API_KEY is required');
        }
        // Client HTTP avec authentification
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 secondes
        });
        // Intercepteurs pour debugging
        this.setupInterceptors();
    }
    /**
     * Setup interceptors pour logging
     */
    setupInterceptors() {
        if (process.env.NODE_ENV !== 'production') {
            this.client.interceptors.request.use((config) => {
                var _a;
                console.log('🌊 Wave Request:', {
                    method: (_a = config.method) === null || _a === void 0 ? void 0 : _a.toUpperCase(),
                    url: config.url,
                    headers: Object.assign(Object.assign({}, config.headers), { Authorization: 'Bearer ***hidden***' }),
                });
                return config;
            });
            this.client.interceptors.response.use((response) => {
                console.log('🌊 Wave Response:', {
                    status: response.status,
                    data: response.data,
                });
                return response;
            }, (error) => {
                var _a, _b;
                console.error('❌ Wave Error:', {
                    status: (_a = error.response) === null || _a === void 0 ? void 0 : _a.status,
                    data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
                });
                return Promise.reject(error);
            });
        }
    }
    // ============================================================================
    // CHECKOUT API - CASH-IN (DÉPÔTS)
    // ============================================================================
    /**
     * Créer une session Checkout pour dépôt
     * L'utilisateur sera redirigé vers Wave pour payer
     *
     * @param amount - Montant en FCFA (entier)
     * @param userId - ID de l'utilisateur
     * @param transactionId - ID de transaction dans votre DB
     */
    createCheckoutSession(amount, userId, transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.validateAmount(amount);
                const payload = {
                    amount: amount.toString(),
                    currency: 'XOF',
                    error_url: `${this.errorUrl}?ref=${transactionId}`,
                    success_url: `${this.successUrl}?ref=${transactionId}`,
                    client_reference: `DEPOSIT_${transactionId}_USER_${userId}`,
                };
                const response = yield this.client.post('/v1/checkout/sessions', payload);
                console.log(`✅ Checkout session created: ${response.data.id}`);
                return response.data;
            }
            catch (error) {
                this.handleError(error, 'createCheckoutSession');
                throw error;
            }
        });
    }
    /**
     * Récupérer une session Checkout
     */
    getCheckoutSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.get(`/v1/checkout/sessions/${sessionId}`);
                return response.data;
            }
            catch (error) {
                this.handleError(error, 'getCheckoutSession');
                throw error;
            }
        });
    }
    /**
     * Vérifier si un checkout est complété
     */
    isCheckoutComplete(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const session = yield this.getCheckoutSession(sessionId);
                return session.checkout_status === 'complete';
            }
            catch (error) {
                console.error('Error checking checkout status:', error);
                return false;
            }
        });
    }
    // ============================================================================
    // PAYMENT API - CASH-OUT (RETRAITS/PAYOUTS)
    // ============================================================================
    /**
     * Créer un payout (retrait)
     * Envoie de l'argent de votre wallet Wave Business vers un utilisateur
     *
     * Documentation: POST /v1/payout
     *
     * @param mobile - Numéro Wave du bénéficiaire (+221XXXXXXXXX)
     * @param amount - Montant net à recevoir (sans frais)
     * @param userId - ID utilisateur
     * @param transactionId - ID transaction
     * @param userName - Nom du bénéficiaire (optionnel, pour vérification)
     */
    createPayout(mobile, amount, userId, transactionId, userName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validation
                this.validateAmount(amount);
                this.validatePhoneNumber(mobile);
                // Générer clé d'idempotence (CRITIQUE pour éviter doubles paiements)
                const idempotencyKey = this.generateIdempotencyKey(transactionId);
                const payload = {
                    currency: 'XOF',
                    receive_amount: amount.toString(),
                    mobile: mobile,
                    client_reference: `WITHDRAWAL_${transactionId}_USER_${userId}`,
                    payment_reason: 'Retrait gains Lamb Ji',
                };
                // Ajouter nom si fourni (pour vérification automatique)
                if (userName) {
                    payload.name = userName;
                }
                const response = yield this.client.post('/v1/payout', payload, {
                    headers: {
                        'Idempotency-Key': idempotencyKey,
                    },
                });
                console.log(`✅ Payout created: ${response.data.id} - ${response.data.status}`);
                // Vérifier si le payout a immédiatement échoué
                if (response.data.status === 'failed' && response.data.payout_error) {
                    throw new Error(`Payout failed: ${response.data.payout_error.error_message}`);
                }
                return response.data;
            }
            catch (error) {
                this.handleError(error, 'createPayout');
                throw error;
            }
        });
    }
    /**
     * Récupérer un payout par ID
     *
     * Documentation: GET /v1/payout/:id
     */
    getPayout(payoutId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.get(`/v1/payout/${payoutId}`);
                return response.data;
            }
            catch (error) {
                this.handleError(error, 'getPayout');
                throw error;
            }
        });
    }
    /**
     * Rechercher des payouts par référence client
     *
     * Documentation: GET /v1/payouts/search
     */
    searchPayoutsByReference(clientReference) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.get(`/v1/payouts/search`, {
                    params: { client_reference: clientReference },
                });
                return response.data.result;
            }
            catch (error) {
                this.handleError(error, 'searchPayoutsByReference');
                throw error;
            }
        });
    }
    /**
     * Annuler un payout (dans les 3 jours)
     *
     * Documentation: POST /v1/payout/:id/reverse
     *
     * ⚠️ Idempotent - Peut être appelé plusieurs fois sans danger
     */
    reversePayout(payoutId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                yield this.client.post(`/v1/payout/${payoutId}/reverse`);
                console.log(`✅ Payout reversed: ${payoutId}`);
            }
            catch (error) {
                // Gérer les erreurs spécifiques d'annulation
                if ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error_code) {
                    const { error_code } = error.response.data;
                    switch (error_code) {
                        case 'payout-reversal-time-limit-exceeded':
                            throw new Error('Délai d\'annulation dépassé (max 3 jours)');
                        case 'insufficient-funds':
                            throw new Error('Le destinataire n\'a pas assez de solde');
                        case 'payout-reversal-account-terminated':
                            throw new Error('Le compte du destinataire est désactivé');
                        default:
                            throw new Error(`Erreur d'annulation: ${error_code}`);
                    }
                }
                this.handleError(error, 'reversePayout');
                throw error;
            }
        });
    }
    /**
     * Vérifier un destinataire avant d'envoyer de l'argent
     *
     * Documentation: POST /v1/verify_recipient
     *
     * Permet de vérifier:
     * - Si le numéro Wave existe
     * - Si le nom correspond
     * - Si le montant ne dépasse pas les limites
     */
    verifyRecipient(mobile, amount, name, nationalId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const idempotencyKey = crypto_1.default.randomBytes(16).toString('hex');
                const payload = {
                    mobile,
                    amount: amount.toString(),
                    currency: 'XOF',
                };
                if (name)
                    payload.name = name;
                if (nationalId)
                    payload.national_id = nationalId;
                const response = yield this.client.post('/v1/verify_recipient', payload, {
                    headers: {
                        'Idempotency-Key': idempotencyKey,
                    },
                });
                return response.data;
            }
            catch (error) {
                this.handleError(error, 'verifyRecipient');
                throw error;
            }
        });
    }
    // ============================================================================
    // BALANCE API
    // ============================================================================
    /**
     * Obtenir le solde du portefeuille Wave Business
     *
     * Documentation: GET /v1/balance
     */
    getBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.get('/v1/balance');
                console.log(`💰 Wave Balance: ${response.data.balance} ${response.data.currency}`);
                return response.data;
            }
            catch (error) {
                this.handleError(error, 'getBalance');
                throw error;
            }
        });
    }
    /**
     * Vérifier si le solde est suffisant pour un payout
     */
    hasSufficientBalance(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const balance = yield this.getBalance();
                const currentBalance = parseInt(balance.balance, 10);
                // Le montant + frais (~1%)
                const totalNeeded = amount + Math.ceil(amount * 0.01);
                return currentBalance >= totalNeeded;
            }
            catch (error) {
                console.error('Error checking balance:', error);
                return false;
            }
        });
    }
    // ============================================================================
    // UTILITAIRES
    // ============================================================================
    /**
     * Générer une clé d'idempotence unique basée sur la transaction
     * CRITIQUE: Empêche les doubles paiements
     */
    generateIdempotencyKey(transactionId) {
        // Utiliser un hash de l'ID de transaction pour garantir l'unicité
        return crypto_1.default
            .createHash('sha256')
            .update(`lamb-ji-${transactionId}`)
            .digest('hex')
            .substring(0, 32);
    }
    /**
     * Valider un montant
     */
    validateAmount(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            throw new Error('Le montant doit être un nombre valide');
        }
        if (amount <= 0) {
            throw new Error('Le montant doit être supérieur à 0');
        }
        if (!Number.isInteger(amount)) {
            throw new Error('Le montant doit être un entier (pas de décimales pour XOF)');
        }
        // Limites Wave
        const MIN_AMOUNT = 100; // 100 FCFA minimum
        const MAX_AMOUNT = 1500000; // 1.5M FCFA maximum (à ajuster selon vos besoins)
        if (amount < MIN_AMOUNT) {
            throw new Error(`Le montant minimum est ${MIN_AMOUNT} FCFA`);
        }
        if (amount > MAX_AMOUNT) {
            throw new Error(`Le montant maximum est ${MAX_AMOUNT.toLocaleString()} FCFA`);
        }
    }
    /**
     * Valider un numéro de téléphone Wave
     */
    validatePhoneNumber(phone) {
        if (!phone) {
            throw new Error('Numéro de téléphone requis');
        }
        // Format E.164: +221XXXXXXXXX
        const phoneRegex = /^\+221[0-9]{9}$/;
        if (!phoneRegex.test(phone)) {
            throw new Error('Format invalide. Attendu: +221XXXXXXXXX');
        }
    }
    /**
     * Gestion centralisée des erreurs Wave
     */
    handleError(error, context) {
        if (error.response) {
            const { status, data } = error.response;
            console.error(`🌊 Wave Error [${context}]:`, {
                status,
                error_code: (data === null || data === void 0 ? void 0 : data.error_code) || (data === null || data === void 0 ? void 0 : data.code),
                message: (data === null || data === void 0 ? void 0 : data.error_message) || (data === null || data === void 0 ? void 0 : data.message),
            });
            // Erreurs communes Wave
            const errorMap = {
                // Authentification
                'missing-auth-header': 'En-tête d\'authentification manquant',
                'invalid-auth': 'Authentification invalide',
                'api-key-not-provided': 'Clé API manquante',
                'no-matching-api-key': 'Clé API invalide',
                'api-key-revoked': 'Clé API révoquée',
                // Validation
                'request-validation-error': 'Requête invalide',
                'country-mismatch': 'Le destinataire doit être au Sénégal',
                'currency-mismatch': 'Devise incompatible',
                // Paiement
                'insufficient-funds': 'Solde Wave Business insuffisant',
                'recipient-limit-exceeded': 'Le destinataire a atteint sa limite mensuelle',
                'recipient-account-blocked': 'Compte Wave du destinataire bloqué',
                'recipient-account-inactive': 'Compte Wave du destinataire inactif',
                'recipient-minor': 'Le destinataire est mineur',
                // Idempotence
                'idempotency-mismatch': 'Clé d\'idempotence déjà utilisée avec des données différentes',
                // Système
                'internal-server-error': 'Erreur Wave temporaire',
                'service-unavailable': 'Service Wave indisponible',
                'too-many-requests': 'Trop de requêtes',
            };
            const errorCode = (data === null || data === void 0 ? void 0 : data.error_code) || (data === null || data === void 0 ? void 0 : data.code);
            const userMessage = errorMap[errorCode] || (data === null || data === void 0 ? void 0 : data.error_message) || (data === null || data === void 0 ? void 0 : data.message) || 'Erreur Wave inconnue';
            throw new Error(userMessage);
        }
        else if (error.request) {
            console.error(`🌊 Wave: Pas de réponse [${context}]`);
            throw new Error('Impossible de contacter Wave. Vérifiez votre connexion');
        }
        else {
            console.error(`🌊 Wave: Erreur configuration [${context}]`, error.message);
            throw error;
        }
    }
    /**
     * Health check
     */
    healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.getBalance();
                console.log('✅ Wave API healthy');
                return true;
            }
            catch (error) {
                console.error('❌ Wave API health check failed');
                return false;
            }
        });
    }
}
exports.WaveService = WaveService;
// ============================================================================
// EXPORT SINGLETON
// ============================================================================
let waveServiceInstance = null;
function getWaveService() {
    // Si mode mock activé, utiliser le mock
    if (process.env.WAVE_MOCK_MODE === 'true') {
        const { getWaveServiceMock } = require('./WaveServiceMock');
        console.log('🧪 Mode WAVE_MOCK_MODE activé - Utilisation du mock');
        return getWaveServiceMock();
    }
    // Sinon, utiliser le vrai service
    if (!waveServiceInstance) {
        waveServiceInstance = new WaveService();
    }
    return waveServiceInstance;
}
exports.default = WaveService;
