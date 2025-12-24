import { test, expect } from '@playwright/test';

test('Test Temps Réel: Apparition instantanée d\'un pari', async ({ browser }) => {
    // Contexte 1 : Créateur de pari (Utilisateur A)
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    // Contexte 2 : Observateur (Utilisateur B)
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    const FRONTEND_URL = 'http://localhost:8080';

    console.log('🔵 [Observateur] Connexion et accès à la liste des paris...');
    await pageB.goto(`${FRONTEND_URL}/login`);
    await pageB.fill('input[type="email"]', 'test2@test.com'); // Note: il faut un user existant ou le créer
    await pageB.fill('input[type="password"]', 'password123');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL('**/');
    await pageB.goto(`${FRONTEND_URL}/available-bets`);

    // Compter les paris actuels (en comptant les boutons "Relever le défi")
    // Note: on utilise waiting pour être sûr que la page est chargée
    const betCardSelector = 'button:has-text("Relever le défi")';
    await pageB.waitForSelector('h1:has-text("Paris Disponibles")');
    // Petit délai pour être sûr que le fetch initial est fini
    await pageB.waitForTimeout(2000);
    const initialBetsCount = await pageB.locator(betCardSelector).count();
    console.log(`📊 Paris initiaux visibles : ${initialBetsCount}`);

    console.log('🟢 [Créateur] Création d\'un nouveau pari...');
    await pageA.goto(`${FRONTEND_URL}/login`);
    await pageA.fill('input[type="email"]', 'test1@test.com');
    await pageA.fill('input[type="password"]', 'password123');
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL('**/');

    // Naviguer vers un combat pour parier
    // Naviguer vers un combat pour parier
    await pageA.goto(`${FRONTEND_URL}/fights`);
    console.log('👀 [Créateur] Recherche d\'un combat...');

    // Attendre que la liste charge
    await pageA.waitForSelector('a[href^="/fights/"]', { timeout: 10000 });

    // Cliquer sur le premier combat disponible
    await pageA.locator('a[href^="/fights/"]').first().click();
    await pageA.waitForURL(/\/fights\/.+/);
    console.log('✅ [Créateur] Sur la page de détail du combat');

    // Cliquer sur le premier combattant pour le sélectionner (c'est ce qui active le bouton)
    // On cherche le bouton qui contient le nom du combattant A (souvent le premier dans la grille de sélection)
    await pageA.waitForSelector('button.border-2', { timeout: 5000 });
    const fighterAButton = pageA.locator('button.border-2').first();
    await fighterAButton.click();
    console.log('🥊 [Créateur] Combattant A sélectionné');

    // Remplir le formulaire de pari
    // Le champ input est de type number
    await pageA.fill('input[type="number"]', '5000');

    // Cliquer sur "Créer le pari"
    const submitBtn = pageA.locator('button', { hasText: 'Créer le pari' });
    await submitBtn.waitFor({ state: 'visible' });
    await submitBtn.click();
    console.log('🚀 [Créateur] Pari envoyé !');

    console.log('👀 [Observateur] Vérification de l\'apparition instantanée...');
    // On attend que le nouveau pari apparaisse chez B (sans reload)
    try {
        await expect(pageB.locator(betCardSelector)).toHaveCount(initialBetsCount + 1, { timeout: 10000 });
        console.log('✅ SUCCÈS : Le pari est apparu en temps réel chez l\'observateur !');
    } catch (e) {
        console.error('❌ ÉCHEC : Le pari n\'est pas apparu automatiquement (ou délai dépassé).');
        throw e;
    }
});
