# 🧪 TESTS WAVE MOCK - Guide Rapide

## 📋 Problème rencontré

Vous avez essayé de tester `/api/wallet/deposit` mais avez obtenu:
```
❌ AuthenticationError: Token d'authentification manquant
```

**C'est normal !** Cette route nécessite une authentification.

---

## ✅ 3 SOLUTIONS POUR TESTER

### 🥇 **Solution 1: Interface Web** (RECOMMANDÉ - Pas d'auth nécessaire)

```bash
# Ouvrir l'interface de test dans le navigateur
xdg-open test-wave-mock.html
```

**Avantages:**
- ✅ Aucune authentification nécessaire
- ✅ Interface visuelle intuitive
- ✅ Teste directement le mock Wave
- ✅ Voir les stats en temps réel

---

### 🥈 **Solution 2: Script avec authentification automatique**

```bash
# Ce script va:
# 1. Créer un utilisateur de test
# 2. Se connecter pour obtenir un token
# 3. Tester un dépôt
# 4. Tester un retrait

./test-wave-with-auth.sh
```

---

### 🥉 **Solution 3: Test direct du mock** (Sans passer par /api/wallet)

```bash
# Tester les endpoints mock directement
./test-wave-simple.sh
```

**Note:** Cette solution teste le mock lui-même, mais pas le flow complet wallet → wave.

---

## 🚀 DÉMARRAGE RAPIDE

### Étape 1: Le serveur est déjà démarré ✅

Vous voyez dans les logs:
```
🧪 WAVE MOCK MODE ACTIVÉ - Utilisation du service simulé
   → Taux de succès: 95%
   → Solde fictif: 10 000 000 FCFA
```

### Étape 2: Choisissez votre méthode de test

**Option A - Interface Web (le plus facile):**
```bash
xdg-open test-wave-mock.html
```

**Option B - Script automatique:**
```bash
./test-wave-with-auth.sh
```

---

## 📖 UTILISATION DE L'INTERFACE WEB

1. **Ouvrir** `test-wave-mock.html` dans votre navigateur
2. **Configurer** (optionnel):
   - URL serveur: `http://localhost:5000` (déjà rempli)
   - Token: laissez vide pour les tests mock
3. **Tester un dépôt**:
   - Montant: 1000 FCFA
   - Cliquer "Créer un dépôt"
   - Cliquer "Ouvrir la page de paiement"
   - Cliquer "Payer maintenant"
4. **Tester un retrait**:
   - Montant: 500 FCFA
   - Cliquer "Créer un retrait"
5. **Voir les stats**:
   - Cliquer "Rafraîchir"

---

## 🔐 SI VOUS VOULEZ TESTER AVEC TOKEN JWT

### Créer un utilisateur manuellement:

```bash
# 1. Créer un utilisateur
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+221771234567",
    "password": "Test1234"
  }'

# 2. Se connecter
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }' | jq -r '.token' > /tmp/token.txt

# 3. Utiliser le token
TOKEN=$(cat /tmp/token.txt)
curl -X POST http://localhost:5000/api/wallet/deposit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}' | jq
```

---

## 🎯 ENDPOINTS DISPONIBLES

### Routes Mock (pas d'auth nécessaire):

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/mock-wave/status` | GET | État du mock |
| `/api/mock-wave/config` | POST | Configurer taux succès |
| `/api/mock-wave/reset` | POST | Réinitialiser |
| `/api/mock-wave/checkout/:id` | GET | Page de paiement |

### Routes Wallet (auth nécessaire):

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/wallet` | GET | Solde wallet |
| `/api/wallet/deposit` | POST | Créer dépôt |
| `/api/wallet/withdrawal` | POST | Créer retrait |

---

## 🔧 TROUBLESHOOTING

### "Token manquant"
➡️ Utilisez l'interface web OR créez un utilisateur avec le script

### "Validation failed"
➡️ Vérifiez que vous envoyez: name, email, phone, password

### "Database error"
➡️ Pas grave pour tester le mock, utilisez l'interface web

### "404 Not Found sur /api/mock-wave"
➡️ Vérifiez que `WAVE_MOCK_MODE=true` dans .env

---

## 📚 DOCUMENTATION COMPLÈTE

- **README_WAVE_MOCK.md** - Vue d'ensemble complète
- **tests/GUIDE_TEST_WAVE_MOCK.md** - Guide détaillé
- **test-wave-mock.html** - Interface de test

---

## ✨ RÉSUMÉ

**Pour tester MAINTENANT sans complications:**

```bash
xdg-open test-wave-mock.html
```

**Pour tester avec authentification complète:**

```bash
./test-wave-with-auth.sh
```

**C'est tout ! 🎉**
