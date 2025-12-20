# Architecture du Projet Better API

## Structure du Projet

```
src/
├── controllers/          # Gère les requêtes HTTP
│   ├── auth.controller.ts
│   ├── bet.controller.ts
│   ├── fight.controller.ts
│   ├── fighter.controller.ts
│   └── transaction.controller.ts
├── services/            # Logique métier
│   ├── auth.service.ts
│   ├── audit.service.ts
│   ├── bet.service.ts
│   ├── fight.service.ts
│   ├── fighter.service.ts
│   ├── notification.service.ts
│   ├── payment.service.ts
│   ├── transaction.service.ts
│   ├── user.service.ts
│   └── WebSocketService.ts
├── routes/              # Définition des endpoints
│   ├── auth.routes.ts
│   ├── bet.routes.ts
│   ├── fight.routes.ts
│   ├── fighter.routes.ts
│   ├── notification.routes.ts
│   ├── transaction.routes.ts
│   └── user.routes.ts
├── dto/                 # Data Transfer Objects (validation)
│   ├── auth.dto.ts
│   ├── bet.dto.ts
│   ├── fight.dto.ts
│   ├── fighter.dto.ts
│   └── transaction.dto.ts
├── middlewares/         # Express middlewares
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── validation.middleware.ts
├── utils/               # Utilitaires
│   ├── constants.ts
│   └── logger.ts
├── websocket/           # WebSocket management
│   └── socket.ts
├── types/               # Type definitions
│   └── express.d.ts
├── container/           # Dependency injection
│   └── ServiceContainer.ts
├── config/              # Configuration
│   └── env.ts
├── index.ts             # Entry point
└── prisma.ts            # Prisma client
```

## Pattern d'Architecture

### Controller-Service-Repository Pattern
1. **Controller** - Reçoit les requêtes HTTP, valide, appelle le service
2. **Service** - Contient la logique métier, appelle Prisma
3. **Prisma** - Accès direct à la base de données

### Exemple de Flux (Create Bet)
```
HTTP POST /api/bets
    ↓
BetController.createBet()
    ↓
validateRequest(CreateBetDTO)
    ↓
BetService.createBet(userId, data)
    ↓
Prisma CRUD Operations
    ↓
Create Notification
    ↓
HTTP 201 Response
```

## Services Créés

### AuthService
- `register()` - Enregistrement utilisateur
- `login()` - Authentification
- `verifyOTP()` - Vérification OTP
- `generateTokens()` - Génération JWT/Refresh tokens
- `refreshToken()` - Renouvellement du token
- `logout()` - Déconnexion

### BetService
- `createBet()` - Créer un pari
- `acceptBet()` - Accepter un pari
- `cancelBet()` - Annuler un pari
- `listBets()` - Lister les paris
- `getBetById()` - Récupérer un pari

### TransactionService
- `createTransaction()` - Créer une transaction
- `withdrawal()` - Retrait de fonds
- `confirmTransaction()` - Confirmer une transaction
- `listTransactions()` - Lister les transactions
- `getWalletBalance()` - Solde du portefeuille

### FightService
- `createFight()` - Créer un combat
- `updateFightStatus()` - Mettre à jour le statut
- `validateFightResult()` - Valider le résultat
- `processWinnings()` - Traiter les gains
- `listFights()` - Lister les combats
- `getFightById()` - Récupérer un combat

### FighterService
- `createFighter()` - Créer un combattant
- `updateFighter()` - Mettre à jour un combattant
- `listFighters()` - Lister les combattants
- `getFighterById()` - Récupérer un combattant
- `deleteFighter()` - Supprimer un combattant

### UserService
- `getUserById()` - Récupérer un utilisateur
- `updateUser()` - Mettre à jour le profil
- `changePassword()` - Changer le mot de passe
- `deactivateAccount()` - Désactiver le compte
- `reactivateAccount()` - Réactiver le compte
- `getUserStats()` - Statistiques utilisateur
- `listUsers()` - Lister les utilisateurs
- `deleteUser()` - Supprimer un utilisateur

### NotificationService
- `createNotification()` - Créer une notification
- `getNotifications()` - Récupérer les notifications
- `getUnreadNotifications()` - Récupérer non lues
- `markAsRead()` - Marquer comme lue
- `markAllAsRead()` - Marquer toutes comme lues
- `deleteNotification()` - Supprimer une notification
- `getUnreadCount()` - Nombre de non lues

### AuditService
- `logAction()` - Enregistrer une action
- `getAuditLogs()` - Récupérer les logs
- `getAuditLogsByUser()` - Logs d'un utilisateur
- `getAuditLogsForRecord()` - Logs pour un enregistrement
- Méthodes spécifiques: `logBetCreated`, `logTransactionConfirmed`, etc.

### PaymentService
- `initiatePayment()` - Initier un paiement
- `verifyPayment()` - Vérifier un paiement
- `refund()` - Effectuer un remboursement
- Support Wave et Orange Money

## Routes API

