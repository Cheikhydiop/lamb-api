#!/bin/bash

# 🔐 Script pour créer un utilisateur de test et obtenir un token
# Ensuite utiliser ce token pour tester les dépôts/retraits

echo "🔐 Création d'un utilisateur de test pour Wave Mock"
echo "===================================================="
echo ""

# 1. Créer un utilisateur de test unique
TIMESTAMP=$(date +%s)
EMAIL="wavetest${TIMESTAMP}@test.sn"
PHONE="+221771234567"
PASSWORD="Test1234"

echo "📝 Création de l'utilisateur:"
echo "   Email: $EMAIL"
echo "   Phone: $PHONE"
echo "   Password: $PASSWORD"
echo ""

# 2. Inscription
echo "⏳ Inscription en cours..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Wave Test User\",
    \"email\": \"$EMAIL\",
    \"phone\": \"$PHONE\",
    \"password\": \"$PASSWORD\"
  }")

echo "$REGISTER_RESPONSE" | jq '.'
echo ""

# Vérifier si inscription réussie
if echo "$REGISTER_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ Inscription réussie!"
    
    # 3. Se connecter pour obtenir le token
    echo ""
    echo "🔑 Connexion pour obtenir le token..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$EMAIL\",
        \"password\": \"$PASSWORD\"
      }")
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')
    
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo "✅ Token obtenu!"
        echo ""
        echo "🎯 Token JWT:"
        echo "$TOKEN"
        echo ""
        
        # Sauvegarder le token
        echo "$TOKEN" > /tmp/wave_test_token.txt
        echo "💾 Token sauvegardé dans /tmp/wave_test_token.txt"
        echo ""
        
        # 4. Tester un dépôt
        echo "💳 Test d'un dépôt de 1000 FCFA..."
        DEPOSIT_RESPONSE=$(curl -s -X POST http://localhost:5000/api/wallet/deposit \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d '{"amount": 1000}')
        
        echo "$DEPOSIT_RESPONSE" | jq '.'
        
        CHECKOUT_URL=$(echo "$DEPOSIT_RESPONSE" | jq -r '.checkoutUrl // empty')
        
        if [ -n "$CHECKOUT_URL" ] && [ "$CHECKOUT_URL" != "null" ]; then
            echo ""
            echo "✅ Session de dépôt créée!"
            echo "🌐 URL de paiement: $CHECKOUT_URL"
            echo ""
            echo "📝 Prochaines étapes:"
            echo "   1. Ouvrez cette URL dans votre navigateur:"
            echo "      $CHECKOUT_URL"
            echo "   2. Cliquez sur 'Payer maintenant'"
            echo "   3. Vous serez redirigé vers votre frontend"
            echo ""
            
            # Ouvrir automatiquement
            if command -v xdg-open > /dev/null 2>&1; then
                read -p "Voulez-vous ouvrir la page de paiement maintenant? (y/n) " -n 1 -r
                echo ""
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    xdg-open "$CHECKOUT_URL"
                fi
            fi
        else
            echo ""
            echo "❌ Erreur lors de la création du dépôt"
            echo "$DEPOSIT_RESPONSE" | jq '.'
        fi
        
        # 5. Tester un retrait
        echo ""
        echo "💸 Test d'un retrait de 500 FCFA..."
        WITHDRAWAL_RESPONSE=$(curl -s -X POST http://localhost:5000/api/wallet/withdrawal \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d '{"amount": 500}')
        
        echo "$WITHDRAWAL_RESPONSE" | jq '.'
        
    else
        echo "❌ Échec de la connexion"
        echo "$LOGIN_RESPONSE" | jq '.'
    fi
else
    echo "❌ Échec de l'inscription"
    echo "$REGISTER_RESPONSE" | jq '.'
    echo ""
    echo "💡 Astuce: Utilisez l'interface web test-wave-mock.html"
    echo "   Elle ne nécessite pas d'authentification pour tester le mock"
fi

echo ""
echo "🎯 Pour réutiliser le token:"
echo "   TOKEN=\$(cat /tmp/wave_test_token.txt)"
echo "   curl -X POST http://localhost:5000/api/wallet/deposit \\"
echo "     -H \"Authorization: Bearer \$TOKEN\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"amount\": 1000}'"
echo ""
