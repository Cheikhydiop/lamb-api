# 🧪 GUIDE DE TEST - DÉPÔTS ET RETRAITS (MODE MOCK)

## 🎯 Objectif

Tester les fonctionnalités de dépôt et retrait **sans avoir besoin de l'API Wave réelle**.

---

## ⚙️ Configuration Rapide

### 1. Activer le mode mock

Modifiez votre fichier `.env`:

```env
# Activer le mode mock Wave
WAVE_MOCK_MODE=true

# URLs de callback (doivent pointer vers votre frontend)
WAVE_SUCCESS_URL=http://localhost:3000/payment/success
WAVE_ERROR_URL=http://localhost:3000/payment/error

# Ces clés ne sont pas nécessaires en mode mock
# WAVE_API_KEY=...
# WAVE_API_URL=...
```

### 2. Ajouter les routes mock

Dans votre fichier `src/index.ts`, ajoutez :

```typescript
import mockWaveRoutes from './routes/mockWaveRoutes';

// Après vos autres routes
app.use('/api/mock-wave', mockWaveRoutes);
```

### 3. Redémarrer le serveur

```bash
npm run dev
```

Vous devriez voir dans les logs :
```
🧪 Mode WAVE_MOCK_MODE activé - Utilisation du mock
🧪 WAVE MOCK MODE ACTIVÉ - Utilisation du service simulé
   → Taux de succès: 95%
   → Solde fictif: 10,000,000 FCFA
```

---

## 🧑‍💻 Comment tester

### ✅ Test 1: Dépôt (Checkout)

#### Étape 1: Initier un dépôt

**Via curl:**
```bash
curl -X POST http://localhost:5000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 1000}'
```

**Réponse attendue:**
```json
{
  "transactionId": "clxxxxx",
  "checkoutUrl": "http://localhost:5000/api/mock-wave/checkout/mock_checkout_xxxxx"
}
```

#### Étape 2: Ouvrir l'URL de checkout

Copiez le `checkoutUrl` et ouvrez-le dans votre navigateur.

Vous verrez une **page de paiement Wave simulée** avec :
- 💰 Le montant à payer
- 🏢 Le nom du marchand (Lamb Ji Mock)
- 📝 La référence de transaction
- 2 boutons : **Annuler** et **Payer maintenant**

#### Étape 3: Confirmer le paiement

Cliquez sur **"Payer maintenant"**.

Le mock va :
1. Simuler un délai de traitement (1 seconde)
2. Décider du résultat (95% de succès par défaut)
3. Rediriger vers `WAVE_SUCCESS_URL` ou `WAVE_ERROR_URL`

#### Étape 4: Vérifier le wallet

Si succès, votre wallet devrait être crédité de 1000 FCFA.

```bash
curl http://localhost:5000/api/wallet \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### ✅ Test 2: Retrait (Payout)

#### Étape 1: Initier un retrait

**Via curl:**
```bash
curl -X POST http://localhost:5000/api/wallet/withdrawal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 500}'
```

Le mock va :
1. Vérifier que vous avez le solde
2. Créer un payout Wave fictif
3. Débiter votre wallet **immédiatement**
4. Retourner le résultat

**Réponse attendue (succès):**
```json
{
  "transactionId": "clxxxxx",
  "status": "COMPLETED",
  "message": "Retrait effectué avec succès"
}
```

**Réponse attendue (échec - 5% du temps):**
```json
{
  "error": "Le compte Wave du destinataire est inactif"
}
```

En cas d'échec, votre wallet **NE sera PAS débité**.

---

## 🛠️ Outils de Debug

### Voir l'état du mock

```bash
curl http://localhost:5000/api/mock-wave/status
```

**Réponse:**
```json
{
  "mode": "MOCK",
  "healthy": true,
  "balance": {
    "amount": 10000000,
    "formatted": "10,000,000 XOF"
  },
  "stats": {
    "sessions": 5,
    "payouts": 3,
    "completedSessions": 4,
    "succeededPayouts": 3
  },
  "recentSessions": [...],
  "recentPayouts": [...]
}
```

### Réinitialiser le mock

```bash
curl -X POST http://localhost:5000/api/mock-wave/reset
```

Cela va :
- ✅ Supprimer toutes les sessions
- ✅ Supprimer tous les payouts
- ✅ Remettre le solde à 10M FCFA
- ✅ Remettre le taux de succès à 95%

### Configurer le taux de succès

Pour forcer des **échecs** (utile pour tester la gestion d'erreurs):

```bash
# 0% de succès = toujours échouer
curl -X POST http://localhost:5000/api/mock-wave/config \
  -H "Content-Type: application/json" \
  -d '{"successRate": 0}'
```

Pour forcer des **succès**:

```bash
# 100% de succès
curl -X POST http://localhost:5000/api/mock-wave/config \
  -H "Content-Type: application/json" \
  -d '{"successRate": 100}'
```

### Configurer le solde

Pour simuler un **solde insuffisant**:

```bash
curl -X POST http://localhost:5000/api/mock-wave/config \
  -H "Content-Type: application/json" \
  -d '{"balance": 100}'
```

Ensuite, essayez de retirer 500 FCFA → Vous aurez une erreur "Solde Wave Business insuffisant".

---

## 📊 Scénarios de test complets

### Scénario 1: Flow complet dépôt

1. User a 0 FCFA dans son wallet
2. User demande à déposer 5000 FCFA
3. Backend crée une session checkout
4. User clique sur "Payer maintenant"
5. Wave (mock) confirme le paiement
6. Backend crédite le wallet
7. User a maintenant 5000 FCFA

**Commandes:**
```bash
# 1. Vérifier solde initial
curl http://localhost:5000/api/wallet -H "Authorization: Bearer $TOKEN"

