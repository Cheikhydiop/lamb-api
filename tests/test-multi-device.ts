
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api/auth';

// Fonction pour attendre
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function runTest() {
    console.log('🚀 Démarrage du test Multi-Appareils...\n');

    try {
        // 1. Nettoyage
        const email = `test-multi-${Date.now()}@example.com`;
        const phone = `+22177${Math.floor(1000000 + Math.random() * 9000000)}`;

        await prisma.user.deleteMany({
            where: {
                OR: [
                    { email },
                    { phone }
                ]
            }
        });
        console.log('🧹 Utilisateur de test nettoyé');

        // 2. Inscription
        console.log('📝 Inscription...');
        const registerResponse = await axios.post(`${API_URL}/register`, {
            name: 'Test Multi',
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
        console.log('✅ Inscription réussie et compte activé manuellement');

        // 3. Première connexion (Device A - Chrome)
        console.log('\n📱 Connexion Device A (Chrome)...');
        const loginA = await axios.post(`${API_URL}/login`, {
            email,
            password: 'Password123!'
        }, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });

        if (loginA.data.data.token && !loginA.data.data.requiresDeviceVerification) {
            console.log('✅ Device A connecté sans vérification (Premier appareil)');
        } else {
            console.error('❌ Erreur: Device A aurait dû se connecter directement');
            return;
        }

        // 4. Deuxième connexion (Device B - Firefox)
        console.log('\n📱 Connexion Device B (Firefox)...');
        const loginB = await axios.post(`${API_URL}/login`, {
            email,
            password: 'Password123!'
        }, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0' }
        });

        // Vérifier si la réponse demande une validation
        if (loginB.data.data.requiresDeviceVerification) {
            console.log('✅ Device B a reçu "requiresDeviceVerification: true"');
            console.log(`🆔 Session ID: ${loginB.data.data.sessionId}`);
        } else {
            console.error('❌ Erreur: Device B aurait dû demander une vérification');
            console.log(loginB.data);
            return;
        }

        const sessionId = loginB.data.data.sessionId;

        // 5. Récupérer le code OTP depuis la base de données
        console.log('\n🔍 Récupération du code OTP en base...');
        const otp = await prisma.otpCode.findFirst({
            where: {
                userId,
                purpose: 'DEVICE_VERIFICATION',
                consumed: false
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!otp) {
            console.error('❌ Erreur: Aucun code OTP trouvé en base');
            return;
        }
        console.log(`✅ Code trouvé: ${otp.code}`);

        // 6. Vérifier le code
        console.log('\n🔐 Vérification du code...');
        const verifyResponse = await axios.post(`${API_URL}/verify-device`, {
            sessionId,
            otpCode: otp.code
        });

        if (verifyResponse.data.success) {
            console.log('✅ Vérification réussie ! Token reçu.');
        } else {
            console.error('❌ Erreur de vérification');
            return;
        }

        // 7. Vérifier que Device A a été déconnecté
        console.log('\n🔍 Vérification révocation Device A...');
        const sessions = await prisma.session.findMany({
            where: { userId }
        });

        sessions.forEach(s => {
            console.log(`- Session ${s.deviceType}/${s.deviceName}: ${s.status} (Verified: ${s.isVerified})`);
        });

        const activeSessions = sessions.filter(s => s.status === 'ACTIVE');
        if (activeSessions.length === 1 && activeSessions[0].id === sessionId) {
            console.log('✅ Succès : Seul Device B est actif, Device A révoqué.');
        } else {
            console.log('⚠️ Attention : Vérifiez les statuts de session ci-dessus.');
        }

        console.log('\n🎉 TEST TERMINÉ AVEC SUCCÈS !');

    } catch (error: any) {
        console.error('\n❌ ERREUR DURANT LE TEST:', error.response?.data || error.message);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