### Authentication
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/verify-otp` - Vérifier OTP
- `POST /api/auth/refresh` - Renouveler token
- `POST /api/auth/logout` - Déconnexion

### Users
- `GET /api/users/profile` - Profil actuel
- `PATCH /api/users/profile` - Mettre à jour profil
- `POST /api/users/change-password` - Changer mot de passe
- `GET /api/users/stats` - Statistiques
- `POST /api/users/deactivate` - Désactiver compte
- `POST /api/users/reactivate` - Réactiver compte
- `GET /api/users` - Lister (Admin)
- `GET /api/users/:userId` - Récupérer (Admin)
- `DELETE /api/users/:userId` - Supprimer (Admin)

### Fighters
- `POST /api/fighters` - Créer (Admin)
- `PATCH /api/fighters/:fighterId` - Mettre à jour (Admin)
- `GET /api/fighters` - Lister
- `GET /api/fighters/:fighterId` - Récupérer
- `DELETE /api/fighters/:fighterId` - Supprimer (Admin)

### Fights
- `POST /api/fights` - Créer (Admin)
- `PATCH /api/fights/:fightId/status` - Mettre à jour (Admin)
- `POST /api/fights/:fightId/validate-result` - Valider résultat (Admin)
- `GET /api/fights` - Lister
- `GET /api/fights/:fightId` - Récupérer

### Bets
- `POST /api/bets` - Créer
- `POST /api/bets/:betId/accept` - Accepter
- `POST /api/bets/:betId/cancel` - Annuler
- `GET /api/bets` - Lister
- `GET /api/bets/:betId` - Récupérer

### Transactions
- `POST /api/transactions` - Créer
- `POST /api/transactions/withdrawal` - Retrait
- `POST /api/transactions/:transactionId/confirm` - Confirmer (Admin)
- `GET /api/transactions` - Lister
- `GET /api/transactions/:transactionId` - Récupérer
- `GET /api/transactions/wallet/balance` - Solde portefeuille

### Notifications
- `GET /api/notifications` - Lister
- `GET /api/notifications/unread` - Non lues
- `GET /api/notifications/unread/count` - Nombre
- `PATCH /api/notifications/:notificationId/read` - Marquer lue
- `PATCH /api/notifications/read-all` - Marquer toutes lues
- `DELETE /api/notifications/:notificationId` - Supprimer

## Sécurité Implémentée

1. **Authentication** - JWT avec refresh tokens
2. **Authorization** - Middleware `requireAuth`, `requireAdmin`
3. **Rate Limiting** - 100 req/15min général, 5 req/15min auth
4. **Input Validation** - Zod DTO validation
5. **Helmet.js** - Headers de sécurité
6. **CORS** - Contrôle cross-origin
7. **Audit Logging** - Traçabilité des actions
8. **Session Management** - Gestion des sessions
9. **Password Hashing** - Bcrypt
10. **Error Handling** - Middleware d'erreur global

## Base de Données

**PostgreSQL** avec **Prisma ORM**

Modèles:
- User
- Session
- Wallet
- Fighter
- Fight
- FightResult
- Bet
- Winning
- Commission
- Transaction
- Notification
- AuditLog
- OtpCode

## WebSocket Events

- `subscribe:fight` - S'abonner aux mises à jour d'un combat
- `unsubscribe:fight` - Se désabonner
- `subscribe:bets` - S'abonner aux mises à jour de paris
- `fight:update` - Mise à jour du combat
- `fight:result` - Résultat du combat
- `notification` - Nouvelle notification
- `bet:update` - Mise à jour du pari

## Installation & Démarrage

```bash
# Installation des dépendances
npm install

# Configuration du fichier .env
cp .env.example .env

# Migration de la base de données
npx prisma migrate dev

# Seed des données
npx prisma db seed

# Démarrage en développement
npm run dev

# Build production
npm run build

# Lancement en production
npm start
```

## Variables d'Environnement

Voir `.env.example` pour la liste complète.

Principales:
- `PORT` - Port de l'application
- `DATABASE_URL` - URL PostgreSQL
- `JWT_SECRET` - Secret JWT
- `WAVE_API_KEY` - Clé API Wave
- `ORANGE_MONEY_API_KEY` - Clé API Orange Money

## Logging

Logs stockés dans:
- `combined.log` - Tous les logs
- `error.log` - Erreurs uniquement

Logger disponible dans tous les services:
```typescript
import logger from '../utils/logger';
logger.info('Message');
logger.error('Erreur', error);
logger.warn('Avertissement');
logger.debug('Debug');
```

## Prochaines Étapes

1. Implémenter les intégrations réelles de paiement (Wave, Orange Money)
2. Intégrer WebSocket avec Socket.io
3. Implémenter l'envoi d'OTP via SMS
4. Implémenter l'envoi d'emails de notifications
5. Ajouter des tests unitaires et d'intégration
6. Implémenter le caching Redis
7. Ajouter les métriques et monitoring
8. Déploiement Docker et CI/CD
