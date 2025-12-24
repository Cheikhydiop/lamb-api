# 🔧 Correction Bug Notifications Backend

## 🔴 Erreur identifiée

```
SyntaxError: "[object Object]" is not valid JSON
at JSON.parse (<anonymous>)
at /workspace/dist/services/NotificationService.js:103:106
```

### Erreur complète
```
error: Error fetching notifications "[object Object]" is not valid JSON
GET /api/notifications/
```

---

## 🎯 Cause du problème

### Code problématique (NotificationService.ts)

**Ligne 93 et 110** :
```typescript
// ❌ AVANT (INCORRECT)
return notifications.map(n => ({
  ...n,
  data: n.data ? JSON.parse(n.data as string) : null  // Erreur !
}));
```

### Pourquoi c'est une erreur ?

**Prisma retourne déjà les champs `Json` comme objets JavaScript**, pas comme chaînes JSON.

Quand on fait `JSON.parse()` sur un objet :
```typescript
const obj = { foo: 'bar' };
JSON.parse(obj);  // ❌ "[object Object]" is not valid JSON
```

---

## ✅ Solution appliquée

### Code corrigé

```typescript
// ✅ APRÈS (CORRECT)
// Prisma already returns Json fields as objects, no need to parse
return notifications.map(n => ({
  ...n,
  data: n.data || null  // Pas de JSON.parse !
}));
```

### Fichiers modifiés

**`lamb/src/services/NotificationService.ts`**
- Ligne 90-94 : `getNotifications()`
- Ligne 108-111 : `getUnreadNotifications()`

---

## 📝 Explication technique

### Type Prisma `Json`

```prisma
model Notification {
  id        String   @id @default(cuid())
  data      Json?    // Type Json de Prisma
  ...
}
```

### Comportement Prisma

Quand Prisma récupère un champ `Json` :
```typescript
const notification = await prisma.notification.findFirst();
console.log(typeof notification.data);  // "object" (déjà parsé !)
```

**Prisma fait automatiquement** :
1. Récupère la chaîne JSON de la base de données
2. Parse avec `JSON.parse()` automatiquement
3. Retourne l'objet JavaScript

### Ce qu'on faisait (incorrect)

```typescript
// Base de données : '{"key":"value"}'
// Prisma récupère → déjà parsé → { key: "value" }
// On faisait JSON.parse({ key: "value" }) ❌
// Erreur: "[object Object]" is not valid JSON
```

### Ce qu'on fait maintenant (correct)

```typescript
// Base de données : '{"key":"value"}'
// Prisma récupère → déjà parsé → { key: "value" }
// On retourne directement { key: "value" } ✅
```

---

## 🔄 Impact

### Avant la correction
- ❌ Erreur 500 sur `GET /api/notifications/`
- ❌ Notifications ne se chargeaient pas
- ❌ Badge de compteur ne fonctionnait pas

### Après la correction
- ✅ Notifications se chargent correctement
- ✅ Objet `data` est correctement typé
- ✅ Pas de parsing inutile
- ✅ Performance légèrement améliorée

---

## 🧪 Vérification

### Test 1 : Récupérer notifications
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/notifications/
```

**Avant** : ❌ Erreur 500  
**Après** : ✅ Liste des notifications

### Test 2 : Récupérer non lues
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/notifications/unread
```

**Avant** : ❌ Erreur 500  
**Après** : ✅ Liste des notifications non lues

---

## 📊 Fichiers concernés

| Fichier | Ligne | Méthode | Changement |
|---------|-------|---------|------------|
| `NotificationService.ts` | 90-94 | `getNotifications()` | Suppression `JSON.parse()` |
| `NotificationService.ts` | 108-111 | `getUnreadNotifications()` | Suppression `JSON.parse()` |

---

## 🔐 Règles à retenir

### Avec Prisma et type `Json`

✅ **À FAIRE** :
```typescript
// Prisma fait le parsing automatiquement
const data = notification.data;  // Déjà un objet
```

❌ **À NE PAS FAIRE** :
```typescript
// Double parsing → erreur
const data = JSON.parse(notification.data);
```

### Quand parser manuellement

**Uniquement si** :
- Vous récupérez directement une chaîne JSON (pas via Prisma)
- Vous recevez du JSON d'une API externe
- Vous lisez un fichier JSON brut

---

## 📚 Documentation Prisma

> "Json fields are automatically parsed/serialized by Prisma Client"

Source: [Prisma Json Type Documentation](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#json)

---

**Date** : 2024-12-24  
**Type** : Bug fix  
**Criticité** : 🔴 Haute (bloquait tout le système de notifications)  
**Status** : ✅ **CORRIGÉ**
