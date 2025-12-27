#!/bin/bash

# 🧪 Script de test simple Wave Mock
# Teste directement les fonctionnalités mock sans authentification

BASE_URL="http://localhost:5000/api/mock-wave"

echo "🧪 TESTS WAVE MOCK - Sans authentification"
echo "=========================================="
echo ""

# Test 1: État du mock
echo "📊 Test 1: Vérifier l'état du mock"
echo "-----------------------------------"
curl -s "${BASE_URL}/status" | jq '{mode, healthy, balance, stats}'
echo ""
echo ""

# Test 2: Configurer le taux de succès
echo "⚙️ Test 2: Configurer le taux de succès à 100%"
echo "----------------------------------------------"
curl -s -X POST "${BASE_URL}/config" \
  -H "Content-Type: application/json" \
  -d '{"successRate": 100}' | jq
echo ""
echo ""

# Test 3: Créer une session checkout directement
echo "💳 Test 3: Créer une session checkout"
echo "--------------------------------------"
# On simule en créant directement via le WaveServiceMock
echo "ℹ️  Pour créer un vrai dépôt, utilisez l'interface web test-wave-mock.html"
echo "   ou connectez-vous pour obtenir un token JWT"
echo ""

# Test 4: Voir les stats
echo "📈 Test 4: Statistiques détaillées"
echo "----------------------------------"
curl -s "${BASE_URL}/status" | jq '{
  balance: .balance,
  stats: .stats,
  recentActivity: {
    sessions: (.recentSessions | length),
    payouts: (.recentPayouts | length)
  }
}'
echo ""
echo ""

# Test 5: Reset du mock
echo "🔄 Test 5: Réinitialiser le mock"
echo "--------------------------------"
read -p "Voulez-vous réinitialiser le mock? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    curl -s -X POST "${BASE_URL}/reset" | jq
    echo ""
    echo "✅ Mock réinitialisé!"
fi

echo ""
echo "✅ Tests terminés!"
echo ""
echo "📝 Pour tester avec authentification:"
echo "   1. Ouvrez test-wave-mock.html dans votre navigateur"
echo "   2. Ou créez un utilisateur et utilisez son token JWT"
echo ""
