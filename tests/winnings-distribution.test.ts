import { PrismaClient, Winner, BetStatus, FighterChoice } from '@prisma/client';
import { WinningsDistributionService } from '../src/services/WinningsDistributionService';
import { NotificationService } from '../src/services/NotificationService';

// Couleurs pour console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(color: string, message: string) {
    console.log(`${color}${message}${colors.reset}`);
}

function logTest(name: string) {
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}TEST: ${name}${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

function logSuccess(message: string) {
    log(colors.green, `✓ ${message}`);
}

function logError(message: string) {
    log(colors.red, `✗ ${message}`);
}

function logInfo(message: string) {
    log(colors.yellow, `ℹ ${message}`);
}

// Helper pour créer des paris de test
function createMockBet(
    id: string,
    userId: string,
    amount: number,
    chosenFighter: FighterChoice,
    fightId: string
): any {
    return {
        id,
        userId,
        amount: BigInt(amount),
        chosenFighter,
        fightId,
        status: 'ACCEPTED' as BetStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
        potentialWin: null,
        actualWin: null,
        odds: null,
        creatorId: userId,
        acceptorId: null,
        taggedUserId: null,
        isTagged: false,
        expiresAt: null,
        acceptedAt: new Date(),
        cancelledAt: null,
        settledAt: null,
        canCancelUntil: null,
    };
}

async function runTests() {
    const prisma = new PrismaClient();
    // Mock WebSocketService for testing
    const mockWebSocketService = {
        isInitialized: () => false,
        broadcastNotification: () => Promise.resolve()
    } as any;
    const notificationService = new NotificationService(prisma, mockWebSocketService);
    const distributionService = new WinningsDistributionService(prisma, notificationService);

    let totalTests = 0;
    let passedTests = 0;

    try {
        // ========================================
        // TEST 1: Victoire Simple
        // ========================================
        logTest('Victoire Simple - 2 gagnants, 2 perdants');
        totalTests++;

        const bets1 = [
            createMockBet('bet1', 'user1', 10000, 'A', 'fight1'), // Gagnant
            createMockBet('bet2', 'user2', 15000, 'A', 'fight1'), // Gagnant
            createMockBet('bet3', 'user3', 20000, 'B', 'fight1'), // Perdant
            createMockBet('bet4', 'user4', 5000, 'B', 'fight1'),  // Perdant
        ];

        const result1 = (distributionService as any).calculateWinnings(bets1, 'A' as Winner);

        logInfo(`Total pot: ${Number(result1.totalPot).toLocaleString()} FCFA`);
        logInfo(`Commission (5%): ${Number(result1.commission).toLocaleString()} FCFA`);
        logInfo(`Distribuable: ${Number(result1.distributedAmount).toLocaleString()} FCFA`);

        // Vérifications
        const expectedTotalPot = BigInt(50000);
        const expectedCommission = BigInt(2500); // 5% de 50000
        const expectedDistributed = BigInt(47500);

        if (result1.totalPot === expectedTotalPot) {
            logSuccess(`Total pot correct: ${Number(expectedTotalPot).toLocaleString()} FCFA`);
        } else {
            logError(`Total pot incorrect. Attendu: ${Number(expectedTotalPot)}, Reçu: ${Number(result1.totalPot)}`);
        }

        if (result1.commission === expectedCommission) {
            logSuccess(`Commission correcte: ${Number(expectedCommission).toLocaleString()} FCFA`);
        } else {
            logError(`Commission incorrecte. Attendu: ${Number(expectedCommission)}, Reçu: ${Number(result1.commission)}`);
        }

        // Vérifier gains individuels
        const user1Gain = result1.processedBets.find((b: any) => b.userId === 'user1')?.winAmount;
        const user2Gain = result1.processedBets.find((b: any) => b.userId === 'user2')?.winAmount;

        const expectedUser1 = BigInt(19000); // (10000/25000) * 47500
        const expectedUser2 = BigInt(28500); // (15000/25000) * 47500

        if (user1Gain === expectedUser1) {
            logSuccess(`User1 gain correct: ${Number(expectedUser1).toLocaleString()} FCFA`);
        } else {
            logError(`User1 gain incorrect. Attendu: ${Number(expectedUser1)}, Reçu: ${Number(user1Gain)}`);
        }

        if (user2Gain === expectedUser2) {
            logSuccess(`User2 gain correct: ${Number(expectedUser2).toLocaleString()} FCFA`);
            passedTests++;
        } else {
            logError(`User2 gain incorrect. Attendu: ${Number(expectedUser2)}, Reçu: ${Number(user2Gain)}`);
        }

        // ========================================
        // TEST 2: Match Nul
        // ========================================
        logTest('Match Nul - Remboursement 97.5%');
        totalTests++;

        const bets2 = [
            createMockBet('bet5', 'user1', 10000, 'A', 'fight2'),
            createMockBet('bet6', 'user2', 20000, 'B', 'fight2'),
        ];

        const result2 = (distributionService as any).calculateWinnings(bets2, 'DRAW' as Winner);

        logInfo(`Total pot: ${Number(result2.totalPot).toLocaleString()} FCFA`);
        logInfo(`Commission (2.5%): ${Number(result2.commission).toLocaleString()} FCFA`);

        const expectedTotalPot2 = BigInt(30000);
        const expectedCommission2 = BigInt(750); // 2.5% de 30000
        const user1Refund = result2.processedBets.find((b: any) => b.userId === 'user1')?.winAmount;
        const user2Refund = result2.processedBets.find((b: any) => b.userId === 'user2')?.winAmount;

        const expectedUser1Refund = BigInt(9750);  // 10000 * 97.5%
        const expectedUser2Refund = BigInt(19500); // 20000 * 97.5%

        if (result2.totalPot === expectedTotalPot2) {
            logSuccess(`Total pot correct: ${Number(expectedTotalPot2).toLocaleString()} FCFA`);
        }

        if (result2.commission === expectedCommission2) {
            logSuccess(`Commission correcte: ${Number(expectedCommission2).toLocaleString()} FCFA`);
        }

        if (user1Refund === expectedUser1Refund) {
            logSuccess(`User1 remboursement correct: ${Number(expectedUser1Refund).toLocaleString()} FCFA`);
        }

        if (user2Refund === expectedUser2Refund) {
            logSuccess(`User2 remboursement correct: ${Number(expectedUser2Refund).toLocaleString()} FCFA`);
            passedTests++;
        }

        // ========================================
        // TEST 3: Victoire Unanime
        // ========================================
        logTest('Victoire Unanime - Tous parient sur le gagnant');
        totalTests++;

        const bets3 = [
            createMockBet('bet7', 'user1', 10000, 'A', 'fight3'),
            createMockBet('bet8', 'user2', 15000, 'A', 'fight3'),
            createMockBet('bet9', 'user3', 25000, 'A', 'fight3'),
        ];

        const result3 = (distributionService as any).calculateWinnings(bets3, 'A' as Winner);

        logInfo(`Total pot: ${Number(result3.totalPot).toLocaleString()} FCFA`);
        logInfo(`Commission (5%): ${Number(result3.commission).toLocaleString()} FCFA`);
        logInfo(`Distribuable: ${Number(result3.distributedAmount).toLocaleString()} FCFA`);

        const expectedTotalPot3 = BigInt(50000);
        const expectedCommission3 = BigInt(2500);
        const expectedDistributed3 = BigInt(47500);

        // Chaque gagnant récupère sa part proportionnelle
        const user1Gain3 = result3.processedBets.find((b: any) => b.userId === 'user1')?.winAmount;
        const user2Gain3 = result3.processedBets.find((b: any) => b.userId === 'user2')?.winAmount;
        const user3Gain3 = result3.processedBets.find((b: any) => b.userId === 'user3')?.winAmount;

        const expectedUser1Gain3 = BigInt(9500);  // (10000/50000) * 47500
        const expectedUser2Gain3 = BigInt(14250); // (15000/50000) * 47500
        const expectedUser3Gain3 = BigInt(23750); // (25000/50000) * 47500

        if (user1Gain3 === expectedUser1Gain3 && user2Gain3 === expectedUser2Gain3 && user3Gain3 === expectedUser3Gain3) {
            logSuccess('Tous les gains proportionnels sont corrects');
            passedTests++;
        } else {
            logError('Erreur dans les gains proportionnels');
        }

        // ========================================
        // TEST 4: Edge Case - Personne ne parie sur le gagnant
        // ========================================
        logTest('Edge Case - Personne ne parie sur le gagnant');
        totalTests++;

        const bets4 = [
            createMockBet('bet10', 'user1', 10000, 'A', 'fight4'),
            createMockBet('bet11', 'user2', 15000, 'A', 'fight4'),
        ];

        const result4 = (distributionService as any).calculateWinnings(bets4, 'B' as Winner);

        logInfo(`Total pot: ${Number(result4.totalPot).toLocaleString()} FCFA`);
        logInfo(`Commission: ${Number(result4.commission).toLocaleString()} FCFA`);
        logInfo(`Gagnants: ${result4.winningBetsCount}`);
        logInfo(`Perdants: ${result4.losingBetsCount}`);

        if (result4.winningBetsCount === 0 && result4.losingBetsCount === 2) {
            logSuccess('Edge case géré correctement: 0 gagnants, toute la mise devient commission');
            passedTests++;
        } else {
            logError('Edge case mal géré');
        }

        // ========================================
        // TEST 5: Performance - Gros Volume
        // ========================================
        logTest('Performance - 1000 paris');
        totalTests++;

        const bets5 = [];
        for (let i = 0; i < 1000; i++) {
            const fighter = i % 2 === 0 ? 'A' : 'B';
            bets5.push(createMockBet(`bet_${i}`, `user_${i}`, 5000, fighter as FighterChoice, 'fight5'));
        }

        const startTime = Date.now();
        const result5 = (distributionService as any).calculateWinnings(bets5, 'A' as Winner);
        const duration = Date.now() - startTime;

        logInfo(`Nombre de paris: ${bets5.length}`);
        logInfo(`Temps de calcul: ${duration}ms`);
        logInfo(`Total pot: ${Number(result5.totalPot).toLocaleString()} FCFA`);

        if (duration < 1000) {
            logSuccess(`Performance excellente: ${duration}ms pour 1000 paris`);
            passedTests++;
        } else if (duration < 5000) {
            logSuccess(`Performance acceptable: ${duration}ms pour 1000 paris`);
            passedTests++;
        } else {
            logError(`Performance insuffisante: ${duration}ms pour 1000 paris`);
        }

        // ========================================
        // RÉSUMÉ
        // ========================================
        console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.blue}RÉSUMÉ DES TESTS${colors.reset}`);
        console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

        const successRate = ((passedTests / totalTests) * 100).toFixed(1);
        const color = passedTests === totalTests ? colors.green : colors.yellow;

        console.log(`${color}Tests réussis: ${passedTests}/${totalTests} (${successRate}%)${colors.reset}`);

        if (passedTests === totalTests) {
            logSuccess('Tous les tests sont passés ! ✨');
        } else {
            logError(`${totalTests - passedTests} test(s) ont échoué`);
        }

    } catch (error) {
        logError(`Erreur lors des tests: ${error}`);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter les tests
runTests().catch(console.error);
