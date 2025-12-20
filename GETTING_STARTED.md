# Guide de Démarrage - Better API

## Prérequis

- Node.js >= 18
- PostgreSQL >= 12
- npm ou yarn

## Installation

### 1. Cloner le Repository
```bash
git clone <repository-url>
cd inesic-api
```

### 2. Installer les Dépendances
```bash
npm install
```

### 3. Configurer les Variables d'Environnement
```bash
cp .env.example .env
```

Éditer `.env` et configurer:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/better_db
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
PORT=3000
NODE_ENV=development
```

### 4. Configurer la Base de Données
```bash
# Créer la base de données PostgreSQL
createdb better_db

# Exécuter les migrations
npm run migrate

# Seed les données de test
npm run seed
```

### 5. Démarrer le Serveur
```bash
# Mode développement avec hot reload
npm run dev

# Mode production
npm run build
npm start
```

Le serveur devrait être accessible à `http://localhost:3000`

## Vérifier l'Installation

```bash
# Health check
curl http://localhost:3000/health

# Réponse attendue:
# {"status":"ok","timestamp":"2025-12-12T10:00:00.000Z"}
```

## Données de Test

Après `npm run seed`, les comptes suivants sont disponibles:

### Admin
```
Email: admin@better.app
Password: admin123
```

### Bettors
```
Email: bettor1@better.app
Password: bettor123

Email: bettor2@better.app
Password: bettor123
```

## Premiers Pas

### 1. S'Authentifier
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bettor1@better.app",
    "password": "bettor123"
  }'
```

Récupérer le `accessToken` de la réponse.

### 2. Utiliser le Token
```bash
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <accessToken>"
```

### 3. Créer un Pari
```bash
curl -X POST http://localhost:3000/api/bets \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "chosenFighter": "A",
    "fightId": "fight1"
  }'
```

## Scripts Disponibles

```bash
# Développement
npm run dev          # Démarrage avec hot reload

# Build
npm run build        # Compiler TypeScript en JavaScript

# Production
npm start            # Lancer la version compilée

# Base de Données
npm run migrate      # Exécuter les migrations
npm run seed         # Ajouter les données de test
npm run migrate:prod # Migrations en production

# Vérification
npm run type-check   # Vérifier les types TypeScript
npm run lint         # Linter le code
```

## Structure du Projet

```
src/
├── controllers/     # Gestion des requêtes HTTP
├── services/        # Logique métier
├── routes/          # Définition des endpoints
├── dto/             # Validation des données
├── middlewares/     # Middleware Express
├── utils/           # Utilitaires
├── types/           # Types TypeScript
├── websocket/       # Gestion WebSocket
├── config/          # Configuration
└── index.ts         # Point d'entrée
```

## Documentation API

Voir [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) pour la liste complète des endpoints.

## Architecture

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour les détails sur l'architecture du projet.

## Débogage

### Logs
Les logs sont stockés dans:
- `combined.log` - Tous les logs
- `error.log` - Erreurs uniquement

### Mode Debug
Pour activer le mode debug:
```env
DEBUG=true
```

### Prisma Studio
Voir/éditer les données directement:
```bash
npx prisma studio
```

## Problèmes Courants

### La base de données n'existe pas
```bash
createdb better_db
npm run migrate
```

### Port déjà utilisé
```bash
PORT=3001 npm run dev
```

### Erreur de connexion PostgreSQL
Vérifier:
1. PostgreSQL est lancé: `sudo service postgresql start`
2. `DATABASE_URL` est correct dans `.env`
3. L'utilisateur PostgreSQL a les permissions

### Seed échoue
```bash
npm run migrate
npm run seed
```

## Variables d'Environnement Complètes

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/better_db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Payment Providers
WAVE_API_URL=https://api.wave.com/v1
WAVE_API_KEY=your-wave-api-key

ORANGE_MONEY_API_URL=https://api.orangemoney.com/v1
ORANGE_MONEY_API_KEY=your-orange-money-api-key

# Redis (optionnel)
REDIS_URL=redis://localhost:6379

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS Provider
SMS_PROVIDER=twilio
SMS_API_KEY=your-sms-api-key

# Debug
DEBUG=false
```

## Prochaines Étapes

1. **Explorer l'API** - Utilisez les endpoints avec Postman ou cURL
2. **Intégrer le Frontend** - Connecter votre application client
3. **Configurer les Paiements** - Ajouter les clés API réelles
4. **Ajouter des Tests** - Implémenter les tests unitaires
5. **Déployer** - Configurer le déploiement en production

## Support

Pour les problèmes ou questions:
1. Vérifier [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Consulter [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
3. Vérifier les logs dans `error.log`

## Licence

MIT
