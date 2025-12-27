import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

/**
 * Wave Business API Service - Production Ready
 * 
 * Implémentation complète des APIs Wave:
 * 1. Checkout API - Pour les dépôts (Cash-In)
 * 2. Payment API - Pour les retraits (Cash-Out/Payout)
 * 
 * Documentation: https://developer.wave.com
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Checkout Session (Cash-In/Dépôt)
 */
export interface WaveCheckoutSession {
    id: string;
    wave_launch_url: string;
    checkout_status: 'pending' | 'complete' | 'failed';
    amount: string;
    currency: string;
    business_name: string;
    client_reference?: string;
    when_created: string;
    when_completed?: string;
}

/**
 * Payout (Cash-Out/Retrait)
 */
export interface WavePayout {
    id: string;
    currency: string;
    receive_amount: string;
    fee: string;
    mobile: string;
    name?: string;
    national_id?: string;
    client_reference?: string;
    payment_reason?: string;
    status: 'processing' | 'succeeded' | 'failed' | 'reversed';
    payout_error?: WavePayoutError;
    timestamp: string;
}

/**
 * Payout Error
 */
export interface WavePayoutError {
    error_code: string;
    error_message: string;
}

/**
 * Balance
 */
export interface WaveBalance {
    balance: string;
    currency: string;
}

/**
 * Recipient Verification
 */
export interface WaveRecipientVerification {
    within_limits: boolean | null;
    name_match: 'MATCH' | 'NO_MATCH' | 'NAME_NOT_KNOWN' | null;
    national_id_match?: 'MATCH' | 'NO_MATCH' | 'ID_NOT_KNOWN' | null;
}

// ============================================================================
// WAVE SERVICE
// ============================================================================

export class WaveService {
    private client: AxiosInstance;
    private apiKey: string;
    private baseUrl: string;

