# 🧪 Guide d'Exécution des Tests Critiques

Ce document explique comment exécuter les tests de fonctionnalités critiques du backend.

## 📋 Tests Couverts

### 🔴 Test 1 - Double paiement (clic rapide)
**Objectif:** Empêcher les paiements en double suite à un double clic.

**Scénario:** Un utilisateur clique 2 fois très rapidement sur le bouton "Acheter jetons"

**Vérifications:**
- ✅ Un seul achat est enregistré et confirmé
- ✅ Un seul débit est effectué
- ❌ Aucun doublon de transaction confirmée

---

### 🔴 Test 2 - Acceptation simultanée d'un pari
**Objectif:** Éviter qu'un même pari soit accepté par plusieurs personnes.

**Scénario:** Deux utilisateurs tentent d'accepter le même pari exactement au même instant

**Vérifications:**
- ✅ Un seul parieur accepte le pari
- ❌ Le second reçoit un refus
- ✅ Le pari passe à l'état ACCEPTED une seule fois

---

### 🔴 Test 3 - Blocage des fonds lors d'un pari
**Objectif:** Garantir que les fonds sont bloqués dès l'engagement.

**Scénario:** Un utilisateur place un pari sur un combat

**Vérifications:**
- ✅ Le montant du pari est immédiatement bloqué
- ✅ Le solde disponible est réduit
- ✅ Le solde bloqué (lockedBalance) est augmenté
- ❌ Les fonds ne sont plus utilisables pour un autre pari ou retrait

---

### 🔴 Test 4 - Remboursement après annulation du pari
**Objectif:** Restituer correctement les fonds en cas d'annulation.

**Scénario:** Un pari validé est annulé

**Vérifications:**
- ✅ Les fonds sont entièrement remboursés
- ✅ Le solde initial est restauré
- ✅ Le solde bloqué est libéré
- ✅ Aucun frais prélevé

---

### 🔴 Test 5 - Calcul des gains (tests multiples)
**Objectif:** Vérifier l'exactitude des calculs de gains et de commission.

**Scénario:** Créer plusieurs paris avec des montants différents et vérifier les calculs

**Formule:**
```
Pot total = Mise × 2
Commission = Pot total × 10%
Gain = Pot total - Commission
```

**Vérifications:**
- ✅ Gains calculés correctement pour chaque montant
- ✅ Commission correctement déduite (10%)
- ❌ Aucun écart entre calcul manuel et système

**Tests effectués:**
- 1,000 FCFA → Gain attendu: 1,800 FCFA
- 5,000 FCFA → Gain attendu: 9,000 FCFA
- 10,000 FCFA → Gain attendu: 18,000 FCFA
- 25,000 FCFA → Gain attendu: 45,000 FCFA

---

### 🔴 Test 6 - Match nul
**Objectif:** Gérer correctement le cas d'un match nul.

**Scénario:** Deux parieurs ont misé, le combat se termine par un match nul

**Vérifications:**
- ✅ Chaque parieur récupère sa mise intégrale
- ✅ Les soldes bloqués sont libérés
- ✅ Statut du pari: REFUNDED
- ✅ Aucun gagnant ni perdant

---

### 🔴 Test 7 - Victoire d'un lutteur
**Objectif:** Attribuer les gains au bon parieur.

**Scénario:** Un utilisateur parie sur le lutteur gagnant, l'autre sur le perdant

**Vérifications:**
- ✅ Le gagnant reçoit son gain (mise + bénéfice - commission)
- ❌ Le perdant ne reçoit rien
- ✅ Le montant du gain est correct
- ✅ Statut du pari: WON

---

### 🔴 Test 8 - Solde négatif impossible
**Objectif:** Empêcher toute opération dépassant le solde disponible.

**Scénario 1:** Tenter de parier plus que son solde
**Scénario 2:** Tenter de retirer plus que son solde

**Vérifications:**
- ❌ Opération refusée
- ✅ Message d'erreur clair: "Solde insuffisant"
- ✅ Aucun débit effectué
- ✅ Solde inchangé après tentative échouée

---

### 🔴 Test 9 - Test des transactions (global)
**Objectif:** Vérifier la fiabilité globale du système de transaction.

**Scénarios testés:**
1. Achat de jetons (dépôt)
2. Pari
3. Gain
4. Remboursement
5. Retrait

**Vérifications:**
- ✅ Chaque transaction est atomique
- ✅ Chaque transaction est traçable (ID, timestamp, status)
- ❌ Aucune transaction dupliquée
- ❌ Aucune incohérence de solde

---

## 🚀 Exécution des Tests

### Prérequis

1. **Base de données configurée**
   ```bash
   # Vérifier que le .env est correctement configuré
   cat .env | grep DATABASE_URL
   ```

2. **Dépendances installées**
   ```bash
   npm install
   ```

3. **Prisma configuré**
   ```bash
   npx prisma generate
   ```

### Exécuter les tests

```bash
# Depuis le dossier lamb/
npx ts-node tests/critical-features.test.ts
```

