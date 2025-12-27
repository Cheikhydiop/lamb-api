# 🌊 GUIDE COMPLET D'INTÉGRATION WAVE API - LAMB JI

## Documentation Officielle Wave Utilisée

Ce guide est basé sur :
- **Checkout API** : Pour les dépôts (Cash-In)
- **Payment API** : Pour les retraits (Cash-Out/Payout)
- **Balance API** : Pour vérifier le solde

**Documentation officielle** : https://developer.wave.com

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration initiale](#configuration-initiale)
3. [API Checkout - Dépôts (Cash-In)](#api-checkout---dépôts-cash-in)
4. [API Payment - Retraits (Cash-Out)](#api-payment---retraits-cash-out)
5. [Intégration dans TransactionService](#intégration-dans-transactionservice)
6. [Gestion des webhooks](#gestion-des-webhooks)
7. [Gestion des erreurs](#gestion-des-erreurs)
8. [Tests](#tests)
9. [Sécurité](#sécurité)
10. [FAQ](#faq)

---

## 🎯 Vue d'ensemble

### Ce que fait Wave API pour Lamb Ji

| Fonctionnalité | API utilisée | Cas d'usage |
|----------------|--------------|-------------|
| **Dépôt** | Ch eckout API | User dépose de l'argent sur Lamb Ji |
| **Retrait** | Payment API (Payout) | User retire ses gains vers Wave |
| **Vérification** | Verify Recipient | Vérifier le numéro Wave avant retrait |
| **Annulation** | Reverse Payout | Annuler un retrait (max 3 jours) |
| **Solde** | Balance API | Vérifier le solde Wave Business |

---

## ⚙️ Configuration initiale

### 1. Obtenir votre clé API Wave

1. **Créer compte Wave Business**
   - Aller sur https://business.wave.com
   - S'inscrire (besoin d'une entreprise enregistrée au Sénégal)

2. **Accéder au portail développeur**
   - Se connecter
   - Aller dans "Développeur"
   - ⚠️ Seuls les admins voient cette section

3. **Créer clé API**
   - Cliquer "Créer une nouvelle clé"
   - Sélectionner les permissions :
     - ✅ Checkout API
     - ✅ Payment API  
     - ✅ Balance API
   - **COPIER LA CLÉ** (vous ne la verrez qu'une fois!)

### 2. Configuration .env

Ajouter dans `/lamb/.env`:

```env
# Wave Business API
WAVE_API_KEY=wave_sn_prod_VOTRE_CLE_COMPLETE_ICI
WAVE_API_URL=https://api.wave.com

# Callbacks Checkout (Cash-In)
WAVE_SUCCESS_URL=https://lambji.com/payment/success
WAVE_ERROR_URL=https://lambji.com/payment/error

# Webhook secret (pour vérifier les callbacks)
WAVE_WEBHOOK_SECRET=votre_secret_genere_aleatoirement
```

### 3. Installer les dépendances

```bash
npm install axios crypto
npm install --save-dev @types/node
```

---

## 💳 API Checkout - Dépôts (Cash-In)

### Comment ça marche ?

1. **Backend**: Créer une session checkout
2. **Frontend**: Rediriger user vers Wave
3. **Wave**: User paie avec son app Wave
4. **Wave**: Callback vers votre backend
5. **Backend**: Mettre à jour le wallet user

### Code Backend - Créer session

```typescript
import { getWaveService } from './services/WaveService';

const waveService = getWaveService();

// 1. Créer session checkout
const session = await waveService.createCheckoutSession(
  5000,          // 5000 FCFA
  'user-123',    // ID utilisateur
  'tx-456'       // ID transaction
);

// 2. Retourner l'URL au frontend
return {
  checkoutUrl: session.wave_launch_url,
  sessionId: session.id
};
```

### Code Frontend - Rediriger

```typescript
// Initier dépôt
async function initiateDeposit(amount: number) {
  const response = await api.post('/wallet/deposit', { amount });
  
  // Rediriger vers Wave
  window.location.href = response.data.checkoutUrl;
}
```

### Vérifier le statut

```typescript
// Après callback success
const isComplete = await waveService.isCheckoutComplete(sessionId);

if (isComplete) {
  // Créditer le wallet user
  await prisma.wallet.update({
    where: { userId },
    data: { balance: { increment: amount } }
  });
}
```

---

## 💸 API Payment - Retraits (Cash-Out)

### Comment ça marche ?

1. **User**: Demande retrait
2. **Backend**: Vérifier solde + créer payout
3. **Wave**: Exécute le payout immédiatement
4. **Wave**: Retourne le résultat (succeeded/failed)
5. **Backend**: Mettre à jour wallet + transaction

### Code - Créer un payout

```typescript
// 1. Vérifier le solde du user
const wallet = await prisma.wallet.findUnique({ where: { userId } });
if (wallet.balance < amount) {
  throw new Error('Solde insuffisant');
}

// 2. (Optionnel) Vérifier le destinataire
const verification = await waveService.verifyRecipient(
  '+221771234567',
  amount,
  'Moussa Ndiaye' // Nom pour vérification
);

if (verification.name_match === 'NO_MATCH') {
  throw new Error('Le nom ne correspond pas au compte Wave');
}

if (!verification.within_limits) {
  throw new Error('Le destinataire a atteint ses limites');
}

// 3. Créer le payout
const payout = await waveService.createPayout(
  '+221771234567',  // Numéro Wave
  amount,           // Montant net (sans frais)
  userId,
  transactionId,
  'Moussa Ndiaye'   // Nom (optionnel)
);

// 4. Vérifier le statut
if (payout.status === 'succeeded') {
  // Débiter le wallet immédiatement
  await prisma.wallet.update({
    where: { userId },
    data: { balance: { decrement: amount } }
  });
  
  console.log(`✅ Retrait réussi! Frais: ${payout.fee} FCFA`);
} else if (payout.status === 'processing') {
  // En traitement (rare, généralement instantané)
  // Vérifier plus tard avec getPayout(payout.id)
} else {
  // Échec
  throw new Error(payout.payout_error?.error_message || 'Retrait échoué');
}
```

### Annuler un payout (dans les 3 jours)

```typescript
try {
  await waveService.reversePayout(payoutId);
  
  // Recréditer le wallet
  await prisma.wallet.update({
    where: { userId },
    data: { balance: { increment: amount } }
  });
  
  console.log('✅ Retrait annulé et wallet recrédité');
} catch (error) {
  console.error(' Erreurs courantes:
  // - "Délai d'annulation dépassé (max 3 jours)"
  // - "Le destinataire n'a pas assez de solde"
  // - "Le compte du destinataire est désactivé"
}
```

---

## 🔗 Intégration dans TransactionService

Exemple complet d'intégration:

```typescript
import { getWaveService } from './WaveService';
import { PrismaClient } from '@prisma/client';

export class TransactionService {
  private prisma: PrismaClient;
  private waveService = getWaveService();

  /**
   * Initier un dépôt
   */
  async initiateDeposit(userId: string, amount: number): Promise<{
    transactionId: string;
    checkoutUrl: string;
  }> {
    // 1. Créer transaction PENDING
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        amount,
        type: 'DEPOSIT',
        status: 'PENDING',
        provider: 'WAVE',
      },
    });

    // 2. Créer session Wave
    const session = await this.waveService.createCheckoutSession(
      amount,
      userId,
      transaction.id
    );

    // 3. Sauvegarder session ID
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        metadata: {
          wave_session_id: session.id,
          wave_url: session.wave_launch_url,
        },
      },
    });

    return {
      transactionId: transaction.id,
      checkoutUrl: session.wave_launch_url,
    };
  }

  /**
   * Compléter un dépôt (appelé par webhook ou callback)
   */
  async completeDeposit(transactionId: string): Promise<void> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: { include: { wallet: true } } },
    });

    if (!transaction || transaction.status !== 'PENDING') {
      return;
    }

    const sessionId = transaction.metadata.wave_session_id;

    // Vérifier avec Wave
    const isComplete = await this.waveService.isCheckoutComplete(sessionId);
    
    if (!isComplete) {
      throw new Error('Paiement Wave non complété');
    }

    // Transaction DB pour atomicité
    await this.prisma.$transaction(async (tx) => {
      // Créditer wallet
      await tx.wallet.update({
        where: { id: transaction.user.wallet.id },
        data: {
          balance: { increment: transaction.amount },
        },
      });

      // Marquer transaction complete
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    });

    console.log(`✅ Deposit completed: ${transaction.amount} FCFA`);
  }

  /**
   * Initier un retrait
   */
  async initiateWithdrawal(
    userId: string,
    amount: number
  ): Promise<string> {
    // 1. Vérifier solde
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    
    if (!wallet || wallet.balance < amount) {
      throw new Error('Solde insuffisant');
    }

    // 2. Récupérer numéro Wave user
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user?.phone) {
      throw new Error('Numéro Wave non configuré');
    }

    // 3. (Optionnel) Vérifier destinataire
    const verification = await this.waveService.verifyRecipient(
      user.phone,
      amount,
      user.name
    );

    if (!verification.within_limits) {
      throw new Error('Limite de réception dépassée. Contactez Wave.');
    }

    // 4. Créer transaction PENDING
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        amount,
        type: 'WITHDRAWAL',
        status: 'PENDING',
        provider: 'WAVE',
      },
    });

    // 5. Créer payout Wave
    try {
      const payout = await this.waveService.createPayout(
        user.phone,
        amount,
        userId,
        transaction.id,
        user.name
      );

      // 6. Transaction DB
      await this.prisma.$transaction(async (tx) => {
        // Débiter wallet
        await tx.wallet.update({
          where: { userId },
          data: {
            balance: { decrement: amount },
          },
        });

        // Update transaction
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: payout.status === 'succeeded' ? 'COMPLETED' : 'PROCESSING',
            completedAt: payout.status === 'succeeded' ? new Date() : null,
            metadata: {
              wave_payout_id: payout.id,
              wave_fee: payout.fee,
            },
          },
        });
      });

      return transaction.id;
    } catch (error) {
      // Marquer comme failed
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          error: error.message,
        },
      });

      throw error;
    }
  }
}
```

---

## 📡 Gestion des webhooks

⚠️ **Note**: Wave n'a PAS de webhooks configurables pour l'API Payment.

Pour les **Checkouts (Dépôts)**, utilisez les URLs de callback:

### Configuration

```typescript
// Dans .env
WAVE_SUCCESS_URL=https://lambji.com/payment/success
WAVE_ERROR_URL=https://lambji.com/payment/error
```

### Route Frontend - Success

```typescript
// pages/PaymentSuccess.tsx
export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const transactionRef = searchParams.get('ref');
  
  useEffect(() => {
    if (transactionRef) {
      // Appeler backend pour vérifier
      api.post('/wallet/deposit/verify', {
        transactionId: transactionRef
      }).then(() => {
        toast.success('Dépôt réussi!');
        router.push('/wallet');
      });
    }
  }, [transactionRef]);
  
  return <div>✅ Paiement en cours de traitement...</div>;
}
```

### Route Backend - Vérifier

```typescript
// POST /wallet/deposit/verify
async verifyDeposit(transactionId: string) {
  await transactionService.completeDeposit(transactionId);
  return { success: true };
}
```

---

## ⚠️ Gestion des erreurs

### Erreurs communes et solutions

| Code erreur | Signification | Solution |
|-------------|---------------|----------|
| `insufficient-funds` | Solde Wave Business insuffisant | Recharger wallet ou limiter retraits |
| `recipient-limit-exceeded` | User a atteint sa limite | Demander au user de vérifier son compte Wave |
| `recipient-account-blocked` | Compte bloqué | User doit contacter Wave |
| `recipient-account-inactive` | Compte inactif | User doit réactiver son compte |
| `payout-reversal-time-limit-exceeded` | >3 jours pour annuler | Ne peut plus annuler |
| `country-mismatch` | User pas au Sénégal | Vérifier numéro (+221) |
| `too-many-requests` | Rate limit | Attendre quelques secondes et retry |

### Retry Logic

```typescript
async function retryPayout(
  attempt: number = 1,
  maxAttempts: number = 3
): Promise<WavePayout> {
  try {
    return await waveService.createPayout(...);
  } catch (error) {
    if (error.message.includes('too-many-requests') && attempt < maxAttempts) {
      // Backoff exponentiel: 1s, 2s, 4s
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      return retryPayout(attempt + 1, maxAttempts);
    }
    throw error;
  }
}
```

---

## ✅ Tests

### 1. Test avec petits montants

```bash
# Tester dépôt 100 FCFA
curl -X POST http://localhost:5000/api/wallet/deposit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 100}'

# Tester retrait 100 FCFA
curl -X POST http://localhost:5000/api/wallet/withdrawal \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 100}'
```

### 2. Tester vérification destinataire

```typescript
const verification = await waveService.verifyRecipient(
  '+221771234567',
  1000,
  'Moussa Ndiaye'
);

console.log('Name match:', verification.name_match);
// MATCH, NO_MATCH, NAME_NOT_KNOWN
```

### 3. Tester health check

```typescript
const isHealthy = await waveService.healthCheck();
console.log('Wave API:', isHealthy ? '✅ UP' : '❌ DOWN');
```

---

## 🔒 Sécurité

### 1. Clés d'idempotence (CRITIQUE)

Le service génère automatiquement des clés d'idempotence pour éviter les **doubles paiements**.

```typescript
// Automatique dans WaveService
const idempotencyKey = this.generateIdempotencyKey(transactionId);
```

**Pourquoi c'est important:**
- Si la requête timeout, vous pouvez retry en toute sécurité
- Wave garantit: même clé = pas de double paiement
- TOUJOURS utiliser la même clé pour un même retrait

### 2. Ne JAMAIS exposer la clé API

```typescript
// ❌ MAUVAIS
const apiKey = process.env.WAVE_API_KEY;
res.json({ apiKey }); // JAMAIS !

// ✅ BON
// La clé reste dans le backend uniquement
```

### 3. Valider côté serveur

```typescript
// ❌ MAUVAIS - Frontend décide du montant
app.post('/withdrawal', (req) => {
  const amount = req.body.amount; // User peut modifier!
});

// ✅ BON - Vérifier côté serveur
app.post('withdrawal', (req) => {
  const { userId, amount } = req.body;
  
  // Vérifier que user a le solde
  const wallet = await getWallet(userId);
  if (wallet.balance < amount) {
    throw new Error('Solde insuffisant');
  }
  
  // Proceed...
});
```

---

## 💡 FAQ

### Q: Quels sont les frais Wave ?

**Réponse:**
- **Dépôt (Checkout)**: ~0% (Wave Business absorbe généralement)
- **Retrait (Payout)**: ~1% du montant (vérifier avec Wave)
- Les frais exacts sont retournés dans `payout.fee`

### Q: Combien de temps prend un payout ?

**Réponse:**
- **Généralement instantané** (<5 secondes)
- Le statut est immédiatement `succeeded` ou `failed`
- Si `processing`, vérifier avec `getPayout(id)` après quelques secondes

### Q: Peut-on annuler un dépôt ?

**Réponse:**
- Non, les checkouts ne peuvent pas être annulés côté API
- Seuls les payouts peuvent être annulés (3 jours max)

### Q: Comment gérer les erreurs de limite ?

**Réponse:**
```typescript
if (error.message.includes('limit-exceeded')) {
  // Informer le user
  return {
    error: 'Vous avez atteint votre limite Wave.',
    solution: 'Vérifiez votre compte Wave pour augmenter vos limites.'
  };
}
```

### Q: Faut-il vérifier le destinataire avant chaque payout ?

**Réponse:**
- **Optionnel** mais recommandé
- Évite les échecs de payout
- Coût: 1 requête API supplémentaire
- Verdict: **OUI** pour meilleure UX

---

## 🚀 Prochaines étapes

1. ✅ **Obtenir clé Wave API**
2. ✅ **Configurer .env**
3. ✅ **Tester dépôt 100 FCFA**
4. ✅ **Tester retrait 100 FCFA**
5. ✅ **Intégrer dans TransactionService**
6. ✅ **Tester le flow complet**
7. ✅ **Monitorer les frais réels**

---

## 📞 Support

- **Documentation**: https://developer.wave.com
- **Support Wave**: support@wave.com
- **Status**: https://status.wave.com

---

**🌊 Wave API est maintenant complètement intégré dans Lamb Ji !**

**Prêt pour le lancement ! 🚀🇸🇳**
