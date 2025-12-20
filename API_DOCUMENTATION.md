# Better API Documentation

## Overview
Better est une plateforme de paris sportifs spécialisée dans les combats (boxe, MMA, lutte). Cette API REST fournit tous les endpoints nécessaires pour gérer les utilisateurs, les paris, les combats, et les transactions financières.

## Base URL
```
http://localhost:3000/api
```

## Authentication
La plupart des endpoints requièrent une authentification JWT. Incluez le token dans l'en-tête `Authorization`:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Auth
#### Register
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+221771234567",
  "password": "securepassword"
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Verify OTP
```
POST /auth/verify-otp
Content-Type: application/json

{
  "phone": "+221771234567",
  "code": "123456",
  "purpose": "PHONE_VERIFICATION"
}
```

#### Refresh Token
```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Logout
```
POST /auth/logout
Authorization: Bearer <token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Users
#### Get Profile
```
GET /users/profile
Authorization: Bearer <token>
```

#### Update Profile
```
PATCH /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Name",
  "email": "newemail@example.com",
  "phone": "+221771234567"
}
```

#### Get User Stats
```
GET /users/stats
Authorization: Bearer <token>
```

#### Change Password
```
POST /users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "currentpassword",
  "newPassword": "newpassword",
  "confirmPassword": "newpassword"
}
```

### Fighters
#### Create Fighter (Admin)
```
POST /fighters
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Modou Lo",
  "nickname": "The Lion",
  "stable": "Gouye Gui",
  "birthDate": "1980-01-15",
  "nationality": "Senegal",
  "weight": 95.5,
  "height": 1.85
}
```

#### List Fighters
```
GET /fighters?limit=20&offset=0&isActive=true&nationality=Senegal
```

#### Get Fighter
```
GET /fighters/:fighterId
```

#### Update Fighter (Admin)
```
PATCH /fighters/:fighterId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "wins": 46,
  "losses": 5,
  "draws": 2
}
```

### Fights
#### Create Fight (Admin)
```
POST /fights
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Modou Lo vs Balla Gaye 2",
  "description": "Epic battle",
  "location": "Arène Nationale, Dakar",
  "scheduledAt": "2025-12-20T19:00:00Z",
  "fighterAId": "fighter1_id",
  "fighterBId": "fighter2_id"
}
```

#### List Fights
```
GET /fights?limit=20&offset=0&status=SCHEDULED
```

#### Get Fight
```
GET /fights/:fightId
```

#### Update Fight Status (Admin)
```
PATCH /fights/:fightId/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "ONGOING"
}
```

#### Validate Fight Result (Admin)
```
POST /fights/:fightId/validate-result
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "winner": "A",
  "victoryMethod": "KO",
  "notes": "Knockout in round 3"
}
```

### Bets
#### Create Bet
```
POST /bets
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5000,
  "chosenFighter": "A",
  "fightId": "fight_id",
  "taggedUserId": "optional_user_id"
}
```

#### Accept Bet
```
POST /bets/:betId/accept
Authorization: Bearer <token>
```

#### Cancel Bet
```
POST /bets/:betId/cancel
Authorization: Bearer <token>
```

#### List Bets
```
GET /bets?limit=20&offset=0&status=PENDING&fightId=fight_id
```

#### Get Bet
```
GET /bets/:betId
```

### Transactions
#### Create Transaction
```
POST /transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "TOKEN_PURCHASE",
  "amount": 10000,
  "provider": "WAVE"
}
```

#### Withdrawal
```
POST /transactions/withdrawal
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5000,
  "provider": "WAVE",
  "phoneNumber": "+221771234567"
}
```

#### Confirm Transaction (Admin)
```
POST /transactions/:transactionId/confirm
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "externalRef": "external_reference_123",
  "status": "CONFIRMED"
}
```

#### List Transactions
```
GET /transactions?limit=20&offset=0&status=CONFIRMED&type=TOKEN_PURCHASE
Authorization: Bearer <token>
```

#### Get Wallet Balance
```
GET /transactions/wallet/balance
Authorization: Bearer <token>
```

### Notifications
#### List Notifications
```
GET /notifications?limit=20&offset=0
Authorization: Bearer <token>
```

#### Get Unread Notifications
```
GET /notifications/unread
Authorization: Bearer <token>
```

#### Get Unread Count
```
GET /notifications/unread/count
Authorization: Bearer <token>
```

#### Mark as Read
```
PATCH /notifications/:notificationId/read
Authorization: Bearer <token>
```

#### Mark All as Read
```
PATCH /notifications/read-all
Authorization: Bearer <token>
```

#### Delete Notification
```
DELETE /notifications/:notificationId
Authorization: Bearer <token>
```

## Error Response Format
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "path": "field_name",
      "message": "Error details"
    }
  ]
}
```

## Success Response Format
```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

## Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting
- General endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes (on success)

## WebSocket Events
Connect to the WebSocket server at `ws://localhost:3000` with authentication:
```javascript
const socket = io('http://localhost:3000', {
  auth: { userId: 'your_user_id' }
});

// Subscribe to fight updates
socket.emit('subscribe:fight', 'fight_id');

// Listen for fight updates
socket.on('fight:update', (data) => {
  console.log('Fight update:', data);
});

// Listen for fight results
socket.on('fight:result', (data) => {
  console.log('Fight result:', data);
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

## Environment Variables
See `.env.example` for all required environment variables.
