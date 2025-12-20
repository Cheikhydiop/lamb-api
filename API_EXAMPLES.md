# Exemples d'Utilisation de l'API Better

## Base

```bash
BASE_URL="http://localhost:3000/api"
```

## 1. Authentification

### Register
```bash
curl -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+221771234567",
    "password": "SecurePassword123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Registration successful. Please verify your OTP.",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+221771234567"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### Login
```bash
curl -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

### Verify OTP
```bash
curl -X POST $BASE_URL/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+221771234567",
    "code": "123456",
    "purpose": "PHONE_VERIFICATION"
  }'
```

### Refresh Token
```bash
curl -X POST $BASE_URL/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

### Logout
```bash
curl -X POST $BASE_URL/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

## 2. Users

### Get Profile
```bash
curl -X GET $BASE_URL/users/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Update Profile
```bash
curl -X PATCH $BASE_URL/users/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Updated",
    "email": "john.new@example.com",
    "phone": "+221771234567"
  }'
```

### Get User Stats
```bash
curl -X GET $BASE_URL/users/stats \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "totalBets": 5,
    "acceptedBets": 3,
    "totalTransactions": 8,
    "totalWinnings": 50000,
    "wallet": {
      "id": "wallet_id",
      "userId": "user_id",
      "balance": 120000,
      "lockedBalance": 10000
    }
  }
}
```

### Change Password
```bash
curl -X POST $BASE_URL/users/change-password \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "OldPassword123",
    "newPassword": "NewPassword456",
    "confirmPassword": "NewPassword456"
  }'
```

## 3. Fighters

### List Fighters
```bash
curl -X GET "$BASE_URL/fighters?limit=20&offset=0&isActive=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Get Fighter
```bash
curl -X GET $BASE_URL/fighters/fighter_id \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Create Fighter (Admin)
```bash
curl -X POST $BASE_URL/fighters \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Modou Lo",
    "nickname": "The Lion",
    "stable": "Gouye Gui",
    "birthDate": "1980-01-15T00:00:00Z",
    "nationality": "Senegal",
    "weight": 95.5,
    "height": 1.85
  }'
```

### Update Fighter (Admin)
```bash
curl -X PATCH $BASE_URL/fighters/fighter_id \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wins": 46,
    "losses": 5,
    "draws": 2
  }'
```

## 4. Fights

### List Fights
```bash
curl -X GET "$BASE_URL/fights?limit=20&offset=0&status=SCHEDULED" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Get Fight
```bash
curl -X GET $BASE_URL/fights/fight_id \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "fight_id",
    "title": "Modou Lo vs Balla Gaye 2",
    "description": "Epic battle",
    "location": "Arène Nationale, Dakar",
    "scheduledAt": "2025-12-20T19:00:00Z",
    "status": "SCHEDULED",
    "popularity": 1000,
    "fighterA": {
      "id": "fighter1",
      "name": "Modou Lo",
      "wins": 45,
      "losses": 5
    },
    "fighterB": {
      "id": "fighter2",
      "name": "Balla Gaye 2",
      "wins": 52,
      "losses": 3
    },
    "bets": [
      {
        "id": "bet_id",
        "amount": 5000,
        "chosenFighter": "A",
        "status": "ACCEPTED"
      }
    ]
  }
}
```

### Create Fight (Admin)
```bash
curl -X POST $BASE_URL/fights \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Modou Lo vs Balla Gaye 2",
    "description": "Epic battle",
    "location": "Arène Nationale, Dakar",
    "scheduledAt": "2025-12-20T19:00:00Z",
    "fighterAId": "fighter1",
    "fighterBId": "fighter2"
  }'
```

### Update Fight Status (Admin)
```bash
curl -X PATCH $BASE_URL/fights/fight_id/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ONGOING"
  }'
```

### Validate Fight Result (Admin)
```bash
curl -X POST $BASE_URL/fights/fight_id/validate-result \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "winner": "A",
    "victoryMethod": "KO",
    "notes": "Knockout in round 3"
  }'
```

## 5. Bets

### Create Bet
```bash
curl -X POST $BASE_URL/bets \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "chosenFighter": "A",
    "fightId": "fight_id",
    "taggedUserId": null
  }'
```

