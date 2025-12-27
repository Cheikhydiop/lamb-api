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
exports.WaveServiceMock = void 0;
exports.getWaveServiceMock = getWaveServiceMock;
const crypto_1 = __importDefault(require("crypto"));
class WaveServiceMock {
    constructor() {
        // Simuler un "stockage" des sessions et payouts
        this.mockSessions = new Map();
        this.mockPayouts = new Map();
        this.mockBalance = 10000000; // 10M FCFA de solde fictif
        // Configuration de simulation
        this.config = {
            // Probabilité de succès (0-100)
            successRate: 95, // 95% de succès
            // Délai de traitement simulé (ms)
            processingDelay: 1000, // 1 seconde
            // Frais Wave simulés (1%)
            feePercentage: 1,
        };
        console.log('🧪 WAVE MOCK MODE ACTIVÉ - Utilisation du service simulé');
        console.log(`   → Taux de succès: ${this.config.successRate}%`);
        console.log(`   → Solde fictif: ${this.mockBalance.toLocaleString()} FCFA`);
    }
    // ============================================================================
    // CONFIGURATION DU MOCK
    // ============================================================================
    /**
     * Configurer le taux de succès des opérations
     */
    setSuccessRate(rate) {
        this.config.successRate = Math.max(0, Math.min(100, rate));
        console.log(`🎯 Success rate défini: ${this.config.successRate}%`);
    }
    /**
     * Configurer le solde Wave Business fictif
     */
    setMockBalance(amount) {
        this.mockBalance = amount;
        console.log(`💰 Solde mock défini: ${amount.toLocaleString()} FCFA`);
    }
    /**
     * Décider si l'opération doit réussir (basé sur successRate)
     */
    shouldSucceed() {
        return Math.random() * 100 < this.config.successRate;
    }
    // ============================================================================
    // CHECKOUT API - DÉPÔTS (MOCK)
    // ============================================================================
    /**
     * Créer une session checkout simulée
     */
    createCheckoutSession(amount, userId, transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`🧪 MOCK: Creating checkout session - ${amount} FCFA`);
            // Valider le montant
            this.validateAmount(amount);
            // Générer un ID de session
            const sessionId = `mock_checkout_${crypto_1.default.randomBytes(16).toString('hex')}`;
            // Créer la session
            const session = {
                id: sessionId,
                wave_launch_url: `http://localhost:5000/api/mock-wave/checkout/${sessionId}`,
                checkout_status: 'pending',
                amount: amount.toString(),
                currency: 'XOF',
                business_name: 'Lamb Ji Mock',
                client_reference: `DEPOSIT_${transactionId}_USER_${userId}`,
                when_created: new Date().toISOString(),
            };
            // Stocker la session
            this.mockSessions.set(sessionId, session);
            console.log(`✅ MOCK: Checkout session created: ${sessionId}`);
            // Simuler un délai
            yield this.delay(200);
            return session;
        });
    }
    /**
     * Récupérer une session checkout
     */
    getCheckoutSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = this.mockSessions.get(sessionId);
            if (!session) {
                throw new Error(`Session not found: ${sessionId}`);
            }
            return session;
        });
    }
    /**
     * Vérifier si un checkout est complété
     */
    isCheckoutComplete(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = this.mockSessions.get(sessionId);
            return (session === null || session === void 0 ? void 0 : session.checkout_status) === 'complete';
        });
    }
    /**
     * Simuler la complétion d'un checkout (pour les tests)
     * Cette méthode n'existe pas dans l'API réelle
     */
    completeCheckout(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = this.mockSessions.get(sessionId);
            if (!session) {
                throw new Error(`Session not found: ${sessionId}`);
            }
            console.log(`🧪 MOCK: Completing checkout ${sessionId}`);
            // Simuler un délai de traitement
            yield this.delay(this.config.processingDelay);
            // Décider du résultat
            const success = this.shouldSucceed();
            session.checkout_status = success ? 'complete' : 'failed';
            session.when_completed = new Date().toISOString();
            this.mockSessions.set(sessionId, session);
            console.log(`✅ MOCK: Checkout ${success ? 'succeeded' : 'failed'}`);
        });
    }
    // ============================================================================
    // PAYMENT API - RETRAITS (MOCK)
    // ============================================================================
    /**
     * Créer un payout simulé
     */
    createPayout(mobile, amount, userId, transactionId, userName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`🧪 MOCK: Creating payout - ${amount} FCFA to ${mobile}`);
            // Validation
            this.validateAmount(amount);
            this.validatePhoneNumber(mobile);
            // Calculer les frais
            const fee = Math.ceil(amount * (this.config.feePercentage / 100));
            // Vérifier le solde
            if (this.mockBalance < amount + fee) {
                const error = {
                    error_code: 'insufficient-funds',
                    error_message: 'Solde Wave Business insuffisant',
                };
                const payout = {
                    id: `mock_payout_failed_${Date.now()}`,
                    currency: 'XOF',
                    receive_amount: amount.toString(),
                    fee: fee.toString(),
                    mobile,
                    name: userName,
                    client_reference: `WITHDRAWAL_${transactionId}_USER_${userId}`,
                    payment_reason: 'Retrait gains Lamb Ji',
                    status: 'failed',
                    payout_error: error,
                    timestamp: new Date().toISOString(),
                };
                console.log(`❌ MOCK: Payout failed - Insufficient funds`);
                throw new Error(error.error_message);
            }
            // Générer un ID de payout
            const payoutId = `mock_payout_${crypto_1.default.randomBytes(16).toString('hex')}`;
            // Simuler un délai de traitement
            yield this.delay(this.config.processingDelay);
            // Décider du résultat
            const success = this.shouldSucceed();
            const payout = {
                id: payoutId,
                currency: 'XOF',
                receive_amount: amount.toString(),
                fee: fee.toString(),
                mobile,
                name: userName,
                client_reference: `WITHDRAWAL_${transactionId}_USER_${userId}`,
                payment_reason: 'Retrait gains Lamb Ji',
                status: success ? 'succeeded' : 'failed',
                timestamp: new Date().toISOString(),
            };
            // Si échec, ajouter une erreur
            if (!success) {
                payout.payout_error = {
                    error_code: 'recipient-account-inactive',
                    error_message: 'Le compte Wave du destinataire est inactif',
                };
            }
            else {
                // Débiter le solde mock
                this.mockBalance -= (amount + fee);
                console.log(`💰 MOCK: Balance after payout: ${this.mockBalance.toLocaleString()} FCFA`);
            }
            // Stocker le payout
            this.mockPayouts.set(payoutId, payout);
            console.log(`${success ? '✅' : '❌'} MOCK: Payout ${success ? 'succeeded' : 'failed'}: ${payoutId}`);
            // Si échec immédiat, throw
            if (!success) {
                throw new Error(payout.payout_error.error_message);
            }
            return payout;
        });
    }
    /**
     * Récupérer un payout
     */
    getPayout(payoutId) {
        return __awaiter(this, void 0, void 0, function* () {
            const payout = this.mockPayouts.get(payoutId);
            if (!payout) {
                throw new Error(`Payout not found: ${payoutId}`);
            }
            return payout;
        });
    }
    /**
     * Rechercher des payouts par référence
     */
    searchPayoutsByReference(clientReference) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = [];
            for (const payout of this.mockPayouts.values()) {
                if (payout.client_reference === clientReference) {
                    results.push(payout);
                }
            }
            return results;
        });
    }
    /**
     * Annuler un payout (mock)
     */
    reversePayout(payoutId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`🧪 MOCK: Reversing payout ${payoutId}`);
            const payout = this.mockPayouts.get(payoutId);
            if (!payout) {
                throw new Error(`Payout not found: ${payoutId}`);
            }
            // Vérifier si déjà annulé
            if (payout.status === 'reversed') {
                console.log(`⚠️ MOCK: Payout already reversed`);
                return;
            }
            // Vérifier si le payout peut être annulé
            if (payout.status !== 'succeeded') {
                throw new Error('Seuls les payouts réussis peuvent être annulés');
            }
            // Simuler un délai
            yield this.delay(500);
            // Recréditer le solde
            const amount = parseInt(payout.receive_amount, 10);
            const fee = parseInt(payout.fee, 10);
            this.mockBalance += (amount + fee);
            // Marquer comme annulé
            payout.status = 'reversed';
            this.mockPayouts.set(payoutId, payout);
            console.log(`✅ MOCK: Payout reversed. Balance: ${this.mockBalance.toLocaleString()} FCFA`);
        });
    }
    /**
     * Vérifier un destinataire (mock)
     */
    verifyRecipient(mobile, amount, name, nationalId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`🧪 MOCK: Verifying recipient ${mobile}`);
            this.validatePhoneNumber(mobile);
            yield this.delay(300);
            // Simuler différents scénarios
            const scenarios = [
                { within_limits: true, name_match: 'MATCH' },
                { within_limits: true, name_match: 'NO_MATCH' },
                { within_limits: false, name_match: 'MATCH' },
                { within_limits: true, name_match: 'NAME_NOT_KNOWN' },
            ];
            // Choisir un scénario (90% de succès complet)
            const random = Math.random();
            let result;
            if (random < 0.9) {
                result = scenarios[0]; // Succès
            }
            else if (random < 0.95) {
                result = scenarios[1]; // Nom ne correspond pas
            }
            else {
                result = scenarios[2]; // Limite dépassée
            }
            console.log(`✅ MOCK: Verification result:`, result);
            return result;
        });
    }
    // ============================================================================
    // BALANCE API (MOCK)
    // ============================================================================
    /**
     * Obtenir le solde mock
     */
    getBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`🧪 MOCK: Getting balance`);
            yield this.delay(100);
            return {
                balance: this.mockBalance.toString(),
                currency: 'XOF',
            };
        });
    }
    /**
     * Vérifier si le solde est suffisant
     */
    hasSufficientBalance(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const fee = Math.ceil(amount * (this.config.feePercentage / 100));
            const totalNeeded = amount + fee;
            return this.mockBalance >= totalNeeded;
        });
    }
    // ============================================================================
    // UTILITAIRES
    // ============================================================================
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
        const MIN_AMOUNT = 100;
        const MAX_AMOUNT = 1500000;
        if (amount < MIN_AMOUNT) {
            throw new Error(`Le montant minimum est ${MIN_AMOUNT} FCFA`);
        }
        if (amount > MAX_AMOUNT) {
            throw new Error(`Le montant maximum est ${MAX_AMOUNT.toLocaleString()} FCFA`);
        }
    }
    /**
     * Valider un numéro de téléphone
     */
    validatePhoneNumber(phone) {
        if (!phone) {
            throw new Error('Numéro de téléphone requis');
        }
        const phoneRegex = /^\+221[0-9]{9}$/;
        if (!phoneRegex.test(phone)) {
            throw new Error('Format invalide. Attendu: +221XXXXXXXXX');
        }
    }
    /**
     * Simuler un délai
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Health check
     */
    healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('🧪 MOCK: Health check - Always healthy');
            return true;
        });
    }
    // ============================================================================
    // MÉTHODES DE TEST SPÉCIALES
    // ============================================================================
    /**
     * Réinitialiser l'état du mock
     */
    resetMock() {
        this.mockSessions.clear();
        this.mockPayouts.clear();
        this.mockBalance = 10000000;
        this.config.successRate = 95;
        console.log('🔄 MOCK: State reset');
    }
    /**
     * Obtenir toutes les sessions (pour débogage)
     */
    getAllSessions() {
        return Array.from(this.mockSessions.values());
    }
    /**
     * Obtenir tous les payouts (pour débogage)
     */
    getAllPayouts() {
        return Array.from(this.mockPayouts.values());
    }
    /**
     * Forcer l'échec de la prochaine opération
     */
    forceNextFailure() {
        const originalRate = this.config.successRate;
        this.config.successRate = 0;
        setTimeout(() => {
            this.config.successRate = originalRate;
        }, 100);
        console.log('⚠️ MOCK: Next operation will fail');
    }
    /**
     * Forcer le succès de la prochaine opération
     */
    forceNextSuccess() {
        const originalRate = this.config.successRate;
        this.config.successRate = 100;
        setTimeout(() => {
            this.config.successRate = originalRate;
        }, 100);
        console.log('✅ MOCK: Next operation will succeed');
    }
}
exports.WaveServiceMock = WaveServiceMock;
// ============================================================================
// EXPORT SINGLETON
// ============================================================================
let mockInstance = null;
function getWaveServiceMock() {
    if (!mockInstance) {
        mockInstance = new WaveServiceMock();
    }
    return mockInstance;
}
exports.default = WaveServiceMock;