# 2. Initier dépôt
RESPONSE=$(curl -s -X POST http://localhost:5000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 5000}')

echo $RESPONSE

# 3. Extraire l'URL (ou ouvrir dans navigateur)
CHECKOUT_URL=$(echo $RESPONSE | jq -r '.checkoutUrl')
echo "Ouvrir: $CHECKOUT_URL"

# 4. Aller sur l'URL et cliquer "Payer"

# 5. Vérifier solde final
curl http://localhost:5000/api/wallet -H "Authorization: Bearer $TOKEN"
```

### Scénario 2: Flow complet retrait

1. User a 10000 FCFA dans son wallet
2. User demande à retirer 3000 FCFA
3. Backend vérifie le solde
4. Wave (mock) exécute le payout
5. Backend débite le wallet
6. User a maintenant 7000 FCFA

**Commandes:**
```bash
# 1. Retirer
curl -X POST http://localhost:5000/api/wallet/withdrawal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 3000}'

# 2. Vérifier solde
curl http://localhost:5000/api/wallet -H "Authorization: Bearer $TOKEN"
```

### Scénario 3: Tester les erreurs

#### 3a. Solde utilisateur insuffisant

```bash
# User a 100 FCFA mais veut retirer 1000 FCFA
curl -X POST http://localhost:5000/api/wallet/withdrawal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 1000}'

# Erreur attendue: "Solde insuffisant"
```

#### 3b. Solde Wave Business insuffisant

```bash
# 1. Mettre le solde Wave à 100 FCFA
curl -X POST http://localhost:5000/api/mock-wave/config \
  -H "Content-Type: application/json" \
  -d '{"balance": 100}'

# 2. Essayer de retirer 1000 FCFA
curl -X POST http://localhost:5000/api/wallet/withdrawal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 1000}'

# Erreur attendue: "Solde Wave Business insuffisant"
```

#### 3c. Compte Wave destinataire inactif

```bash
# 1. Forcer les échecs
curl -X POST http://localhost:5000/api/mock-wave/config \
  -H "Content-Type: application/json" \
  -d '{"successRate": 0}'

# 2. Essayer de retirer
curl -X POST http://localhost:5000/api/wallet/withdrawal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 500}'

# Erreur attendue: "Le compte Wave du destinataire est inactif"
```

---

## 🎨 Interface frontend

Pour tester avec votre frontend React :

### Page de succès

Créez `/src/pages/PaymentSuccess.tsx`:

```typescript
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ref = searchParams.get('ref');

  useEffect(() => {
    if (ref) {
      // Vérifier le paiement côté serveur
      api.post('/wallet/deposit/verify', { transactionId: ref })
        .then(() => {
          // Succès
          setTimeout(() => navigate('/wallet'), 2000);
        })
        .catch(console.error);
    }
  }, [ref]);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>✅ Paiement réussi!</h1>
      <p>Votre compte va être crédité dans quelques instants...</p>
    </div>
  );
}
```

### Ajoutez la route

Dans `App.tsx`:

```typescript
<Route path="/payment/success" element={<PaymentSuccess />} />
<Route path="/payment/error" element={<PaymentError />} />
```

---

## 🔄 Passer au mode Production

Quand vous aurez l'API Wave réelle:

1. **Désactiver le mock**

```env
# .env
WAVE_MOCK_MODE=false  # ← ou supprimez cette ligne

# Ajouter les vraies clés
WAVE_API_KEY=wave_sn_prod_VOTRE_CLE
WAVE_API_URL=https://api.wave.com
```

2. **Redémarrer le serveur**

Le code utilisera automatiquement le vrai `WaveService` au lieu du mock.

**Aucun changement de code nécessaire!** 🎉

---

## 📝 Checklist de test

Avant de passer en production, vérifiez :

- [ ] ✅ Dépôt avec montant valide (500 FCFA)
- [ ] ✅ Dépôt avec montant invalide (50 FCFA < 100 min)
- [ ] ✅ Retrait avec solde suffisant
- [ ] ✅ Retrait avec solde insuffisant
- [ ] ✅ Annulation sur page Wave
- [ ] ✅ Gestion d'erreur réseau
- [ ] ✅ Cooldown de 60 secondes entre transactions
- [ ] ✅ Affichage correct des frais
- [ ] ✅ Historique des transactions
- [ ] ✅ Notifications en temps réel

---

## 🐛 Troubleshooting

### Le mock ne s'active pas

**Problème:** Vous voyez l'erreur `WAVE_API_KEY is required`

**Solution:** Vérifiez que `WAVE_MOCK_MODE=true` est bien dans `.env`

### Les routes mock ne fonctionnent pas

**Problème:** 404 sur `/api/mock-wave/status`

**Solution:** Ajoutez les routes dans `src/index.ts`:

```typescript
import mockWaveRoutes from './routes/mockWaveRoutes';
app.use('/api/mock-wave', mockWaveRoutes);
```

### Le checkout ne redirige pas

**Problème:** Après "Payer", rien ne se passe

**Solution:** Vérifiez que `WAVE_SUCCESS_URL` pointe vers une vraie route de votre frontend.

---

## 📞 Besoin d'aide ?

Le mock couvre **95%** des cas d'usage réels. Si vous trouvez un bug ou avez besoin d'une fonctionnalité supplémentaire, vous pouvez :

1. Modifier `WaveServiceMock.ts`
2. Ajuster les paramètres via `/api/mock-wave/config`
3. Consulter les logs dans la console

---

**🎉 Vous êtes prêt à tester les dépôts et retraits !**

**Bon test ! 🧪🚀**
