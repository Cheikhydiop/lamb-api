# 🎨 Guide Frontend - Adaptation aux Changements Backend

**Date**: 2025-12-23  
**Version Backend**: 1.0 (après correctifs sécurité)  
**Pour**: Équipe Frontend / Mobile

Ce document explique comment adapter l'interface utilisateur aux nouvelles règles métier du backend pour offrir une **expérience utilisateur claire et intuitive**.

---

## 📋 Table des Matières

1. [Acceptation de Paris - Protection Race Condition](#1-acceptation-de-paris)
2. [Annulation de Paris - Délai 30 Minutes](#2-annulation-de-paris)
3. [Limite Paris Simultanés - Maximum 10](#3-limite-paris-simultanés)
4. [Dépôts/Retraits - Délai 60 Secondes](#4-dépôtsretraits)
5. [Règlement de Paris - Protection Admin](#5-règlement-de-paris)
6. [Messages d'Erreur à Afficher](#6-messages-derreur)
7. [Indicateurs Visuels](#7-indicateurs-visuels)

---

## 1. Acceptation de Paris

### 🔄 Changement Backend

**Protection contre acceptation simultanée** : Si deux utilisateurs tentent d'accepter le même pari, seul le premier réussit.

### 🎨 Adaptation Frontend

#### A. Pendant l'Acceptation

```javascript
async function acceptBet(betId) {
  // 1. Désactiver le bouton immédiatement
  const button = document.getElementById(`accept-btn-${betId}`);
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span> Acceptation...';
  
  try {
    const response = await fetch(`/api/bets/${betId}/accept`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message);
    }
    
    // ✅ Succès
    showSuccess('Pari accepté avec succès !');
    redirectTo(`/mes-paris/${betId}`);
    
  } catch (error) {
    // ❌ Échec
    if (error.message.includes('déjà été accepté')) {
      // Cas spécifique: pari déjà accepté
      showWarning('Oups ! Ce pari vient d\'être accepté par un autre joueur.');
      removeBetFromList(betId); // Retirer de la liste
    } else {
      showError(error.message);
      button.disabled = false;
      button.innerHTML = 'Accepter le pari';
    }
  }
}
```

#### B. Interface Visuelle

**Liste des Paris Disponibles**

```html
<!-- Carte de pari -->
<div class="bet-card" id="bet-${betId}">
  <div class="bet-header">
    <span class="fighter-name">Balla Gaye 2</span>
    <span class="amount">10,000 FCFA</span>
  </div>
  
  <div class="bet-info">
    <p>Combat: ${fightName}</p>
    <p>Créé par: ${creatorName}</p>
    <p class="timestamp">Il y a ${timeAgo}</p>
  </div>
  
  <!-- Indicateur de compétition -->
  <div class="viewers-count" style="color: #FF6B6B;">
    <i class="eye-icon"></i> <span id="viewers-${betId}">3</span> personnes regardent
  </div>
  
  <button 
    class="btn-accept" 
    id="accept-btn-${betId}"
    onclick="acceptBet('${betId}')">
    ⚡ Accepter le pari
  </button>
</div>
```

#### C. Feedback Temps Réel (WebSocket)

```javascript
// Écouter les mises à jour en temps réel
socket.on('bet-accepted', (data) => {
  if (data.betId === currentBetId) {
    // Le pari a été accepté par quelqu'un d'autre
    showNotification({
      type: 'warning',
      message: '❌ Trop tard ! Ce pari vient d\'être accepté.',
      duration: 5000
    });
    
    // Retirer le pari de la liste
    removeBetFromUI(data.betId);
  }
});
```

---

## 2. Annulation de Paris

### 🔄 Changement Backend

**Délai minimum de 30 minutes** : Le créateur doit attendre 30 minutes après la création avant de pouvoir annuler.

### 🎨 Adaptation Frontend

#### A. Calcul du Temps Restant

```javascript
function canCancelBet(bet) {
  const now = new Date();
  const createdAt = new Date(bet.createdAt);
  const thirtyMinutesLater = new Date(createdAt.getTime() + 30 * 60 * 1000);
  
  return {
    canCancel: now >= thirtyMinutesLater,
    minutesRemaining: Math.ceil((thirtyMinutesLater - now) / 60000)
  };
}
```

#### B. Bouton Annuler Dynamique

```html
<!-- Pari créé il y a 10 minutes -->
<div class="my-bet-card">
  <h3>Votre pari sur Balla Gaye 2</h3>
  <p>Montant: 10,000 FCFA</p>
  <p>Statut: <span class="badge-pending">En attente</span></p>
  
  <!-- Timer avant annulation possible -->
  <div class="cancel-timer">
    <i class="clock-icon"></i>
    <span>Annulation possible dans <strong id="timer">20 min</strong></span>
  </div>
  
  <button 
    class="btn-cancel" 
    id="cancel-btn"
    disabled
    title="Attendez 30 minutes avant d'annuler">
    🔒 Annuler (disponible dans 20 min)
  </button>
</div>
```

#### C. Mise à Jour du Timer

```javascript
function updateCancelTimer(bet) {
  const { canCancel, minutesRemaining } = canCancelBet(bet);
  
  const timerEl = document.getElementById('timer');
  const buttonEl = document.getElementById('cancel-btn');
  
  if (canCancel) {
    // ✅ Annulation disponible
    timerEl.parentElement.style.display = 'none';
    buttonEl.disabled = false;
    buttonEl.className = 'btn-cancel-active';
    buttonEl.innerHTML = '❌ Annuler ce pari';
    buttonEl.title = 'Cliquez pour annuler et récupérer vos fonds';
  } else {
    // ⏳ Annulation pas encore disponible
    timerEl.textContent = minutesRemaining + ' min';
    buttonEl.disabled = true;
    buttonEl.innerHTML = `🔒 Annuler (dans ${minutesRemaining} min)`;
    
    // Mettre à jour chaque minute
    setTimeout(() => updateCancelTimer(bet), 60000);
  }
}
```

#### D. Progression Visuelle (Barre de Progression)

```html
<div class="cancel-progress">
  <div class="progress-bar">
    <div class="progress-fill" id="cancel-progress" style="width: 33%"></div>
  </div>
  <p class="progress-text">10/30 minutes écoulées</p>
</div>
```

```javascript
function updateCancelProgress(bet) {
  const now = new Date();
  const createdAt = new Date(bet.createdAt);
  const elapsed = (now - createdAt) / 60000; // minutes
  const progress = Math.min((elapsed / 30) * 100, 100);
  
  const progressBar = document.getElementById('cancel-progress');
  progressBar.style.width = progress + '%';
  
  if (progress >= 100) {
    progressBar.classList.add('complete');
    showNotification('✅ Vous pouvez maintenant annuler votre pari');
  }
}
```

#### E. Message de Confirmation

```javascript
async function cancelBet(betId) {
  // Vérifier d'abord localement
  const { canCancel, minutesRemaining } = canCancelBet(bet);
  
  if (!canCancel) {
    showWarning(`Vous devez attendre encore ${minutesRemaining} minute(s) avant d'annuler ce pari.`);
    return;
  }
  
  // Demander confirmation
  const confirmed = await showConfirmDialog({
    title: 'Annuler ce pari ?',
    message: 'Vous récupérerez vos 10,000 FCFA.',
    confirmText: 'Oui, annuler',
    cancelText: 'Non, garder le pari'
  });
  
  if (!confirmed) return;
  
  try {
    await fetch(`/api/bets/${betId}/cancel`, { method: 'POST' });
    showSuccess('✅ Pari annulé ! Vos fonds ont été remboursés.');
    refreshMyBets();
  } catch (error) {
    showError(error.message);
  }
}
```

---

## 3. Limite Paris Simultanés

### 🔄 Changement Backend

**Maximum 10 paris PENDING** : Un utilisateur ne peut pas avoir plus de 10 paris en attente.

### 🎨 Adaptation Frontend

#### A. Compteur de Paris

```html
<div class="bets-counter">
  <div class="counter-header">
    <h3>Vos paris en attente</h3>
    <span class="count-badge" id="pending-count">7/10</span>
  </div>
  
  <!-- Barre de progression -->
  <div class="quota-bar">
    <div class="quota-fill" style="width: 70%;"></div>
  </div>
  
  <p class="quota-text">3 paris disponibles</p>
</div>
```

#### B. Validation Avant Création

```javascript
async function createBet(data) {
  // 1. Vérifier le quota local
  const pendingBets = await getPendingBets();
  
  if (pendingBets.length >= 10) {
    showWarning({
      title: 'Limite atteinte',
      message: 'Vous avez déjà 10 paris en attente. Attendez qu\'ils soient acceptés ou annulez-en certains.',
      actions: [
        { text: 'Voir mes paris', action: () => goToMyBets() },
        { text: 'Compris', action: () => {} }
      ]
    });
    return;
  }
  
  // 2. Afficher un avertissement si proche de la limite
  if (pendingBets.length >= 8) {
    showInfo(`⚠️ Attention : ${10 - pendingBets.length} paris disponibles restants`);
  }
  
  // 3. Créer le pari
  try {
    await fetch('/api/bets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    showSuccess('✅ Pari créé avec succès !');
  } catch (error) {
    if (error.message.includes('trop de paris')) {
      showError('❌ Limite atteinte : Maximum 10 paris en attente');
    } else {
      showError(error.message);
    }
  }
}
```

#### C. Interface de Gestion

```html
<div class="pending-bets-manager">
  <h2>Gérer vos paris en attente (7/10)</h2>
  
  <!-- Liste des paris -->
  <div class="bets-list">
    <div class="bet-item">
      <span>Balla Gaye 2 - 5,000 FCFA</span>
      <button class="btn-cancel-small" onclick="quickCancel('bet1')">
        Annuler
      </button>
    </div>
    <!-- ... autres paris ... -->
  </div>
  
  <!-- Action rapide -->
  <button class="btn-secondary" onclick="cancelOldestBets()">
    Annuler les 3 plus anciens
  </button>
</div>
```

---

## 4. Dépôts/Retraits

### 🔄 Changement Backend

**Délai de 60 secondes** : entre deux transactions identiques (même montant + même provider).

### 🎨 Adaptation Frontend

#### A. Timer de Cooldown

```javascript
class TransactionCooldown {
  constructor() {
    this.cooldowns = new Map();
  }
  
  getCooldownKey(type, amount, provider) {
    return `${type}-${amount}-${provider}`;
  }
  
  canSubmit(type, amount, provider) {
    const key = this.getCooldownKey(type, amount, provider);
    const lastTransaction = this.cooldowns.get(key);
    
    if (!lastTransaction) return { can: true };
    
    const now = Date.now();
    const elapsed = now - lastTransaction;
    const remaining = Math.ceil((60000 - elapsed) / 1000);
    
    if (elapsed >= 60000) {
      return { can: true };
    }
    
    return { can: false, secondsRemaining: remaining };
  }
  
  recordTransaction(type, amount, provider) {
    const key = this.getCooldownKey(type, amount, provider);
    this.cooldowns.set(key, Date.now());
  }
}

const cooldown = new TransactionCooldown();
```

#### B. Formulaire de Dépôt

```html
<form id="deposit-form">
  <h2>Acheter des jetons</h2>
  
  <label>Montant</label>
  <input type="number" id="amount" min="500" max="1000000" step="100" required>
  
  <label>Méthode de paiement</label>
  <select id="provider">
    <option value="WAVE">Wave</option>
    <option value="ORANGE_MONEY">Orange Money</option>
    <option value="FREE_MONEY">Free Money</option>
  </select>
  
  <!-- Timer de cooldown (masqué par défaut) -->
  <div id="cooldown-warning" style="display: none;" class="alert-warning">
    <i class="clock-icon"></i>
    <span>Attendez <strong id="cooldown-timer">60</strong> secondes avant un nouveau dépôt identique</span>
  </div>
  
  <button type="submit" id="submit-btn" class="btn-primary">
    💳 Déposer
  </button>
</form>
```

#### C. Validation avec Cooldown

```javascript
document.getElementById('deposit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const amount = document.getElementById('amount').value;
  const provider = document.getElementById('provider').value;
  
  // Vérifier le cooldown
  const check = cooldown.canSubmit('DEPOSIT', amount, provider);
  
  if (!check.can) {
    // Afficher le timer
    showCooldownWarning(check.secondsRemaining);
    return;
  }
  
  // Soumettre la transaction
  try {
    const response = await fetch('/api/transactions/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, provider })
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      if (error.message.includes('60 secondes')) {
        showCooldownWarning(60);
      } else {
        showError(error.message);
      }
      return;
    }
    
    // Succès
    cooldown.recordTransaction('DEPOSIT', amount, provider);
    showSuccess('✅ Dépôt en cours de traitement');
    
  } catch (error) {
    showError(error.message);
  }
});

function showCooldownWarning(seconds) {
  const warningEl = document.getElementById('cooldown-warning');
  const timerEl = document.getElementById('cooldown-timer');
  const submitBtn = document.getElementById('submit-btn');
  
  warningEl.style.display = 'block';
  submitBtn.disabled = true;
  
  // Compte à rebours
  let remaining = seconds;
  timerEl.textContent = remaining;
  
  const interval = setInterval(() => {
    remaining--;
    timerEl.textContent = remaining;
    
    if (remaining <= 0) {
      clearInterval(interval);
      warningEl.style.display = 'none';
      submitBtn.disabled = false;
      showInfo('✅ Vous pouvez maintenant effectuer un dépôt');
    }
  }, 1000);
}
```

#### D. Alternative : Modification Automatique

```javascript
// Si l'utilisateur essaie de soumettre trop vite, suggérer de modifier le montant
function suggestModification() {
  showDialog({
    title: 'Délai de 60 secondes actif',
    message: 'Vous avez déjà effectué cette transaction. Voulez-vous modifier le montant ?',
    actions: [
      {
        text: 'Ajouter 100 FCFA',
        action: () => {
          const input = document.getElementById('amount');
          input.value = parseInt(input.value) + 100;
          input.focus();
        }
      },
      {
        text: 'Attendre 60 secondes',
        action: () => {}
      }
    ]
  });
}
```

---

## 5. Règlement de Paris

### 🔄 Changement Backend

**Protection admin** : Un admin ne peut pas régler le même pari deux fois.

### 🎨 Adaptation Frontend (Admin Panel)

```html
<!-- Interface Admin -->
<div class="admin-settle-bet">
  <h2>Régler le combat: Balla Gaye 2 vs Modou Lô</h2>
  
  <div class="bet-summary">
    <p>Total de paris: 47</p>
    <p>Montant total: 2,350,000 FCFA</p>
  </div>
  
  <div class="winner-selection">
    <button 
      class="btn-winner" 
      id="winner-a"
      onclick="settleFight('${fightId}', 'A')">
      🥇 Balla Gaye 2 gagne
    </button>
    
    <button 
      class="btn-winner" 
      id="winner-b"
      onclick="settleFight('${fightId}', 'B')">
      🥇 Modou Lô gagne
    </button>
    
    <button 
      class="btn-draw" 
      onclick="settleFight('${fightId}', 'DRAW')">
      🤝 Match nul
    </button>
  </div>
  
  <!-- Indicateur de statut -->
  <div id="settle-status" class="status-pending">
    ⏳ En attente du résultat
  </div>
</div>
```

```javascript
async function settleFight(fightId, winner) {
  // Désactiver tous les boutons immédiatement
  disableAllButtons();
  
  const statusEl = document.getElementById('settle-status');
  statusEl.className = 'status-processing';
  statusEl.innerHTML = '🔄 Traitement en cours...';
  
  try {
    const response = await fetch(`/api/fights/${fightId}/settle`, {
      method: 'POST',
      body: JSON.stringify({ winner })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    // Succès
    statusEl.className = 'status-success';
    statusEl.innerHTML = '✅ Combat réglé avec succès !';
    
    showSuccess('Tous les gains ont été distribués');
    
    setTimeout(() => {
      redirectTo('/admin/fights');
    }, 2000);
    
  } catch (error) {
    if (error.message.includes('déjà été réglé')) {
      statusEl.className = 'status-error';
      statusEl.innerHTML = '❌ Ce combat a déjà été réglé';
      showError('Ce combat a déjà été réglé par un autre admin');
    } else {
      statusEl.className = 'status-error';
      statusEl.innerHTML = '❌ Erreur: ' + error.message;
      enableAllButtons(); // Réactiver en cas d'erreur
    }
  }
}
```

---

## 6. Messages d'Erreur

### 📝 Liste Complète des Messages Backend

```javascript
const ERROR_MESSAGES = {
  // Acceptation
  'Ce pari a déjà été accepté par un autre utilisateur': {
    title: 'Pari déjà pris',
    message: 'Désolé, quelqu\'un d\'autre vient d\'accepter ce pari.',
    icon: '😔',
    action: 'Retour aux paris disponibles'
  },
  
  // Annulation
  'Seul le créateur du pari peut l\'annuler': {
    title: 'Action non autorisée',
    message: 'Vous ne pouvez pas annuler le pari d\'un autre joueur.',
    icon: '🚫'
  },
  
  'Impossible d\'annuler un pari déjà accepté': {
    title: 'Pari déjà accepté',
    message: 'Ce pari a été accepté et ne peut plus être annulé.',
    icon: '⚠️'
  },
  
  'Vous devez attendre': {
    title: 'Délai d\'annulation',
    message: 'Attendez quelques minutes avant de pouvoir annuler ce pari.',
    icon: '⏳',
    parse: (msg) => {
      const match = msg.match(/(\d+) minute/);
      return match ? `Encore ${match[1]} minute(s) d'attente` : msg;
    }
  },
  
  // Création
  'Maximum : 10 paris en attente': {
    title: 'Limite atteinte',
    message: 'Vous avez déjà 10 paris en attente. Annulez-en certains ou attendez qu\'ils soient acceptés.',
    icon: '📊',
    action: 'Gérer mes paris'
  },
  
  // Transactions
  'Vous avez déjà effectué un dépôt identique': {
    title: 'Délai de sécurité',
    message: 'Attendez 60 secondes avant de refaire un dépôt identique.',
    icon: '🔒'
  },
  
  'Solde insuffisant': {
    title: 'Solde insuffisant',
    message: 'Vous n\'avez pas assez de fonds pour cette action.',
    icon: '💰',
    action: 'Recharger mon compte'
  }
};

function displayError(errorMessage) {
  const config = ERROR_MESSAGES[errorMessage] || {
    title: 'Erreur',
    message: errorMessage,
    icon: '❌'
  };
  
  showNotification({
    type: 'error',
    title: config.title,
    message: config.parse ? config.parse(errorMessage) : config.message,
    icon: config.icon,
    action: config.action,
    duration: 5000
  });
}
```

---

## 7. Indicateurs Visuels

### 🎨 Composants UI Recommandés

#### A. Badge de Statut

```html
<!-- Statuts de paris -->
<span class="badge badge-pending">⏳ En attente</span>
<span class="badge badge-accepted">✅ Accepté</span>
<span class="badge badge-won">🏆 Gagné</span>
<span class="badge badge-lost">😔 Perdu</span>
<span class="badge badge-cancelled">❌ Annulé</span>
<span class="badge badge-refunded">💸 Remboursé</span>
```

```css
.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-pending {
  background: #FFF3CD;
  color: #856404;
}

.badge-accepted {
  background: #D4EDDA;
  color: #155724;
}

.badge-won {
  background: #D1ECF1;
  color: #0C5460;
}

.badge-cancelled {
  background: #F8D7DA;
  color: #721C24;
}
```

#### B. Timer Visuel

```html
<div class="timer-widget">
  <svg class="timer-circle" viewBox="0 0 36 36">
    <path class="timer-bg"
      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
    />
    <path class="timer-progress"
      stroke-dasharray="33, 100"
      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
    />
  </svg>
  <div class="timer-text">
    <span class="timer-value">20</span>
    <span class="timer-unit">min</span>
  </div>
</div>
```

#### C. Toast Notifications

```javascript
function showToast(type, message) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${getIcon(type)}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function getIcon(type) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  return icons[type] || 'ℹ️';
}
```

---

## 📱 Checklist UX Complete

### Pour chaque Action Utilisateur

- [ ] **Feedback Immédiat** : Désactiver boutons, afficher loader
- [ ] **Messages Clairs** : Expliquer POURQUOI une action échoue
- [ ] **Actions Alternatives** : Proposer une solution
- [ ] **Prévention** : Valider côté client avant d'envoyer au backend
- [ ] **Indicateurs Visuels** : Timers, progress bars, compteurs
- [ ] **Confirmation** : Demander confirmation pour actions critiques
- [ ] **Récupération d'Erreur** : Permettre de réessayer facilement

---

## 🚀 Exemple Complet : Cycle de Vie d'un Pari

```javascript
// 1. Création
createBet() 
  → Vérifier quota (10 max)
  → Afficher loader
  → Bloquer fonds
  → Afficher timer annulation (30 min)

// 2. En attente
waitingForAcceptor()
  → Afficher nombre de viewers
  → WebSocket: écouter acceptation
  → Mise à jour timer annulation
  → Permettre annulation après 30 min

// 3. Acceptation
onAccepted()
  → Notification push
  → Mise à jour statut
  → Retirer bouton annuler
  → Afficher combat info

// 4. Résultat
onSettled()
  → Animation de gain/perte
  → Mise à jour solde avec animation
  → Proposer nouveau pari
```

---

## 🎯 Recommandations Finales

### 1. **Communication Proactive**
- Informer l'utilisateur AVANT qu'il ne clique
- Afficher des tooltips explicatifs
- Messages d'aide contextuels

### 2. **Feedback Visuel**
- Animations fluides
- Couleurs significatives
- Icônes claires

### 3. **Prévention**
- Valider côté client
- Désactiver actions impossibles
- Guides visuels (wizards)

### 4. **Performance**
- Optimistic UI (mise à jour immédiate)
- Rollback en cas d'erreur
- Cache intelligent

---

**Document créé le**: 2025-12-23  
**Version**: 1.0  
**Contact**: Équipe Backend Lamb Platform
