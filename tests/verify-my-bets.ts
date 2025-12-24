
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function runTest() {
    console.log('🚀 Démarrage du test My Pets...\n');

    try {
        // 1. Nettoyage
        const email = `test-bets-${Date.now()}@example.com`;
        const phone = `+22177${Math.floor(1000000 + Math.random() * 9000000)}`;

        // 2. Inscription
        console.log('📝 Inscription...');
        const registerResponse = await axios.post(`${API_URL}/auth/register`, {
            name: 'Test Bet User',
            email,
            password: 'Password123!',
            phone
        });
        const userId = registerResponse.data.data.user.id;

        // Activer le compte manuellement
        await prisma.user.update({
            where: { id: userId },
            data: { isEmailVerified: true, isActive: true }
        });
        console.log('✅ Inscription réussie et compte activé');

        // 3. Connexion
        console.log('\n📱 Connexion...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email,
            password: 'Password123!'
        });

        console.log('📦 Structure de la réponse login:', JSON.stringify(loginResponse.data, null, 2));
        const token = loginResponse.data.data?.token || loginResponse.data.data?.accessToken;
        console.log('✅ Connecté, token reçu:', token ? `${token.substring(0, 20)}...` : 'NULL');

        // 4. Appel de my-bets (Note: route is singular /bet in index.ts)
        console.log('\n🔍 Test de GET /api/bet/my-bets...');
        try {
            const myBetsResponse = await axios.get(`${API_URL}/bet/my-bets`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Réponse reçue:', myBetsResponse.status);
            // console.log('📦 Data:', myBetsResponse.data);

            if (myBetsResponse.status === 200) {
                console.log('🎉 SUCCÈS : La route /api/bet/my-bets fonctionne !');
            } else {
                console.error('❌ ECHEC : Status inattendu');
            }

        } catch (err: any) {
            console.error('❌ ERREUR lors de l\'appel à my-bets:', err.response ? `${err.response.status} ${JSON.stringify(err.response.data)}` : err.message);
        }

        // 5. Appel de notifications/unread-count
        console.log('\n🔍 Test de GET /api/notifications/unread-count...');
        try {
            const notifResponse = await axios.get(`${API_URL}/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Réponse reçue:', notifResponse.status);
            console.log('📦 Data:', notifResponse.data);

            if (notifResponse.status === 200) {
                console.log('🎉 SUCCÈS : La route alias unread-count fonctionne !');
            } else {
                console.error('❌ ECHEC : Status inattendu');
            }

        } catch (err: any) {
            console.error('❌ ERREUR lors de l\'appel à unread-count:', err.response?.data || err.message);
        }

    } catch (error: any) {
        console.error('\n❌ ERREUR GÉNÉRALE:', error.response?.data || error.message);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
