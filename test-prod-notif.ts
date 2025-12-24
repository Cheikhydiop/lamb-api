
import axios from 'axios';

const API_URL = 'https://jealous-giraffe-ndigueul-efe7a113.koyeb.app/api';

async function main() {
    try {
        console.log("🚀 TEST NOTIF PROD (Check if deployed)...");

        // 1. Login avec un user de prod (Docteur Diop ?)
        // Si le seed a marché en prod, "demooo@lamb.sn" / "Diop@1234" devrait exister.
        console.log("🔑 Connexion Prod...");
        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: 'demooo@lamb.sn',
                password: 'Diop@1234'
            });
            token = loginRes.data.data.token;
            console.log("✅ Connecté sur Koyeb !");
        } catch (e: any) {
            console.error("❌ Echec login:", e.response?.data?.message || e.message);
            console.log("Essai inscription temporaire...");
            // Fallback: Créer un user
            const stamp = Date.now();
            const regRes = await axios.post(`${API_URL}/auth/register`, {
                name: `TestUser ${stamp}`,
                email: `test${stamp}@lambji.sn`,
                password: 'Password123!',
                phone: `77${Math.floor(1000000 + Math.random() * 9000000)}`
            });
            if (regRes.data?.data?.token) {
                token = regRes.data.data.token;
                console.log("✅ User temporaire créé et connecté.");
            } else {
                // Try login newly created
                const login2 = await axios.post(`${API_URL}/auth/login`, {
                    email: `test${stamp}@lambji.sn`,
                    password: 'Password123!'
                });
                token = login2.data.data.token;
                console.log("✅ User temporaire connecté.");
            }
        }

        if (!token) {
            console.error("Impossible d'avoir un token sur la prod.");
            return;
        }

        // 2. Trouver un combat
        console.log("🥊 Recherche combat...");
        const eventsRes = await axios.get(`${API_URL}/day-events`);
        let fightId;
        if (eventsRes.data.data) {
            for (const ev of eventsRes.data.data) {
                if (ev.fights && ev.fights.length > 0) {
                    fightId = ev.fights[0].id;
                    break;
                }
            }
        }

        if (!fightId) {
            // Fallback fights endpoint
            const fightsRes = await axios.get(`${API_URL}/fight/upcoming`);
            if (fightsRes.data.data && fightsRes.data.data.length > 0) {
                fightId = fightsRes.data.data[0].id;
            }
        }

        if (!fightId) {
            console.error("❌ Pas de combat trouvé en prod.");
            return;
        }
        console.log(`Combat ID: ${fightId}`);

        // 3. Créer pari
        console.log("💰 Création pari sur Prod...");
        const betRes = await axios.post(`${API_URL}/bet`, {
            fightId: fightId,
            amount: 3000,
            chosenFighter: 'A'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log("✅ Pari créé sur PROD ! Status:", betRes.status);
        console.log("❓ Avez-vous reçu la notif ? (Si non, c'est que Koyeb n'a pas encore fini le déploiement du backend)");

    } catch (error: any) {
        console.error("❌ Erreur:", error.response?.data?.message || error.message);
    }
}

main();
