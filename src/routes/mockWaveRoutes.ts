import { Router, Request, Response } from 'express';
import { getWaveServiceMock } from '../services/WaveServiceMock';

const router = Router();

/**
 * 🧪 ROUTES DE TEST WAVE MOCK
 * 
 * Ces routes permettent de simuler les interactions avec Wave
 * quand vous testez sans l'API réelle.
 */

/**
 * GET /api/mock-wave/checkout/:sessionId
 * 
 * Simule la page de paiement Wave
 * L'utilisateur arrive ici après avoir cliqué sur "Déposer"
 */
router.get('/checkout/:sessionId', async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    try {
        const mockService = getWaveServiceMock();
        const session = await mockService.getCheckoutSession(sessionId);

        // Page HTML simple pour simuler Wave
        res.send(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Wave Payment - Mock</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }
                    
                    .container {
                        background: white;
                        border-radius: 20px;
                        padding: 40px;
                        max-width: 450px;
                        width: 100%;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    }
                    
                    .logo {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    
                    .logo h1 {
                        color: #667eea;
                        font-size: 32px;
                        font-weight: 700;
                    }
                    
                    .badge {
                        display: inline-block;
                        background: #f0f0f0;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 12px;
                        color: #666;
                        margin-top: 10px;
                    }
                    
                    .amount {
                        text-align: center;
                        margin: 30px 0;
                        padding: 30px;
                        background: linear-gradient(135deg, #667eea15, #764ba215);
                        border-radius: 15px;
                    }
                    
                    .amount-label {
                        color: #666;
                        font-size: 14px;
                        margin-bottom: 10px;
                    }
                    
                    .amount-value {
                        font-size: 48px;
                        font-weight: 700;
                        color: #667eea;
                    }
                    
                    .amount-currency {
                        font-size: 24px;
                        color: #999;
                    }
                    
                    .info {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 10px;
                        margin-bottom: 30px;
                    }
                    
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    
                    .info-row:last-child {
                        border-bottom: none;
                    }
                    
                    .info-label {
                        color: #666;
                        font-size: 14px;
                    }
                    
                    .info-value {
                        color: #333;
                        font-weight: 600;
                        font-size: 14px;
                    }
                    
                    .buttons {
                        display: flex;
                        gap: 15px;
                    }
                    
                    button {
                        flex: 1;
                        padding: 16px;
                        border: none;
                        border-radius: 10px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }
                    
                    .btn-pay {
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                    }
                    
                    .btn-pay:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
                    }
                    
                    .btn-cancel {
                        background: #f0f0f0;
                        color: #666;
                    }
                    
                    .btn-cancel:hover {
                        background: #e0e0e0;
                    }
                    
                    .loading {
                        display: none;
                        text-align: center;
                        padding: 20px;
                    }
                    
                    .loading.active {
                        display: block;
                    }
                    
                    .spinner {
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #667eea;
                        border-radius: 50%;
                        width: 50px;
                        height: 50px;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    }
                    
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    .hidden {
                        display: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">
                        <h1>🌊 Wave</h1>
                        <span class="badge">🧪 MODE TEST</span>
                    </div>
                    
                    <div id="payment-form">
                        <div class="amount">
                            <div class="amount-label">Montant à payer</div>
                            <div class="amount-value">
                                ${parseInt(session.amount).toLocaleString()}
                                <span class="amount-currency">FCFA</span>
                            </div>
                        </div>
                        
                        <div class="info">
                            <div class="info-row">
                                <span class="info-label">Marchand</span>
                                <span class="info-value">${session.business_name}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Référence</span>
                                <span class="info-value">${session.id.substring(0, 20)}...</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Statut</span>
                                <span class="info-value">En attente</span>
                            </div>
                        </div>
                        
                        <div class="buttons">
                            <button class="btn-cancel" onclick="cancelPayment()">
                                Annuler
                            </button>
                            <button class="btn-pay" onclick="confirmPayment()">
                                Payer maintenant
                            </button>
                        </div>
                    </div>
                    
                    <div class="loading" id="loading">
                        <div class="spinner"></div>
                        <p>Traitement du paiement...</p>
                    </div>
                </div>
                
                <script>
                    const sessionId = '${sessionId}';
                    
                    function confirmPayment() {
                        // Afficher le loading
                        document.getElementById('payment-form').classList.add('hidden');
                        document.getElementById('loading').classList.add('active');
                        
                        // Simuler le paiement
                        fetch('/api/mock-wave/checkout/' + sessionId + '/complete', {
                            method: 'POST'
                        })
                        .then(response => response.json())
                        .then(data => {
                            // Rediriger vers la page de succès
                            const successUrl = data.success_url || '${process.env.WAVE_SUCCESS_URL}?ref=${session.client_reference?.split('_')[1]}';
                            window.location.href = successUrl;
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            // Rediriger vers la page d'erreur
                            const errorUrl = '${process.env.WAVE_ERROR_URL}?ref=${session.client_reference?.split('_')[1]}';
                            window.location.href = errorUrl;
                        });
                    }
                    
                    function cancelPayment() {
                        const errorUrl = '${process.env.WAVE_ERROR_URL}?ref=${session.client_reference?.split('_')[1]}';
                        window.location.href = errorUrl;
                    }
                </script>
            </body>
            </html>
        `);
    } catch (error: any) {
        res.status(404).send(`
            <html>
            <body style="font-family: Arial; padding: 50px; text-align: center;">
                <h1>❌ Session non trouvée</h1>
                <p>${error.message}</p>
            </body>
            </html>
        `);
    }
});

/**
 * POST /api/mock-wave/checkout/:sessionId/complete
 * 
 * Complète un checkout (appelé par le bouton "Payer")
 */
router.post('/checkout/:sessionId/complete', async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    try {
        const mockService = getWaveServiceMock();
        const session = await mockService.getCheckoutSession(sessionId);

        // Compléter le checkout
        await mockService.completeCheckout(sessionId);

        res.json({
            success: true,
            success_url: `${process.env.WAVE_SUCCESS_URL}?ref=${session.client_reference?.split('_')[1]}`
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/mock-wave/status
 * 
 * Affiche l'état du mock (pour debug)
 */
router.get('/status', async (req: Request, res: Response) => {
    try {
        const mockService = getWaveServiceMock();
        const balance = await mockService.getBalance();
        const sessions = mockService.getAllSessions();
        const payouts = mockService.getAllPayouts();

        res.json({
            mode: 'MOCK',
            healthy: true,
            balance: {
                amount: parseInt(balance.balance),
                formatted: `${parseInt(balance.balance).toLocaleString()} ${balance.currency}`
            },
            stats: {
                sessions: sessions.length,
                payouts: payouts.length,
                completedSessions: sessions.filter(s => s.checkout_status === 'complete').length,
                succeededPayouts: payouts.filter(p => p.status === 'succeeded').length
            },
            recentSessions: sessions.slice(-5),
            recentPayouts: payouts.slice(-5)
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/mock-wave/reset
 * 
 * Réinitialiser le mock
 */
router.post('/reset', async (req: Request, res: Response) => {
    try {
        const mockService = getWaveServiceMock();
        mockService.resetMock();

        res.json({
            success: true,
            message: 'Mock réinitialisé'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/mock-wave/config
 * 
 * Configurer le mock (taux de succès, solde, etc.)
 */
router.post('/config', async (req: Request, res: Response) => {
    try {
        const mockService = getWaveServiceMock();
        const { successRate, balance } = req.body;

        if (successRate !== undefined) {
            mockService.setSuccessRate(successRate);
        }

        if (balance !== undefined) {
            mockService.setMockBalance(balance);
        }

        res.json({
            success: true,
            message: 'Configuration mise à jour'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
