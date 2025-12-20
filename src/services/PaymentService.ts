import { Service } from 'typedi';
import axios, { AxiosInstance } from 'axios';
import config from '../config/env';
import logger from '../utils/logger';
import crypto from 'crypto';

// ==================== INTERFACES ====================

export interface PaymentProvider {
  initiateDeposit(amount: bigint, phoneNumber: string, userId: string): Promise<PaymentInitiationResult>;
  initiateWithdrawal(amount: bigint, phoneNumber: string, userId: string): Promise<PaymentInitiationResult>;
  verifyPayment(transactionId: string): Promise<PaymentVerificationResult>;
  refund(transactionId: string, amount: bigint): Promise<boolean>;
}

export interface PaymentInitiationResult {
  success: boolean;
  transactionId: string;
  externalRef?: string;
  message?: string;
  requiresUserAction?: boolean;
}

export interface PaymentVerificationResult {
  success: boolean;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  amount?: bigint;
  externalRef?: string;
}

// ==================== MOCK STORE (TEST MODE) ====================

const mockTransactionStore = new Map<string, {
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  amount: bigint;
  phoneNumber: string;
  provider: 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY';
  type: 'DEPOSIT' | 'WITHDRAWAL';
  createdAt: Date;
}>();

// ==================== WAVE PAYMENT PROVIDER ====================

@Service()
export class WavePaymentProvider implements PaymentProvider {
  private httpClient: AxiosInstance;
  private isTestMode: boolean;

  constructor() {
    this.isTestMode = config.payment.mode === 'TEST';

    this.httpClient = axios.create({
      baseURL: config.payment.wave.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.payment.wave.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async initiateDeposit(amount: bigint, phoneNumber: string, userId: string): Promise<PaymentInitiationResult> {
    if (this.isTestMode) {
      return this.mockInitiateDeposit(amount, phoneNumber);
    }

    try {
      // PRODUCTION: Appel API Wave réelle
      const response = await this.httpClient.post('/checkout/sessions', {
        amount: Number(amount),
        currency: 'XOF',
        customer_phone_number: phoneNumber,
        merchant_reference: `DEP-${userId}-${Date.now()}`,
        success_url: `${config.app.apiUrl}/api/v1/webhooks/wave/success`,
        error_url: `${config.app.apiUrl}/api/v1/webhooks/wave/error`,
        webhook_url: `${config.app.apiUrl}/api/v1/webhooks/wave`
      });

      logger.info(`Wave deposit initiated: ${response.data.id}`);

      return {
        success: true,
        transactionId: response.data.id,
        externalRef: response.data.wave_launch_url,
        requiresUserAction: true,
        message: 'Veuillez confirmer le paiement sur votre téléphone'
      };
    } catch (error: any) {
      logger.error('Wave deposit initiation failed:', error);
      return {
        success: false,
        transactionId: '',
        message: error.response?.data?.message || 'Erreur lors de l\'initiation du paiement'
      };
    }
  }

  async initiateWithdrawal(amount: bigint, phoneNumber: string, userId: string): Promise<PaymentInitiationResult> {
    if (this.isTestMode) {
      return this.mockInitiateWithdrawal(amount, phoneNumber);
    }

    try {
      // PRODUCTION: Appel API Wave pour transfert sortant
      const response = await this.httpClient.post('/transfers', {
        amount: Number(amount),
        currency: 'XOF',
        recipient_phone_number: phoneNumber,
        merchant_reference: `WDR-${userId}-${Date.now()}`,
        webhook_url: `${config.app.apiUrl}/api/v1/webhooks/wave`
      });

      logger.info(`Wave withdrawal initiated: ${response.data.id}`);

      return {
        success: true,
        transactionId: response.data.id,
        externalRef: response.data.id,
        message: 'Retrait en cours de traitement'
      };
    } catch (error: any) {
      logger.error('Wave withdrawal initiation failed:', error);
      return {
        success: false,
        transactionId: '',
        message: error.response?.data?.message || 'Erreur lors du retrait'
      };
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerificationResult> {
    if (this.isTestMode) {
      return this.mockVerifyPayment(transactionId);
    }

    try {
      const response = await this.httpClient.get(`/checkout/sessions/${transactionId}`);

      const statusMap: Record<string, 'PENDING' | 'COMPLETED' | 'FAILED'> = {
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
    } catch (error: any) {
      logger.error(`Wave payment verification failed for ${transactionId}:`, error);
      return {
        success: false,
        status: 'FAILED'
      };
    }
  }

  async refund(transactionId: string, amount: bigint): Promise<boolean> {
    if (this.isTestMode) {
      return this.mockRefund(transactionId);
    }

    try {
      await this.httpClient.post(`/checkout/sessions/${transactionId}/refund`, {
        amount: Number(amount)
      });
      logger.info(`Wave refund successful: ${transactionId}`);
      return true;
    } catch (error: any) {
      logger.error(`Wave refund failed for ${transactionId}:`, error);
      return false;
    }
  }

  // ==================== TEST MODE METHODS ====================

  private mockInitiateDeposit(amount: bigint, phoneNumber: string): PaymentInitiationResult {
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
        logger.info(`[TEST] Wave deposit ${transactionId} COMPLETED`);
      } else if (tx) {
        tx.status = 'FAILED';
        logger.info(`[TEST] Wave deposit ${transactionId} FAILED`);
      }
    }, 2000 + Math.random() * 3000);

    return {
      success: true,
      transactionId,
      requiresUserAction: true,
      message: '[TEST MODE] Paiement simulé - sera confirmé automatiquement'
    };
  }

  private mockInitiateWithdrawal(amount: bigint, phoneNumber: string): PaymentInitiationResult {
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
        logger.info(`[TEST] Wave withdrawal ${transactionId} COMPLETED`);
      } else if (tx) {
        tx.status = 'FAILED';
        logger.info(`[TEST] Wave withdrawal ${transactionId} FAILED`);
      }
    }, 1500 + Math.random() * 2500);

    return {
      success: true,
      transactionId,
      message: '[TEST MODE] Retrait simulé'
    };
  }

