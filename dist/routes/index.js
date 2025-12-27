"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Routes;
const authRoutes_1 = require("./authRoutes");
const fightRoutes_1 = __importDefault(require("./fightRoutes"));
const fighterRoutes_1 = __importDefault(require("./fighterRoutes"));
const betRoutes_1 = __importDefault(require("./betRoutes"));
const admin_routes_1 = require("./admin.routes");
const transaction_routes_1 = __importDefault(require("./transaction.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const walletRoutes_1 = __importDefault(require("./walletRoutes"));
const notificationRoutes_1 = __importDefault(require("./notificationRoutes"));
const mockWaveRoutes_1 = __importDefault(require("./mockWaveRoutes"));
const security_1 = require("../middlewares/security");
const authMiddleware_1 = require("../middlewares/authMiddleware");
function Routes(app) {
    // ==================== ROUTES PUBLIQUES ====================
    // Routes d'authentification
    // Routes d'authentification
    app.use('/api/auth', (0, authRoutes_1.createAuthRoutes)());
    // Routes des combattants (lecture publique)
    app.use('/api/fighter', fighterRoutes_1.default);
    // Routes des combats (lecture publique, création admin)
    app.use('/api/fight', fightRoutes_1.default);
    // Routes de test Wave Mock (si WAVE_MOCK_MODE activé)
    if (process.env.WAVE_MOCK_MODE === 'true') {
        app.use('/api/mock-wave', mockWaveRoutes_1.default);
    }
    // ==================== ROUTES PROTÉGÉES ====================
    // Routes utilisateur (Profil, etc.)
    app.use('/api/user', authMiddleware_1.requireAuth, user_routes_1.default);
    // Routes des paris (authentification requise)
    app.use('/api/bet', authMiddleware_1.requireAuth, betRoutes_1.default);
    // Routes transactionnelles (Sécurité renforcée)
    app.use('/api/transactions', authMiddleware_1.requireAuth, security_1.transactionSecurity, transaction_routes_1.default);
    // Routes wallet (dépôt/retrait/solde)
    app.use('/api/wallet', authMiddleware_1.requireAuth, security_1.transactionSecurity, walletRoutes_1.default);
    // Routes notifications (authentification requise)
    app.use('/api/notifications', notificationRoutes_1.default);
    // Routes d'administration (protégées par le router lui-même)
    app.use('/api/admin', (0, admin_routes_1.createAdminRoutes)());
    // ==================== ROUTES DE SANTÉ ET STATUS ====================
    // Route de santé de l'API
    app.get('/api/health', (req, res) => {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
            }
        });
    });
    // Route de vérification détaillée (développement uniquement)
    if (process.env.NODE_ENV === 'development') {
        app.get('/health/detailed', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                versions: {
                    node: process.version,
                    v8: process.versions.v8
                }
            });
        });
    }
    // Route WebSocket status (publique)
    app.get('/api/ws-status', (req, res) => {
        const protocol = req.secure ? 'wss' : 'ws';
        const host = req.get('host') || 'localhost:5000';
        res.json({
            websocket: 'available',
            endpoint: `${protocol}://${host}/ws`,
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    });
    // ==================== ROUTE API INFO ====================
    app.get('/api', (req, res) => {
        res.json({
            success: true,
            name: 'Better API - Plateforme de Paris sur la Lutte Sénégalaise',
            version: '1.0.0',
            description: 'API complète pour les paris sportifs sur la lutte sénégalaise',
            documentation: '/api/docs',
            endpoints: {
                auth: {
                    base: '/api/auth',
                    routes: [
                        'POST /register - Inscription',
                        'POST /login - Connexion',
                        'POST /logout - Déconnexion',
                        'POST /refresh-token - Rafraîchir le token',
                        'POST /forgot-password - Mot de passe oublié',
                        'POST /reset-password - Réinitialiser le mot de passe',
                        'GET /profile - Obtenir le profil',
                        'PUT /profile - Mettre à jour le profil'
                    ]
                },
                fighters: {
                    base: '/api/fighter',
                    routes: [
                        'GET / - Liste des combattants',
                        'GET /search - Rechercher des combattants',
                        'GET /top - Top combattants',
                        'GET /:id - Détails d\'un combattant',
                        'GET /:id/stats - Statistiques d\'un combattant',
                        'POST / - Créer un combattant (Admin)',
                        'PATCH /:id - Modifier un combattant (Admin)',
                        'DELETE /:id - Supprimer un combattant (Admin)'
                    ]
                },
                fights: {
                    base: '/api/fight',
                    routes: [
                        'GET / - Liste des combats',
                        'GET /upcoming - Combats à venir',
                        'GET /popular - Combats populaires',
                        'GET /:id - Détails d\'un combat',
                        'POST / - Créer un combat (Admin)',
                        'PATCH /:id/status - Mettre à jour le statut (Admin)',
                        'POST /:id/validate-result - Valider le résultat (Admin)',
                        'GET /day-events - Liste des journées',
                        'GET /day-events/:id - Détails d\'une journée',
                        'POST /day-events - Créer une journée (Admin)'
                    ]
                },
                bets: {
                    base: '/api/bet',
                    routes: [
                        'GET / - Liste des paris',
                        'GET /:id - Détails d\'un pari',
                        'GET /available/:fightId - Paris disponibles pour un combat',
                        'GET /my-bets - Mes paris',
                        'GET /active - Paris actifs',
                        'GET /stats - Statistiques de paris',
                        'POST / - Créer un pari (Auth)',
                        'POST /:id/accept - Accepter un pari (Auth)',
                        'DELETE /:id - Annuler un pari (Auth)',
                        'POST /:id/settle - Régler un pari (Admin)'
                    ]
                },
                websocket: {
                    endpoint: '/ws',
                    description: 'WebSocket pour les mises à jour en temps réel',
                    events: [
                        'FIGHT_UPDATE - Mise à jour d\'un combat',
                        'BET_PLACED - Nouveau pari créé',
                        'BET_ACCEPTED - Pari accepté',
                        'FIGHT_RESULT - Résultat d\'un combat',
                        'SYSTEM_ALERT - Alerte système'
                    ]
                }
            },
            features: {
                authentication: 'JWT Bearer Token',
                rateLimiting: 'Activé',
                websocket: 'Disponible',
                security: 'Helmet + Custom Headers',
                cors: 'Configuré'
            },
            contact: {
                support: 'support@better-api.com',
                website: 'https://better-api.com'
            }
        });
    });
}