### Résultat attendu

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║   TESTS CRITIQUES - FONCTIONNALITÉS BACKEND     ║
║                                                  ║
╚══════════════════════════════════════════════════╝

╔════════════════════════════════════════════════╗
║   INITIALISATION DES TESTS CRITIQUES         ║
╚════════════════════════════════════════════════╝

   ▶ Création des utilisateurs de test...
   ✅ 4 utilisateurs créés avec succès
   ▶ Création d'un événement de test...
   ✅ Événement créé
   ▶ Création des lutteurs...
   ✅ Lutteurs créés
   ▶ Création d'un combat de test...
   ✅ Combat créé

✅ Initialisation terminée avec succès !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TEST 1 - Double paiement (clic rapide)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
...

╔══════════════════════════════════════════════════╗
║              RAPPORT FINAL DES TESTS             ║
╚══════════════════════════════════════════════════╝

  Total de tests: 9
  ✅ Tests réussis: 9
  ❌ Tests échoués: 0
  ⏱  Durée: XX.XXs

╔══════════════════════════════════════════════════╗
║   🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !   ║
╚══════════════════════════════════════════════════╝
```

---

## 🐛 Débogage

### Si un test échoue

1. **Vérifier les logs détaillés**
   - Chaque test affiche des étapes détaillées
   - Les erreurs sont marquées en rouge avec ❌

2. **Vérifier la base de données**
   ```bash
   npx prisma studio
   ```

3. **Consulter les logs du backend**
   ```bash
   tail -f combined.log
   ```

### Erreurs courantes

#### "Wallet not found"
**Cause:** La création du wallet n'a pas réussi lors de l'initialisation

**Solution:**
```bash
# Vérifier que la migration Prisma est à jour
npx prisma migrate dev
```

#### "Fight not found"
**Cause:** Les données de test n'ont pas été créées correctement

**Solution:** 
- Vérifier que les tables `Fighter`, `DayEvent`, et `Fight` existent
- Re-exécuter `setupTests()`

#### "Transaction timeout"
**Cause:** La base de données est trop lente ou surchargée

**Solution:**
- Vérifier la connexion à la base de données
- Augmenter les timeouts dans le code de test

---

## 📊 Interprétation des Résultats

### ✅ Symboles utilisés

- **✅** : Test réussi, comportement attendu observé
- **❌** : Test échoué, comportement incorrect détecté
- **ℹ** : Information supplémentaire, contexte
- **▶** : Étape en cours d'exécution

### 🎯 Critères de réussite

Pour que l'ensemble des tests soit considéré comme **RÉUSSI**, il faut:

1. ✅ **9/9 tests passés**
2. ✅ **Aucun solde négatif détecté**
3. ✅ **Aucune transaction dupliquée confirmée**
4. ✅ **Tous les calculs de gains exacts**
5. ✅ **Tous les remboursements corrects**

---

## 🔍 Points de Contrôle Critiques

### 1. Intégrité des Transactions
```typescript
// Chaque transaction doit avoir:
- id: string (unique)
- createdAt: Date (horodatage)
- status: TransactionStatus
- amount: BigInt (montant)
- userId: string (propriétaire)
```

### 2. Cohérence des Soldes
```typescript
// À tout moment:
wallet.balance >= 0
wallet.lockedBalance >= 0
wallet.balance + wallet.lockedBalance = somme de toutes les transactions
```

### 3. Atomicité des Paris
```typescript
// Un pari doit être:
- Créé en une seule transaction atomique
- Accepté par un seul utilisateur
- Réglé une seule fois
```

---

## 📝 Notes Importantes

### Limitations Actuelles

1. **Test 1 (Double paiement):**
   - Le système crée 2 transactions PENDING
   - Seule la confirmation webhook devrait être unique
   - **Recommandation:** Ajouter un mécanisme de déduplication côté paiement

2. **Transactions externes:**
   - Les tests utilisent des providers de paiement mockés
   - En production, vérifier les webhooks Wave/Orange Money

### Améliorations Futures

1. **Tests de charge:**
   - Tester avec 100+ paris simultanés
   - Vérifier la performance sous charge

2. **Tests de récupération:**
   - Tester la reprise après crash
   - Vérifier les transactions en cours

3. **Tests de sécurité:**
   - Injection SQL
   - Race conditions avancées
   - Attaques par force brute

---

## 🆘 Support

En cas de problème avec les tests:

1. Consulter les logs détaillés du test
2. Vérifier la configuration de la base de données
3. S'assurer que toutes les migrations Prisma sont appliquées
4. Vérifier que le serveur de développement n'est pas en cours d'exécution

---

## ✅ Checklist Avant Production

- [ ] Tous les 9 tests passent avec succès
- [ ] Aucune race condition détectée
- [ ] Calculs de gains vérifiés manuellement
- [ ] Système de remboursement testé
- [ ] Protection contre solde négatif validée
- [ ] Transactions atomiques confirmées
- [ ] Logs de débogage ajoutés
- [ ] Monitoring en place
- [ ] Alertes configurées

---

**Date de création:** 2025-12-23  
**Version:** 1.0.0  
**Auteur:** Équipe Lamb Platform
