# 🔧 CORRECTIFS À APPLIQUER - Fonctionnalités Critiques

Ce document liste tous les correctifs nécessaires pour résoudre les problèmes identifiés lors des tests critiques.

---

## 🔴 CORRECTIF 1: Race Condition sur acceptBet (CRITIQUE)

### Problème
Deux utilisateurs peuvent accepter le même pari simultanément, causant:
- Double blocage de fonds
- Incohérence des données
- Risque financier

### Solution

**Fichier**: `/home/diop/Documents/lambji/lamb/src/services/BetService.ts`  
**Méthode**: `acceptBet` (lignes ~333-471)

#### Remplacer la logique actuelle:

```typescript
// ❌ AVANT - Vulnérable aux race conditions
const result = await this.prisma.$transaction(async (tx) => {
  bet = await tx.bet.findUnique({
    where: { id: betId },
    include: { /* ... */ }
  });

  if (!bet) {
    throw new Error('Pari non trouvé');
  }

  if (bet.status !== 'PENDING') {
    throw new Error('Ce pari n\\'est pas disponible');
  }

  // ... vérifications ...

  // ⚠️ PROBLÈME: Entre la lecture et l'écriture, un autre utilisateur peut accepter
  const updatedBet = await tx.bet.update({
    where: { id: betId },
    data: {
      acceptorId: acceptorId,
      status: 'ACCEPTED',
      // ...
    }
  });
});
```

#### Par cette nouvelle logique sécurisée:

```typescript
// ✅ APRÈS - Protégé contre les race conditions
async acceptBet(acceptorId: string, betId: string): Promise<any> {
  try {
    const result = await this.prisma.$transaction(async (tx) => {
      // Étape 1: Lire le pari avec tous les détails
      const bet = await tx.bet.findUnique({
        where: { id: betId },
        include: {
          creator: true,
          fight: {
            include: {
              fighterA: true,
              fighterB: true,
              dayEvent: true
            }
          }
        }
      });

      if (!bet) {
        throw new Error('Pari non trouvé');
      }

      // L'accepteur ne peut pas être le créateur
      if (bet.creatorId === acceptorId) {
        throw new Error('Vous ne pouvez pas accepter votre propre pari');
      }

      // Vérifier si le combat a commencé
      const fightStartTime = bet.fight.scheduledAt || bet.fight.dayEvent?.date;
      const thirtyMinutesBeforeFight = addMinutes(fightStartTime, -30);
      const now = new Date();

      if (isAfter(now, thirtyMinutesBeforeFight)) {
        throw new Error('Impossible d\\'accepter un pari moins de 30 minutes avant le combat');
      }

      // Vérifier les fonds de l'accepteur
      const acceptorWallet = await tx.wallet.findUnique({
        where: { userId: acceptorId }
      });

      if (!acceptorWallet) {
        throw new Error('Portefeuille non trouvé');
      }

      const betAmountBigInt = BigInt(Math.floor(Number(bet.amount)));
      if (acceptorWallet.balance < betAmountBigInt) {
        throw new Error('Solde insuffisant pour accepter ce pari');
      }

      // Étape 2: MISE À JOUR ATOMIQUE avec condition WHERE
      // ⭐ CORRECTIF: Utiliser updateMany avec condition sur le statut
      const updateResult = await tx.bet.updateMany({
        where: {
          id: betId,
          status: 'PENDING',      // ← Condition atomique
          acceptorId: null        // ← Vérifier qu'aucun accepteur
        },
        data: {
          acceptorId: acceptorId,
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          canCancelUntil: null
        }
      });

      // Vérifier si la mise à jour a réussi
      if (updateResult.count === 0) {
        throw new Error('Ce pari a déjà été accepté par un autre utilisateur');
      }

      // Bloquer les fonds de l'accepteur
      const amountToLock = BigInt(Math.floor(bet.amount));
      await tx.wallet.update({
        where: { userId: acceptorId },
        data: {
          balance: { decrement: amountToLock },
          lockedBalance: { increment: amountToLock }
        }
      });

      // Récupérer le pari mis à jour avec toutes les relations
      const updatedBet = await tx.bet.findUnique({
        where: { id: betId },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          },
          acceptor: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          },
          fight: {
            include: {
              fighterA: true,
              fighterB: true,
              dayEvent: true
            }
          }
        }
      });

      // Notifier le créateur
      await tx.notification.create({
        data: {
          userId: bet.creatorId,
          type: 'BET_ACCEPTED',
          title: 'Pari accepté !',
          message: `${updatedBet!.acceptor?.name} a accepté votre pari de ${bet.amount} FCFA.`,
        }
      });

      logger.info(`Pari accepté: ${bet.id} par ${updatedBet!.acceptor?.name}`);
      return updatedBet;
    }, {
      maxWait: 10000,
      timeout: 15000,
      isolationLevel: 'Serializable' // ← Niveau d'isolation le plus strict
    });

    // Notifier l'accepteur (en dehors de la transaction)
    try {
      await this.prisma.notification.create({
        data: {
          userId: acceptorId,
          type: NotificationType.BET_ACCEPTED,
          title: 'Pari accepté',
          message: `Vous avez accepté le pari de ${result.creator.name} de ${result.amount} FCFA.`,
        }
      });
    } catch (notifError) {
      logger.error('Erreur notification accepteur:', notifError);
    }

    return result;

  } catch (error: any) {
    logger.error('Erreur lors de l\\'acceptation du pari:', error);
    throw error;
  }
}
```

