import crypto from 'crypto';

/**
 * 🧪 WAVE SERVICE MOCK - Pour Tests Sans API
 * 
 * Ce service simule l'API Wave pour vous permettre de tester
 * les dépôts et retraits sans avoir besoin de l'API Wave réelle.
 * 
 * USAGE:
 * 1. Dans votre .env, ajouter: WAVE_MOCK_MODE=true
 * 2. Utiliser getWaveService() normalement
 * 3. Le mock prendra le relais automatiquement
 */

import {
    WaveCheckoutSession,
    WavePayout,
    WaveBalance,
    WaveRecipientVerification,
    WavePayoutError,
} from './WaveService';

export class WaveServiceMock {
    // Simuler un "stockage" des sessions et payouts
    private mockSessions: Map<string, WaveCheckoutSession> = new Map();
    private mockPayouts: Map<string, WavePayout> = new Map();
    private mockBalance: number = 10_000_000; // 10M FCFA de solde fictif

    // Configuration de simulation
    private config = {
        // Probabilité de succès (0-100)
        successRate: 95, // 95% de succès

        // Délai de traitement simulé (ms)
        processingDelay: 1000, // 1 seconde

        // Frais Wave simulés (1%)
        feePercentage: 1,
    };

    constructor() {
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
    setSuccessRate(rate: number): void {
        this.config.successRate = Math.max(0, Math.min(100, rate));
        console.log(`🎯 Success rate défini: ${this.config.successRate}%`);
    }

    /**
     * Configurer le solde Wave Business fictif
     */
    setMockBalance(amount: number): void {
        this.mockBalance = amount;
        console.log(`💰 Solde mock défini: ${amount.toLocaleString()} FCFA`);
    }

    /**
     * Décider si l'opération doit réussir (basé sur successRate)
     */
    private shouldSucceed(): boolean {
        return Math.random() * 100 < this.config.successRate;
    }

    // ============================================================================
    // CHECKOUT API - DÉPÔTS (MOCK)
    // ============================================================================

    /**
     * Créer une session checkout simulée
     */
    async createCheckoutSession(
        amount: number,
        userId: string,
        transactionId: string
    ): Promise<WaveCheckoutSession> {
        console.log(`🧪 MOCK: Creating checkout session - ${amount} FCFA`);

        // Valider le montant
        this.validateAmount(amount);

        // Générer un ID de session
        const sessionId = `mock_checkout_${crypto.randomBytes(16).toString('hex')}`;

        // Créer la session
        const session: WaveCheckoutSession = {
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
        await this.delay(200);

        return session;
    }

    /**
     * Récupérer une session checkout
     */
    async getCheckoutSession(sessionId: string): Promise<WaveCheckoutSession> {
        const session = this.mockSessions.get(sessionId);

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        return session;
    }

    /**
     * Vérifier si un checkout est complété
     */
    async isCheckoutComplete(sessionId: string): Promise<boolean> {
        const session = this.mockSessions.get(sessionId);
        return session?.checkout_status === 'complete';
    }

    /**
     * Simuler la complétion d'un checkout (pour les tests)
     * Cette méthode n'existe pas dans l'API réelle
     */
    async completeCheckout(sessionId: string): Promise<void> {
        const session = this.mockSessions.get(sessionId);

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        console.log(`🧪 MOCK: Completing checkout ${sessionId}`);

        // Simuler un délai de traitement
        await this.delay(this.config.processingDelay);

        // Décider du résultat
        const success = this.shouldSucceed();

        session.checkout_status = success ? 'complete' : 'failed';
        session.when_completed = new Date().toISOString();

        this.mockSessions.set(sessionId, session);

        console.log(`✅ MOCK: Checkout ${success ? 'succeeded' : 'failed'}`);
    }

    // ============================================================================
    // PAYMENT API - RETRAITS (MOCK)
    // ============================================================================

    /**
     * Créer un payout simulé
     */
    async createPayout(
        mobile: string,
        amount: number,
        userId: string,
        transactionId: string,
        userName?: string
    ): Promise<WavePayout> {
        console.log(`🧪 MOCK: Creating payout - ${amount} FCFA to ${mobile}`);

        // Validation
        this.validateAmount(amount);
        this.validatePhoneNumber(mobile);

        // Calculer les frais
        const fee = Math.ceil(amount * (this.config.feePercentage / 100));

        // Vérifier le solde
        if (this.mockBalance < amount + fee) {
            const error: WavePayoutError = {
                error_code: 'insufficient-funds',
                error_message: 'Solde Wave Business insuffisant',
            };

            const payout: WavePayout = {
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
        const payoutId = `mock_payout_${crypto.randomBytes(16).toString('hex')}`;

        // Simuler un délai de traitement
        await this.delay(this.config.processingDelay);

        // Décider du résultat
        const success = this.shouldSucceed();

        const payout: WavePayout = {
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
        } else {
            // Débiter le solde mock
            this.mockBalance -= (amount + fee);
            console.log(`💰 MOCK: Balance after payout: ${this.mockBalance.toLocaleString()} FCFA`);
        }

        // Stocker le payout
        this.mockPayouts.set(payoutId, payout);

        console.log(`${success ? '✅' : '❌'} MOCK: Payout ${success ? 'succeeded' : 'failed'}: ${payoutId}`);

        // Si échec immédiat, throw
        if (!success) {
            throw new Error(payout.payout_error!.error_message);
        }

        return payout;
    }

    /**
     * Récupérer un payout
     */
    async getPayout(payoutId: string): Promise<WavePayout> {
        const payout = this.mockPayouts.get(payoutId);

        if (!payout) {
            throw new Error(`Payout not found: ${payoutId}`);
        }

        return payout;
    }

    /**
     * Rechercher des payouts par référence
     */
    async searchPayoutsByReference(clientReference: string): Promise<WavePayout[]> {
        const results: WavePayout[] = [];

        for (const payout of this.mockPayouts.values()) {
            if (payout.client_reference === clientReference) {
                results.push(payout);
            }
        }

        return results;
    }

    /**
     * Annuler un payout (mock)
     */
    async reversePayout(payoutId: string): Promise<void> {
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
        await this.delay(500);

        // Recréditer le solde
        const amount = parseInt(payout.receive_amount, 10);
        const fee = parseInt(payout.fee, 10);
        this.mockBalance += (amount + fee);

        // Marquer comme annulé
        payout.status = 'reversed';
        this.mockPayouts.set(payoutId, payout);

        console.log(`✅ MOCK: Payout reversed. Balance: ${this.mockBalance.toLocaleString()} FCFA`);
    }

    /**
     * Vérifier un destinataire (mock)
     */
    async verifyRecipient(
        mobile: string,
        amount: number,
        name?: string,
        nationalId?: string
    ): Promise<WaveRecipientVerification> {
        console.log(`🧪 MOCK: Verifying recipient ${mobile}`);

        this.validatePhoneNumber(mobile);

        await this.delay(300);

        // Simuler différents scénarios
        const scenarios = [
            { within_limits: true, name_match: 'MATCH' as const },
            { within_limits: true, name_match: 'NO_MATCH' as const },
            { within_limits: false, name_match: 'MATCH' as const },
            { within_limits: true, name_match: 'NAME_NOT_KNOWN' as const },
        ];

        // Choisir un scénario (90% de succès complet)
        const random = Math.random();
        let result: WaveRecipientVerification;

        if (random < 0.9) {
            result = scenarios[0]; // Succès
        } else if (random < 0.95) {
            result = scenarios[1]; // Nom ne correspond pas
        } else {
            result = scenarios[2]; // Limite dépassée
        }

        console.log(`✅ MOCK: Verification result:`, result);

        return result;
    }

    // ============================================================================
    // BALANCE API (MOCK)
    // ============================================================================

    /**
     * Obtenir le solde mock
     */
    async getBalance(): Promise<WaveBalance> {
        console.log(`🧪 MOCK: Getting balance`);

        await this.delay(100);

        return {
            balance: this.mockBalance.toString(),
            currency: 'XOF',
        };
    }

    /**
     * Vérifier si le solde est suffisant
     */
    async hasSufficientBalance(amount: number): Promise<boolean> {
        const fee = Math.ceil(amount * (this.config.feePercentage / 100));
        const totalNeeded = amount + fee;

        return this.mockBalance >= totalNeeded;
    }

    // ============================================================================
    // UTILITAIRES
    // ============================================================================

    /**
     * Valider un montant
     */
    validateAmount(amount: number): void {
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
        const MAX_AMOUNT = 1_500_000;

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
    validatePhoneNumber(phone: string): void {
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
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<boolean> {
        console.log('🧪 MOCK: Health check - Always healthy');
        return true;
    }

    // ============================================================================
    // MÉTHODES DE TEST SPÉCIALES
    // ============================================================================

    /**
     * Réinitialiser l'état du mock
     */
    resetMock(): void {
        this.mockSessions.clear();
        this.mockPayouts.clear();
        this.mockBalance = 10_000_000;
        this.config.successRate = 95;
        console.log('🔄 MOCK: State reset');
    }

    /**
     * Obtenir toutes les sessions (pour débogage)
     */
    getAllSessions(): WaveCheckoutSession[] {
        return Array.from(this.mockSessions.values());
    }

    /**
     * Obtenir tous les payouts (pour débogage)
     */
    getAllPayouts(): WavePayout[] {
        return Array.from(this.mockPayouts.values());
    }

    /**
     * Forcer l'échec de la prochaine opération
     */
    forceNextFailure(): void {
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
    forceNextSuccess(): void {
        const originalRate = this.config.successRate;
        this.config.successRate = 100;

        setTimeout(() => {
            this.config.successRate = originalRate;
        }, 100);

        console.log('✅ MOCK: Next operation will succeed');
    }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

let mockInstance: WaveServiceMock | null = null;

export function getWaveServiceMock(): WaveServiceMock {
    if (!mockInstance) {
        mockInstance = new WaveServiceMock();
    }
    return mockInstance;
}

export default WaveServiceMock;