    // URLs de callback pour Checkout
    private successUrl: string;
    private errorUrl: string;

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
        this.client = axios.create({
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
    private setupInterceptors(): void {
        if (process.env.NODE_ENV !== 'production') {
            this.client.interceptors.request.use(
                (config) => {
                    console.log('🌊 Wave Request:', {
                        method: config.method?.toUpperCase(),
                        url: config.url,
                        headers: {
                            ...config.headers,
                            Authorization: 'Bearer ***hidden***',
                        },
                    });
                    return config;
                }
            );

            this.client.interceptors.response.use(
                (response) => {
                    console.log('🌊 Wave Response:', {
                        status: response.status,
                        data: response.data,
                    });
                    return response;
                },
                (error) => {
                    console.error('❌ Wave Error:', {
                        status: error.response?.status,
                        data: error.response?.data,
                    });
                    return Promise.reject(error);
                }
            );
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
    async createCheckoutSession(
        amount: number,
        userId: string,
        transactionId: string
    ): Promise<WaveCheckoutSession> {
        try {
            this.validateAmount(amount);

            const payload = {
                amount: amount.toString(),
                currency: 'XOF',
                error_url: `${this.errorUrl}?ref=${transactionId}`,
                success_url: `${this.successUrl}?ref=${transactionId}`,
                client_reference: `DEPOSIT_${transactionId}_USER_${userId}`,
            };

            const response = await this.client.post<WaveCheckoutSession>(
                '/v1/checkout/sessions',
                payload
            );

            console.log(`✅ Checkout session created: ${response.data.id}`);
            return response.data;
        } catch (error) {
            this.handleError(error, 'createCheckoutSession');
            throw error;
        }
    }

    /**
     * Récupérer une session Checkout
     */
    async getCheckoutSession(sessionId: string): Promise<WaveCheckoutSession> {
        try {
            const response = await this.client.get<WaveCheckoutSession>(
                `/v1/checkout/sessions/${sessionId}`
            );
            return response.data;
        } catch (error) {
            this.handleError(error, 'getCheckoutSession');
            throw error;
        }
    }

    /**
     * Vérifier si un checkout est complété
     */
    async isCheckoutComplete(sessionId: string): Promise<boolean> {
        try {
            const session = await this.getCheckoutSession(sessionId);
            return session.checkout_status === 'complete';
        } catch (error) {
            console.error('Error checking checkout status:', error);
            return false;
        }
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
    async createPayout(
        mobile: string,
        amount: number,
        userId: string,
        transactionId: string,
        userName?: string
    ): Promise<WavePayout> {
        try {
            // Validation
            this.validateAmount(amount);
            this.validatePhoneNumber(mobile);

            // Générer clé d'idempotence (CRITIQUE pour éviter doubles paiements)
            const idempotencyKey = this.generateIdempotencyKey(transactionId);

            const payload: any = {
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

            const response = await this.client.post<WavePayout>(
                '/v1/payout',
                payload,
                {
                    headers: {
                        'Idempotency-Key': idempotencyKey,
                    },
                }
            );

            console.log(`✅ Payout created: ${response.data.id} - ${response.data.status}`);

            // Vérifier si le payout a immédiatement échoué
            if (response.data.status === 'failed' && response.data.payout_error) {
                throw new Error(
                    `Payout failed: ${response.data.payout_error.error_message}`
                );
            }

            return response.data;
        } catch (error) {
            this.handleError(error, 'createPayout');
            throw error;
        }
    }

    /**
     * Récupérer un payout par ID
     * 
     * Documentation: GET /v1/payout/:id
     */
    async getPayout(payoutId: string): Promise<WavePayout> {
        try {
            const response = await this.client.get<WavePayout>(
                `/v1/payout/${payoutId}`
            );
            return response.data;
        } catch (error) {
            this.handleError(error, 'getPayout');
            throw error;
        }
    }

    /**
     * Rechercher des payouts par référence client
     * 
     * Documentation: GET /v1/payouts/search
     */
    async searchPayoutsByReference(clientReference: string): Promise<WavePayout[]> {
        try {
            const response = await this.client.get<{ result: WavePayout[] }>(
                `/v1/payouts/search`,
                {
                    params: { client_reference: clientReference },
                }
            );
            return response.data.result;
        } catch (error) {
            this.handleError(error, 'searchPayoutsByReference');
            throw error;
        }
    }

    /**
     * Annuler un payout (dans les 3 jours)
     * 
     * Documentation: POST /v1/payout/:id/reverse
     * 
     * ⚠️ Idempotent - Peut être appelé plusieurs fois sans danger
     */
    async reversePayout(payoutId: string): Promise<void> {
        try {
            await this.client.post(`/v1/payout/${payoutId}/reverse`);
            console.log(`✅ Payout reversed: ${payoutId}`);
        } catch (error: any) {
            // Gérer les erreurs spécifiques d'annulation
            if (error.response?.data?.error_code) {
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
    async verifyRecipient(
        mobile: string,
        amount: number,
        name?: string,
        nationalId?: string
    ): Promise<WaveRecipientVerification> {
        try {
            const idempotencyKey = crypto.randomBytes(16).toString('hex');

            const payload: any = {
                mobile,
                amount: amount.toString(),
                currency: 'XOF',
            };

            if (name) payload.name = name;
            if (nationalId) payload.national_id = nationalId;

            const response = await this.client.post<WaveRecipientVerification>(
                '/v1/verify_recipient',
                payload,
                {
                    headers: {
                        'Idempotency-Key': idempotencyKey,
                    },
                }
            );

            return response.data;
        } catch (error) {
            this.handleError(error, 'verifyRecipient');
            throw error;
        }
    }

    // ============================================================================
    // BALANCE API
    // ============================================================================

    /**
     * Obtenir le solde du portefeuille Wave Business
     * 
     * Documentation: GET /v1/balance
     */
    async getBalance(): Promise<WaveBalance> {
        try {
            const response = await this.client.get<WaveBalance>('/v1/balance');

            console.log(`💰 Wave Balance: ${response.data.balance} ${response.data.currency}`);

            return response.data;
        } catch (error) {
            this.handleError(error, 'getBalance');
            throw error;
        }
    }

    /**
     * Vérifier si le solde est suffisant pour un payout
     */
    async hasSufficientBalance(amount: number): Promise<boolean> {
        try {
            const balance = await this.getBalance();
            const currentBalance = parseInt(balance.balance, 10);

            // Le montant + frais (~1%)
            const totalNeeded = amount + Math.ceil(amount * 0.01);

            return currentBalance >= totalNeeded;
        } catch (error) {
            console.error('Error checking balance:', error);
            return false;
        }
    }

    // ============================================================================
    // UTILITAIRES
    // ============================================================================

    /**
     * Générer une clé d'idempotence unique basée sur la transaction
     * CRITIQUE: Empêche les doubles paiements
     */
    private generateIdempotencyKey(transactionId: string): string {
        // Utiliser un hash de l'ID de transaction pour garantir l'unicité
        return crypto
            .createHash('sha256')
            .update(`lamb-ji-${transactionId}`)
            .digest('hex')
            .substring(0, 32);
    }

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

        // Limites Wave
        const MIN_AMOUNT = 100; // 100 FCFA minimum
        const MAX_AMOUNT = 1_500_000; // 1.5M FCFA maximum (à ajuster selon vos besoins)

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
    validatePhoneNumber(phone: string): void {
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
    private handleError(error: any, context: string): void {
        if (error.response) {
            const { status, data } = error.response;

            console.error(`🌊 Wave Error [${context}]:`, {
                status,
                error_code: data?.error_code || data?.code,
                message: data?.error_message || data?.message,
            });

            // Erreurs communes Wave
            const errorMap: { [key: string]: string } = {
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

            const errorCode = data?.error_code || data?.code;
            const userMessage = errorMap[errorCode] || data?.error_message || data?.message || 'Erreur Wave inconnue';

            throw new Error(userMessage);
        } else if (error.request) {
            console.error(`🌊 Wave: Pas de réponse [${context}]`);
            throw new Error('Impossible de contacter Wave. Vérifiez votre connexion');
        } else {
            console.error(`🌊 Wave: Erreur configuration [${context}]`, error.message);
            throw error;
        }
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<boolean> {
        try {
            await this.getBalance();
            console.log('✅ Wave API healthy');
            return true;
        } catch (error) {
            console.error('❌ Wave API health check failed');
            return false;
        }
    }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

let waveServiceInstance: WaveService | null = null;

export function getWaveService(): WaveService | any {
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

export default WaveService;
