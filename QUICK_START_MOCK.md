# 🧪 DÉMARRAGE RAPIDE - TEST DÉPÔT/RETRAIT

## ⚡ LANCER EN MODE MOCK (Sans API Wave)

```bash
# Option 1: Script automatique
./start-with-mock.sh

# Option 2: Manuelle
# 1. Ajouter dans .env:
WAVE_MOCK_MODE=true

# 2. Démarrer
npm run dev
```

## ✅ Que faire ensuite ?

### 1. Tester un dépôt (Checkout)

```bash
# Créer un dépôt
curl -X POST http://localhost:5000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 1000}'

# Vous recevrez une URL comme:
# http://localhost:5000/api/mock-wave/checkout/mock_checkout_xxxxx

# Ouvrez cette URL dans votre navigateur
# Cliquez sur "Payer maintenant"
```

### 2. Tester un retrait (Payout)

```bash
# Créer un retrait
curl -X POST http://localhost:5000/api/wallet/withdrawal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 500}'

# Le retrait est immédiat en mode mock!
```

### 3. Voir l'état du mock

```bash
curl http://localhost:5000/api/mock-wave/status
```

## 🛠️ Commandes utiles

```bash
# Réinitialiser le mock
curl -X POST http://localhost:5000/api/mock-wave/reset

# Forcer les échecs (pour tester la gestion d'erreurs)
curl -X POST http://localhost:5000/api/mock-wave/config \
  -H "Content-Type: application/json" \
  -d '{"successRate": 0}'

# Forcer les succès
curl -X POST http://localhost:5000/api/mock-wave/config \
  -H "Content-Type: application/json" \
  -d '{"successRate": 100}'
```

## 📚 Documentation complète

Voir: `tests/GUIDE_TEST_WAVE_MOCK.md`

## 🔄 Revenir au mode normal

```bash
# Dans .env
WAVE_MOCK_MODE=false
# ou supprimer la ligne

# Redémarrer
npm run dev
```

---

**🎉 C'est tout ! Vous pouvez maintenant tester les dépôts et retraits !**