  private async mockVerifyPayment(transactionId: string): Promise<PaymentVerificationResult> {
    await new Promise(resolve => setTimeout(resolve, 500));

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
  }

  private async mockRefund(transactionId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const tx = mockTransactionStore.get(transactionId);
    if (tx && tx.status === 'COMPLETED') {
      tx.status = 'REFUNDED';
      logger.info(`[TEST] Wave refund successful: ${transactionId}`);
      return true;
    }
    return false;
  }
}

// ==================== ORANGE MONEY PAYMENT PROVIDER ====================

@Service()
export class OrangeMoneyPaymentProvider implements PaymentProvider {
  private httpClient: AxiosInstance;
  private isTestMode: boolean;

  constructor() {
    this.isTestMode = config.payment.mode === 'TEST';

    this.httpClient = axios.create({
      baseURL: config.payment.orangeMoney.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.payment.orangeMoney.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async initiateDeposit(amount: bigint, phoneNumber: string, userId: string): Promise<PaymentInitiationResult> {
    if (this.isTestMode) {
      return this.mockInitiateDeposit(amount, phoneNumber);
    }

    try {
      const response = await this.httpClient.post('/webpayment', {
        merchant_key: config.payment.orangeMoney.merchantId,
        currency: 'OUV',
        order_id: `DEP-${userId}-${Date.now()}`,
        amount: Number(amount),
        return_url: `${config.app.apiUrl}/api/v1/webhooks/orange-money/return`,
        cancel_url: `${config.app.apiUrl}/api/v1/webhooks/orange-money/cancel`,
        notif_url: `${config.app.apiUrl}/api/v1/webhooks/orange-money`,
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
    } catch (error: any) {
      logger.error('Orange Money deposit failed:', error);
      return {
        success: false,
        transactionId: '',
        message: 'Erreur Orange Money'
      };
    }
  }

  async initiateWithdrawal(amount: bigint, phoneNumber: string, userId: string): Promise<PaymentInitiationResult> {
    if (this.isTestMode) {
      return this.mockInitiateWithdrawal(amount, phoneNumber);
    }

    try {
      const response = await this.httpClient.post('/cashin', {
        merchant_key: config.payment.orangeMoney.merchantId,
        currency: 'OUV',
        order_id: `WDR-${userId}-${Date.now()}`,
        amount: Number(amount),
        subscriber_msisdn: phoneNumber,
        notif_url: `${config.app.apiUrl}/api/v1/webhooks/orange-money`
      });

      return {
        success: true,
        transactionId: response.data.txnid,
        message: 'Retrait en cours'
      };
    } catch (error: any) {
      logger.error('Orange Money withdrawal failed:', error);
      return {
        success: false,
        transactionId: '',
        message: 'Erreur de retrait'
      };
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerificationResult> {
    if (this.isTestMode) {
      return this.mockVerifyPayment(transactionId);
    }

    try {
      const response = await this.httpClient.post('/transactionstatus', {
        merchant_key: config.payment.orangeMoney.merchantId,
        payment_token: transactionId
      });

      const statusMap: Record<string, 'PENDING' | 'COMPLETED' | 'FAILED'> = {
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
    } catch (error: any) {
      logger.error('Orange Money verification failed:', error);
      return { success: false, status: 'FAILED' };
    }
  }

  async refund(transactionId: string, amount: bigint): Promise<boolean> {
    if (this.isTestMode) {
      return this.mockRefund(transactionId);
    }

    logger.warn('Orange Money refunds not yet implemented');
    return false;
  }

  // Mock methods (same pattern as Wave)
  private mockInitiateDeposit(amount: bigint, phoneNumber: string): PaymentInitiationResult {
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
      } else if (tx) {
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

  private mockInitiateWithdrawal(amount: bigint, phoneNumber: string): PaymentInitiationResult {
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
      if (tx && Math.random() > 0.05) tx.status = 'COMPLETED';
      else if (tx) tx.status = 'FAILED';
    }, 1200);

    return { success: true, transactionId, message: '[TEST] Retrait OM simulé' };
  }

  private async mockVerifyPayment(transactionId: string): Promise<PaymentVerificationResult> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const tx = mockTransactionStore.get(transactionId);
    if (!tx) return { success: false, status: 'FAILED' };
    return { success: true, status: tx.status, amount: tx.amount };
  }

  private async mockRefund(transactionId: string): Promise<boolean> {
    const tx = mockTransactionStore.get(transactionId);
    if (tx && tx.status === 'COMPLETED') {
      tx.status = 'REFUNDED';
      return true;
    }
    return false;
  }
}

// ==================== FREE MONEY PAYMENT PROVIDER ====================

@Service()
export class FreeMoneyPaymentProvider implements PaymentProvider {
  private httpClient: AxiosInstance;
  private isTestMode: boolean;

  constructor() {
    this.isTestMode = config.payment.mode === 'TEST';

    this.httpClient = axios.create({
      baseURL: config.payment.freeMoney.apiUrl,
      headers: {
        'X-API-Key': config.payment.freeMoney.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async initiateDeposit(amount: bigint, phoneNumber: string, userId: string): Promise<PaymentInitiationResult> {
    if (this.isTestMode) {
      return this.mockInitiateDeposit(amount, phoneNumber);
    }

    // TODO: Implement real Free Money API when available
    logger.warn('Free Money API not yet implemented - using TEST mode');
    return this.mockInitiateDeposit(amount, phoneNumber);
  }

  async initiateWithdrawal(amount: bigint, phoneNumber: string, userId: string): Promise<PaymentInitiationResult> {
    if (this.isTestMode) {
      return this.mockInitiateWithdrawal(amount, phoneNumber);
    }

    logger.warn('Free Money API not yet implemented - using TEST mode');
    return this.mockInitiateWithdrawal(amount, phoneNumber);
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerificationResult> {
    if (this.isTestMode) {
      return this.mockVerifyPayment(transactionId);
    }

    return this.mockVerifyPayment(transactionId);
  }

  async refund(transactionId: string, amount: bigint): Promise<boolean> {
    if (this.isTestMode) {
      return this.mockRefund(transactionId);
    }

    return this.mockRefund(transactionId);
  }

  // Mock methods
  private mockInitiateDeposit(amount: bigint, phoneNumber: string): PaymentInitiationResult {
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
      if (tx && Math.random() > 0.1) tx.status = 'COMPLETED';
      else if (tx) tx.status = 'FAILED';
    }, 1800);

    return { success: true, transactionId, requiresUserAction: true, message: '[TEST] Free Money simulé' };
  }

  private mockInitiateWithdrawal(amount: bigint, phoneNumber: string): PaymentInitiationResult {
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
      if (tx && Math.random() > 0.05) tx.status = 'COMPLETED';
      else if (tx) tx.status = 'FAILED';
    }, 1400);

    return { success: true, transactionId, message: '[TEST] Retrait Free Money simulé' };
  }

  private async mockVerifyPayment(transactionId: string): Promise<PaymentVerificationResult> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const tx = mockTransactionStore.get(transactionId);
    if (!tx) return { success: false, status: 'FAILED' };
    return { success: true, status: tx.status, amount: tx.amount };
  }

  private async mockRefund(transactionId: string): Promise<boolean> {
    const tx = mockTransactionStore.get(transactionId);
    if (tx && tx.status === 'COMPLETED') {
      tx.status = 'REFUNDED';
      return true;
    }
    return false;
  }
}

// ==================== PAYMENT SERVICE (FACTORY) ====================

@Service()
export class PaymentService {
  private waveProvider: WavePaymentProvider;
  private orangeMoneyProvider: OrangeMoneyPaymentProvider;
  private freeMoneyProvider: FreeMoneyPaymentProvider;

  constructor() {
    this.waveProvider = new WavePaymentProvider();
    this.orangeMoneyProvider = new OrangeMoneyPaymentProvider();
    this.freeMoneyProvider = new FreeMoneyPaymentProvider();

    logger.info(`Payment Service initialized in ${config.payment.mode} mode`);
  }

  getProvider(provider: 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY'): PaymentProvider {
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

  async initiateDeposit(
    provider: 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY',
    amount: bigint,
    phoneNumber: string,
    userId: string
  ): Promise<PaymentInitiationResult> {
    const paymentProvider = this.getProvider(provider);
    return paymentProvider.initiateDeposit(amount, phoneNumber, userId);
  }

  async initiateWithdrawal(
    provider: 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY',
    amount: bigint,
    phoneNumber: string,
    userId: string
  ): Promise<PaymentInitiationResult> {
    const paymentProvider = this.getProvider(provider);
    return paymentProvider.initiateWithdrawal(amount, phoneNumber, userId);
  }

  async verifyPayment(
    provider: 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY',
    transactionId: string
  ): Promise<PaymentVerificationResult> {
    const paymentProvider = this.getProvider(provider);
    return paymentProvider.verifyPayment(transactionId);
  }

  async refund(
    provider: 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY',
    transactionId: string,
    amount: bigint
  ): Promise<boolean> {
    const paymentProvider = this.getProvider(provider);
    return paymentProvider.refund(transactionId, amount);
  }
}