### Explications du correctif

1. **`updateMany` avec condition WHERE**: Au lieu de `update`, on utilise `updateMany` qui permet de spécifier des conditions. Si le pari n'est plus `PENDING`, la mise à jour échoue.

2. **Vérification de `count`**: On vérifie que `updateResult.count === 1`. Si c'est 0, cela signifie que le pari a déjà été accepté par un autre utilisateur.

3. **Isolation Serializable**: Le niveau d'isolation le plus strict garantit qu'aucune autre transaction ne peut interférer.

4. **Ordre des opérations**:
   - ✅ Vérifications pré-transaction (lecture seule)
   - ✅ Mise à jour atomique du pari
   - ✅ Si succès → bloquer fonds
   - ✅ Si échec → rollback automatique

### Test de validation

Après avoir appliqué ce correctif, relancer:
```bash
npx ts-node tests/critical-features.test.ts
```

Le **Test 2** devrait maintenant afficher:
```
✅ Accepteur 1: Succès
❌ Accepteur 2: Rejeté - "Ce pari a déjà été accepté par un autre utilisateur"
✅ Test 2 RÉUSSI: Un seul accepteur a validé le pari
```

---

## 🟠 CORRECTIF 2: Sérialisation BigInt dans Audit Logs

### Problème
```
error: Erreur audit log (non-bloquant): Do not know how to serialize a BigInt
```

### Solution

**Fichier**: `/home/diop/Documents/lambji/lamb/src/services/BetService.ts`  
**Ligne**: ~181

#### Ajouter une fonction helper:

```typescript
// Au début du fichier, après les imports
function serializeBigInt(obj: any): string {
  return JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}
```

#### Remplacer:

```typescript
// ❌ AVANT
await this.prisma.auditLog.create({
  data: {
    action: 'CREATE_BET',
    table: 'bets',
    recordId: bet.id,
    newData: JSON.stringify(bet), // ← Échoue avec BigInt
    userId
  }
});
```

#### Par:

```typescript
// ✅ APRÈS
await this.prisma.auditLog.create({
  data: {
    action: 'CREATE_BET',
    table: 'bets',
    recordId: bet.id,
    newData: serializeBigInt(bet), // ← Convertit BigInt en string
    userId
  }
});
```

---

## 🟠 CORRECTIF 3: Méthode WebSocket manquante

### Problème
```
error: this.webSocketService.broadcastNewBetAvailable is not a function
```

### Solution

**Fichier**: `/home/diop/Documents/lambji/lamb/src/services/WebSocketService.ts`

#### Ajouter la méthode:

```typescript
/**
 * Diffuser un nouveau pari disponible à tous les utilisateurs
 */
async broadcastNewBetAvailable(bet: any) {
  try {
    this.broadcast('NEW_BET_AVAILABLE', {
      betId: bet.id,
      fightId: bet.fightId,
      amount: bet.amount.toString(), // BigInt → string
      chosenFighter: bet.chosenFighter,
      creator: bet.creator,
      fight: bet.fight,
      timestamp: new Date().toISOString()
    });

    logger.info(`Nouveau pari diffusé: ${bet.id}`);
  } catch (error: any) {
    logger.error('Erreur diffusion nouveau pari:', error);
  }
}
```

---

## 🟢 CORRECTIF 4: Améliorer Test 7 (Optionnel)

Le backend est correct, mais le test doit être ajusté.

**Fichier**: `/home/diop/Documents/lambji/lamb/tests/critical-features.test.ts`  
**Ligne**: ~596

#### Remplacer:

```typescript
// ❌ AVANT - Calcul incorrect
const creatorExpectedBalance = creatorWalletBefore!.balance + BigInt(winAmount);
```

#### Par:

```typescript
// ✅ APRÈS - Prend en compte que les fonds étaient bloqués
// Le créateur a déjà payé sa mise, donc:
// Nouveau solde = Solde avant création - mise + gain
const creatorExpectedBalance = creatorWalletBefore!.balance - betAmount + BigInt(winAmount);

// OU plus simplement:
// Récupérer le wallet juste après création du pari pour comparaison
const creatorWalletAfterBet = await prisma.wallet.findUnique({ where: { userId: creator.id } });
const creatorExpectedBalance = creatorWalletAfterBet!.balance + BigInt(winAmount);
```

---

