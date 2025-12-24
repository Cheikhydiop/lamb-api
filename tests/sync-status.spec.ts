
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const FRONTEND_URL = 'http://localhost:8080';
const API_URL = 'http://localhost:3000';

test.describe('Synchronisation Statut Combat Front/Back', () => {
    let adminContext;
    let observerContext;
    let fightId;

    test.beforeAll(async () => {
        // 1. Promouvoir test1@test.com en ADMIN
        const user = await prisma.user.update({
            where: { email: 'test1@test.com' },
            data: { role: 'ADMIN' }
        });
        const adminEmail = 'test1@test.com';
        const adminPassword = 'password123';

        // On crée un user observateur ou on utilise test2
        const observer = await prisma.user.upsert({
            where: { email: 'test2@test.com' },
            update: {},
            create: {
                email: 'test2@test.com',
                password: '$2b$10$EpIs@dGq@QwZ3r...hashed...',
                name: 'Observer Sync',
                role: 'BETTOR',
                phone: '770000001',
                isActive: true,
                isEmailVerified: true
            }
        });
        const observerEmail = 'test2@test.com';

        // 2. Créer un combat SCHEDULED via Prisma directement
        const fighterA = await prisma.fighter.findFirst();
        const fighterB = await prisma.fighter.findFirst({ where: { id: { not: fighterA.id } } });
        const dayEvent = await prisma.dayEvent.findFirst();

        const fight = await prisma.fight.create({
            data: {
                title: 'Combat Sync Test',
                fighterAId: fighterA.id,
                fighterBId: fighterB.id,
                dayEventId: dayEvent.id,
                location: 'Test Location',
                scheduledAt: new Date(Date.now() + 3600000), // Dans 1h
                status: 'SCHEDULED',
                oddsA: 1.5,
                oddsB: 2.5
            }
        });
        fightId = fight.id;
        console.log(`🥊 Combat de test créé: ${fight.id}`);
    });

    test.afterAll(async () => {
        // Nettoyage
        if (fightId) await prisma.fight.delete({ where: { id: fightId } }).catch(() => { });
        await prisma.$disconnect();
    });

    test('Doit synchroniser le changement de statut (Démarrer -> ONGOING)', async ({ browser }) => {
        // Contexte Admin
        adminContext = await browser.newContext();
        const pageAdmin = await adminContext.newPage();

        // Contexte Observateur (pour vérifier le temps réel)
        observerContext = await browser.newContext();
        const pageObserver = await observerContext.newPage();

        // 1. Login Admin
        await pageAdmin.goto(`${FRONTEND_URL}/login`);
        await pageAdmin.fill('input[type="email"]', 'test1@test.com');
        await pageAdmin.fill('input[type="password"]', 'password123');
        await pageAdmin.click('button[type="submit"]');
        // Attendre que la navigation se fasse, peu importe la destination initiale
        await pageAdmin.waitForLoadState('networkidle');

        // 2. Login Observateur et Go to Fights
        await pageObserver.goto(`${FRONTEND_URL}/login`);
        await pageObserver.fill('input[type="email"]', 'test2@test.com');
        await pageObserver.fill('input[type="password"]', 'password123');
        await pageObserver.click('button[type="submit"]');
        await pageObserver.goto(`${FRONTEND_URL}/fights`);

        // Vérifier que le combat est "Programmé" pour l'observateur
        await expect(pageObserver.locator(`text=Combat Sync Test`)).toBeVisible();
        // Le badge devrait être "Programmé" ou style par défaut

        // 3. Admin va sur la page d'administration des combats
        await pageAdmin.goto(`${FRONTEND_URL}/admin/fights?tab=scheduled`);

        // Trouver la ligne du combat
        // Note: l'interface admin liste les combats. On cherche le bouton "Démarrer" associé.
        // Simplification : on cherche le texte du combat et le bouton Démarrer DANS le même conteneur
        const fightCard = pageAdmin.locator('.bg-card', { hasText: 'Combat Sync Test' });
        await expect(fightCard).toBeVisible();

        const startButton = fightCard.locator('button', { hasText: 'Démarrer' });
        await expect(startButton).toBeVisible();

        // 4. ACTION : Cliquer sur Démarrer
        console.log('🎬 Admin clique sur Démarrer...');
        await startButton.click();

        // Attendre que l'action soit traitée (Toast ou changement UI)
        await expect(pageAdmin.locator('.bg-orange-500', { hasText: 'En cours' })).toBeVisible({ timeout: 5000 });
        console.log('✅ UI Admin mise à jour : En cours');

        // 5. VÉRIFICATION BACKEND
        const updatedFight = await prisma.fight.findUnique({ where: { id: fightId } });
        expect(updatedFight.status).toBe('ONGOING');
        console.log('✅ DB Backend mise à jour : ONGOING');

        // 6. VÉRIFICATION FRONTEND OBSERVER (Temps réel)
        // Sans recharger, l'observateur doit voir le statut changer
        // On cherche un indicateur visuel de "En cours" ou "Direct" sur la page publique
        console.log('👀 Vérification Observateur (WebSocket)...');
        await expect(pageObserver.locator('text=En cours').or(pageObserver.locator('.bg-red-600'))).toBeVisible({ timeout: 10000 });
        console.log('✅ UI Observateur mise à jour en temps réel !');
    });
});