Response:
```json
{
  "success": true,
  "message": "Bet created successfully",
  "data": {
    "id": "bet_id",
    "amount": 5000,
    "chosenFighter": "A",
    "status": "PENDING",
    "createdAt": "2025-12-12T10:00:00Z",
    "creator": {
      "id": "user_id",
      "name": "John Doe"
    },
    "fight": {
      "id": "fight_id",
      "title": "Modou Lo vs Balla Gaye 2"
    }
  }
}
```

### Accept Bet
```bash
curl -X POST $BASE_URL/bets/bet_id/accept \
  -H "Authorization: Bearer $OTHER_USER_TOKEN" \
  -H "Content-Type: application/json"
```

### Cancel Bet
```bash
curl -X POST $BASE_URL/bets/bet_id/cancel \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### List Bets
```bash
curl -X GET "$BASE_URL/bets?status=ACCEPTED&fightId=fight_id&limit=20&offset=0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## 6. Transactions

### Create Transaction (Token Purchase)
```bash
curl -X POST $BASE_URL/transactions \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TOKEN_PURCHASE",
    "amount": 10000,
    "provider": "WAVE"
  }'
```

### Withdrawal
```bash
curl -X POST $BASE_URL/transactions/withdrawal \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "provider": "WAVE",
    "phoneNumber": "+221771234567"
  }'
```

### Confirm Transaction (Admin)
```bash
curl -X POST $BASE_URL/transactions/transaction_id/confirm \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "externalRef": "WAVE_REF_123456",
    "status": "CONFIRMED"
  }'
```

### Get Wallet Balance
```bash
curl -X GET $BASE_URL/transactions/wallet/balance \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "wallet_id",
    "userId": "user_id",
    "balance": 120000,
    "lockedBalance": 10000,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-12-12T10:00:00Z"
  }
}
```

### List Transactions
```bash
curl -X GET "$BASE_URL/transactions?status=CONFIRMED&type=TOKEN_PURCHASE&limit=20&offset=0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## 7. Notifications

### Get All Notifications
```bash
curl -X GET "$BASE_URL/notifications?limit=20&offset=0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Get Unread Notifications
```bash
curl -X GET $BASE_URL/notifications/unread \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Get Unread Count
```bash
curl -X GET $BASE_URL/notifications/unread/count \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

### Mark Notification as Read
```bash
curl -X PATCH $BASE_URL/notifications/notification_id/read \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### Mark All as Read
```bash
curl -X PATCH $BASE_URL/notifications/read-all \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

## Variables d'Environnement pour cURL

```bash
# Setup
export BASE_URL="http://localhost:3000/api"
export ACCESS_TOKEN="your_access_token_here"
export ADMIN_TOKEN="admin_access_token_here"

# Puis utiliser:
curl -X GET $BASE_URL/users/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Utiliser Postman

1. Importer les endpoints
2. Créer des variables:
   - `baseUrl` = `http://localhost:3000/api`
   - `accessToken` = Token JWT
   - `adminToken` = Admin JWT
3. Utiliser `{{variable}}` dans les requêtes

## Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-12T10:00:00.000Z"
}
```

## Erreurs Courantes

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Missing authorization token"
}
```
→ Ajouter header `Authorization: Bearer $TOKEN`

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "path": "email",
      "message": "Invalid email"
    }
  ]
}
```
→ Vérifier les données envoyées

### 403 Forbidden
```json
{
  "success": false,
  "message": "Admin access required"
}
```
→ Utiliser un token admin

### 404 Not Found
```json
{
  "success": false,
  "message": "Route not found"
}
```
→ Vérifier l'URL et la méthode HTTP

## Flux Complet d'Utilisation

```bash
# 1. Register
curl -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{...}'

# 2. Verify OTP
curl -X POST $BASE_URL/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{...}'

# 3. Login
curl -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{...}' > response.json

# 4. Extract token
export ACCESS_TOKEN=$(jq -r '.data.tokens.accessToken' response.json)

# 5. Get profile
curl -X GET $BASE_URL/users/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 6. Create bet
curl -X POST $BASE_URL/bets \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'

# 7. View transactions
curl -X GET $BASE_URL/transactions \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Liens Utiles

- Postman Collection: À créer
- OpenAPI/Swagger: À générer
- API Tests: À implémenter
