#!/bin/bash

# 🧪 Script de démarrage rapide avec WAVE MOCK activé
#
# Ce script configure automatiquement le mode mock et démarre le serveur

echo "🧪 Configuration du mode WAVE MOCK"
echo "=================================="

# Vérifier si .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env non trouvé"
    exit 1
fi

# Backup du .env existant
cp .env .env.backup
echo "✅ Backup .env créé (.env.backup)"

# Activer le mode mock dans .env
if grep -q "^WAVE_MOCK_MODE=" .env; then
    # Modifier la ligne existante
    sed -i 's/^WAVE_MOCK_MODE=.*/WAVE_MOCK_MODE=true/' .env
    echo "✅ WAVE_MOCK_MODE=true (mis à jour)"
else
    # Ajouter la ligne
    echo "" >> .env
    echo "# Wave Mock Mode" >> .env
    echo "WAVE_MOCK_MODE=true" >> .env
    echo "✅ WAVE_MOCK_MODE=true (ajouté)"
fi

# Ajouter les URLs de callback si elles n'existent pas
if ! grep -q "^WAVE_SUCCESS_URL=" .env; then
    echo "WAVE_SUCCESS_URL=http://localhost:3000/payment/success" >> .env
    echo "✅ WAVE_SUCCESS_URL configuré"
fi

if ! grep -q "^WAVE_ERROR_URL=" .env; then
    echo "WAVE_ERROR_URL=http://localhost:3000/payment/error" >> .env
    echo "✅ WAVE_ERROR_URL configuré"
fi

echo ""
echo "🎯 Configuration complète:"
echo "  → WAVE_MOCK_MODE=true"
echo "  → WAVE_SUCCESS_URL=http://localhost:3000/payment/success"
echo "  → WAVE_ERROR_URL=http://localhost:3000/payment/error"
echo ""
echo "🚀 Démarrage du serveur avec mode MOCK..."
echo ""

# Démarrer le serveur
npm run dev