## 🟢 CORRECTIF 5: Déduplication des Dépôts (Recommandé)

### Solution

**Fichier**: `/home/diop/Documents/lambji/lamb/src/services/TransactionService.ts`  
**Méthode**: `deposit`

#### Ajouter avant la création de la transaction:

```typescript
async deposit(userId: string, data: { amount: bigint; provider: string; phoneNumber: string }) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });

  if (!user || !user.wallet) {
    throw new Error('User or wallet not found');
  }

  // Validate amount limits
  const minDeposit = BigInt(500);
  const maxDeposit = BigInt(1000000);

  if (data.amount < minDeposit) {
    throw new Error(`Montant minimum de dépôt: ${minDeposit} FCFA`);
  }

  if (data.amount > maxDeposit) {
    throw new Error(`Montant maximum de dépôt: ${maxDeposit} FCFA`);
  }

  // ⭐ NOUVEAUTÉ: Vérifier les doublons (dernière minute)
  const oneMinuteAgo = new Date(Date.now() - 60000);
  const recentDuplicate = await this.prisma.transaction.findFirst({
    where: {
      userId,
      type: 'DEPOSIT',
      amount: data.amount,
      provider: data.provider as any,
      createdAt: { gte: oneMinuteAgo },
      status: { in: ['PENDING', 'CONFIRMED'] }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (recentDuplicate) {
    logger.warn(`Tentative de dépôt en double détectée pour l'utilisateur ${userId}`);
    return recentDuplicate; // Retourner la transaction existante
  }

  // Create transaction in PENDING state
  const transaction = await this.prisma.transaction.create({
    // ... reste du code
  });

  // ... suite du code
}
```

---

## 🟢 CORRECTIF 6: Nettoyage des Tests

Pour éviter l'erreur de contrainte de clé étrangère lors du nettoyage.

**Fichier**: `/home/diop/Documents/lambji/lamb/tests/critical-features.test.ts`  
**Function**: `cleanupTests`

#### Remplacer:

```typescript
// ❌ AVANT - Cause une erreur de contrainte FK
logStep('Suppression des paris de test...');
await prisma.bet.deleteMany({
  where: { fightId: testFight.id }
});

logStep('Suppression des transactions de test...');
await prisma.transaction.deleteMany({
  where: {
    userId: { in: testUsers.map(u => u.id) }
  }
});
```

#### Par:

```typescript
// ✅ APRÈS - Ordre correct pour respecter les FK
logStep('Suppression des commissions de test...');
await prisma.commission.deleteMany({
  where: {
    betId: { in: (await prisma.bet.findMany({
      where: { fightId: testFight.id },
      select: { id: true }
    })).map(b => b.id) }
  }
});

logStep('Suppression des winnings de test...');
await prisma.winning.deleteMany({
  where: {
    userId: { in: testUsers.map(u => u.id) }
  }
});

logStep('Suppression des paris de test...');
await prisma.bet.deleteMany({
  where: { fightId: testFight.id }
});

logStep('Suppression des transactions de test...');
await prisma.transaction.deleteMany({
  where: {
    userId: { in: testUsers.map(u => u.id) }
  }
});
```

---

## ✅ CHECKLIST D'APPLICATION DES CORRECTIFS

### Phase 1: Correctifs Critiques
- [ ] 🔴 Appliquer CORRECTIF 1 (Race Condition acceptBet)
- [ ] 🔴 Tester avec `npx ts-node tests/critical-features.test.ts`
- [ ] 🔴 Vérifier que Test 2 passe maintenant

### Phase 2: Correctifs Moyens
- [ ] 🟠 Appliquer CORRECTIF 2 (Sérialisation BigInt)
- [ ] 🟠 Appliquer CORRECTIF 3 (Méthode WebSocket)
- [ ] 🟠 Tester à nouveau pour vérifier qu'il n'y a plus d'erreurs

### Phase 3: Améliorations
- [ ] 🟢 Appliquer CORRECTIF 4 (Test 7)
- [ ] 🟢 Appliquer CORRECTIF 5 (Déduplication dépôts)
- [ ] 🟢 Appliquer CORRECTIF 6 (Nettoyage tests)
- [ ] 🟢 Re-tester complètement

### Phase 4: Validation Finale
- [ ] ✅ Tous les tests passent (9/9)
- [ ] ✅ Aucune erreur dans les logs
- [ ] ✅ Documentation mise à jour
- [ ] ✅ Code review effectué
- [ ] ✅ Prêt pour déploiement

---

## 📝 NOTES IMPORTANTES

1. **Ordre d'application**: Appliquer les correctifs dans l'ordre de priorité
2. **Tests après chaque correctif**: Valider que le correctif fonctionne
3. **Backup**: Faire un commit Git avant d'appliquer les correctifs
4. **Code review**: Faire valider les correctifs critiques par un senior

---

**Document créé le**: 2025-12-23  
**Dernière mise à jour**: 2025-12-23  
**Version**: 1.0
