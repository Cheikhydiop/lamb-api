import { PrismaClient, Winner, BetStatus, FighterChoice, Prisma } from '@prisma/client';
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
    magenta: '\x1b[35m',
};

function log(color: string, message: string) {
    console.log(`${color}${message}${colors.reset}`);
}

function logTest(name: string) {
    console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}TEST: ${name}${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
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

function logSection(message: string) {
    log(colors.magenta, `\n▶ ${message}`);
}

// Test data IDs
const TEST_PREFIX = 'test_integration_';
let testUserIds: string[] = [];
let testFighterIds: string[] = [];
let testFightId: string;
let testBetIds: string[] = [];

async function runIntegrationTests() {
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
        // SETUP: Create Test Data
        // ========================================
        logTest('SETUP: Creating Test Data in Database');
        logSection('Creating test users with wallets');

        // Create 4 test users
        for (let i = 1; i <= 4; i++) {
            const user = await prisma.user.create({
                data: {
                    id: `${TEST_PREFIX}user_${i}`,
                    name: `Test User ${i}`,
                    phone: `${TEST_PREFIX}${i}@test.com`,
                    email: `${TEST_PREFIX}user${i}@test.com`,
                    password: 'hashed_password',
                    wallet: {
                        create: {
                            balance: BigInt(100000), // 100,000 FCFA initial balance
                        }
                    }
                }
            });
            testUserIds.push(user.id);
            logSuccess(`Created user: ${user.name} (${user.id})`);
        }

        logSection('Creating test fighters');

        // Create 2 test fighters
        const fighterA = await prisma.fighter.create({
            data: {
                id: `${TEST_PREFIX}fighter_a`,
                name: 'Test Fighter A',
                nickname: 'The Champion',
                stable: 'Test Stable A'
            }
        });
        testFighterIds.push(fighterA.id);
        logSuccess(`Created fighter: ${fighterA.name}`);

        const fighterB = await prisma.fighter.create({
            data: {
                id: `${TEST_PREFIX}fighter_b`,
                name: 'Test Fighter B',
                nickname: 'The Challenger',
                stable: 'Test Stable B'
            }
        });
        testFighterIds.push(fighterB.id);
        logSuccess(`Created fighter: ${fighterB.name}`);

        logSection('Creating test fight');

        // Create a test fight
        const fight = await prisma.fight.create({
            data: {
                id: `${TEST_PREFIX}fight_1`,
                title: 'Test Fight - Integration Test',
                location: 'Test Arena',
                scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
                fighterAId: fighterA.id,
                fighterBId: fighterB.id,
                status: 'SCHEDULED'
            }
        });
        testFightId = fight.id;
        logSuccess(`Created fight: ${fight.title}`);

        logSection('Creating test bets');

        // Create test bets
        // User 1: 10,000 on Fighter A
        const bet1 = await prisma.bet.create({
            data: {
                id: `${TEST_PREFIX}bet_1`,
                amount: new Prisma.Decimal(10000),
                chosenFighter: FighterChoice.A,
                status: BetStatus.ACCEPTED,
                creatorId: testUserIds[0],
                fightId: testFightId,
                acceptedAt: new Date()
            }
        });
        testBetIds.push(bet1.id);
        logSuccess(`Bet 1: User 1 → 10,000 FCFA on Fighter A`);

        // User 2: 15,000 on Fighter A
        const bet2 = await prisma.bet.create({
            data: {
                id: `${TEST_PREFIX}bet_2`,
                amount: new Prisma.Decimal(15000),
                chosenFighter: FighterChoice.A,
                status: BetStatus.ACCEPTED,
                creatorId: testUserIds[1],
                fightId: testFightId,
                acceptedAt: new Date()
            }
        });
        testBetIds.push(bet2.id);
        logSuccess(`Bet 2: User 2 → 15,000 FCFA on Fighter A`);

        // User 3: 20,000 on Fighter B
        const bet3 = await prisma.bet.create({
            data: {
                id: `${TEST_PREFIX}bet_3`,
                amount: new Prisma.Decimal(20000),
                chosenFighter: FighterChoice.B,
                status: BetStatus.ACCEPTED,
                creatorId: testUserIds[2],
                fightId: testFightId,
                acceptedAt: new Date()
            }
        });
        testBetIds.push(bet3.id);
        logSuccess(`Bet 3: User 3 → 20,000 FCFA on Fighter B`);

        // User 4: 5,000 on Fighter B
        const bet4 = await prisma.bet.create({
            data: {
                id: `${TEST_PREFIX}bet_4`,
                amount: new Prisma.Decimal(5000),
                chosenFighter: FighterChoice.B,
                status: BetStatus.ACCEPTED,
                creatorId: testUserIds[3],
                fightId: testFightId,
                acceptedAt: new Date()
            }
        });
        testBetIds.push(bet4.id);
        logSuccess(`Bet 4: User 4 → 5,000 FCFA on Fighter B`);

        // Deduct bet amounts from wallets
        for (let i = 0; i < testBetIds.length; i++) {
            const bet = await prisma.bet.findUnique({ where: { id: testBetIds[i] } });
            await prisma.wallet.update({
                where: { userId: testUserIds[i] },
                data: {
                    balance: { decrement: BigInt(bet!.amount.toString()) },
                    lockedBalance: { increment: BigInt(bet!.amount.toString()) }
                }
            });
        }

        logInfo(`Total pot: 50,000 FCFA`);
        logInfo(`Setup complete!`);

        // ========================================
        // TEST 1: Atomic Transaction - Winner A
        // ========================================
        logTest('TEST 1: Atomic Transaction - Fighter A Wins');
        totalTests++;

        logSection('Executing distribution');

        const result = await distributionService.distributeWinnings(testFightId, Winner.A);

        logInfo(`Distribution completed in ${result.duration}ms`);
        logInfo(`Total pot: ${Number(result.totalPot).toLocaleString()} FCFA`);
        logInfo(`Commission: ${Number(result.commission).toLocaleString()} FCFA`);
        logInfo(`Distributed: ${Number(result.distributedAmount).toLocaleString()} FCFA`);
        logInfo(`Winners: ${result.winningBetsCount}, Losers: ${result.losingBetsCount}`);

        logSection('Verifying bets updated');

        const updatedBets = await prisma.bet.findMany({
            where: { id: { in: testBetIds } },
            orderBy: { createdAt: 'asc' }
        });

        let betsCorrect = true;
        for (const bet of updatedBets) {
            const expectedStatus = bet.chosenFighter === FighterChoice.A ? BetStatus.WON : BetStatus.LOST;
            if (bet.status !== expectedStatus) {
                logError(`Bet ${bet.id} has wrong status: ${bet.status} (expected ${expectedStatus})`);
                betsCorrect = false;
            } else {
                logSuccess(`Bet ${bet.id}: ${bet.status} ✓`);
            }
        }

        logSection('Verifying wallets credited');

        const wallets = await prisma.wallet.findMany({
            where: { userId: { in: testUserIds } }
        });

        let walletsCorrect = true;
        for (let i = 0; i < wallets.length; i++) {
            const wallet = wallets[i];
            const bet = updatedBets[i];

            logInfo(`User ${i + 1} wallet balance: ${Number(wallet.balance).toLocaleString()} FCFA`);

            if (bet.status === BetStatus.WON && bet.actualWin) {
                const expectedBalance = BigInt(100000) - BigInt(bet.amount.toString()) + bet.actualWin;
                if (wallet.balance !== expectedBalance) {
                    logError(`User ${i + 1} wallet incorrect. Expected: ${Number(expectedBalance)}, Got: ${Number(wallet.balance)}`);
                    walletsCorrect = false;
                } else {
                    logSuccess(`User ${i + 1} wallet credited correctly with ${Number(bet.actualWin).toLocaleString()} FCFA`);
                }
            }
        }

        logSection('Verifying transactions created');

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: { in: testUserIds },
                type: { in: ['BET_WIN', 'BET_REFUND'] }
            }
        });

        const winTransactions = transactions.filter(t => t.type === 'BET_WIN');
        logInfo(`Found ${winTransactions.length} win transactions`);

        if (winTransactions.length === result.winningBetsCount) {
            logSuccess(`Correct number of transactions created`);
        } else {
            logError(`Expected ${result.winningBetsCount} transactions, found ${winTransactions.length}`);
        }

        logSection('Verifying commission recorded');

        const commissions = await prisma.commission.findMany({
            where: { fightId: testFightId }
        });

        if (commissions.length > 0) {
            const totalCommission = commissions.reduce((sum, c) => sum + c.amount, BigInt(0));
            logSuccess(`Commission recorded: ${Number(totalCommission).toLocaleString()} FCFA`);

            if (totalCommission === result.commission) {
                logSuccess(`Commission amount matches calculation`);
            } else {
                logError(`Commission mismatch. Expected: ${Number(result.commission)}, Got: ${Number(totalCommission)}`);
            }
        } else {
            logError(`No commission records found`);
        }

        logSection('Verifying fight status updated');

        const updatedFight = await prisma.fight.findUnique({
            where: { id: testFightId }
        });

        if (updatedFight?.distributionStatus === 'COMPLETED') {
            logSuccess(`Fight distribution status: COMPLETED ✓`);
        } else {
            logError(`Fight distribution status incorrect: ${updatedFight?.distributionStatus}`);
        }

        if (updatedFight?.winner === Winner.A) {
            logSuccess(`Fight winner recorded: A ✓`);
        } else {
            logError(`Fight winner incorrect: ${updatedFight?.winner}`);
        }

        if (betsCorrect && walletsCorrect && commissions.length > 0 && updatedFight?.distributionStatus === 'COMPLETED') {
            logSuccess('✅ Atomic transaction test PASSED');
            passedTests++;
        } else {
            logError('❌ Atomic transaction test FAILED');
        }

        // ========================================
        // TEST 2: Verify Notifications
        // ========================================
        logTest('TEST 2: Verify Notifications Sent');
        totalTests++;

        logSection('Checking notifications');

        const notifications = await prisma.notification.findMany({
            where: { userId: { in: testUserIds } },
            orderBy: { createdAt: 'desc' }
        });

        logInfo(`Found ${notifications.length} notifications`);

        let notificationsCorrect = true;
        for (const userId of testUserIds) {
            const userNotifications = notifications.filter(n => n.userId === userId);
            if (userNotifications.length > 0) {
                const notif = userNotifications[0];
                logSuccess(`User ${userId}: ${notif.type} - "${notif.title}"`);
            } else {
                logError(`No notification found for user ${userId}`);
                notificationsCorrect = false;
            }
        }

        if (notificationsCorrect && notifications.length >= testUserIds.length) {
            logSuccess('✅ Notifications test PASSED');
            passedTests++;
        } else {
            logError('❌ Notifications test FAILED');
        }

        // ========================================
        // SUMMARY
        // ========================================
        console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
        console.log(`${colors.blue}INTEGRATION TEST SUMMARY${colors.reset}`);
        console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);

        const successRate = ((passedTests / totalTests) * 100).toFixed(1);
        const color = passedTests === totalTests ? colors.green : colors.yellow;

        console.log(`${color}Tests passed: ${passedTests}/${totalTests} (${successRate}%)${colors.reset}`);

        if (passedTests === totalTests) {
            logSuccess('All integration tests passed! ✨');
        } else {
            logError(`${totalTests - passedTests} test(s) failed`);
        }

    } catch (error) {
        logError(`Error during integration tests: ${error}`);
        console.error(error);
    } finally {
        // ========================================
        // CLEANUP
        // ========================================
        logTest('CLEANUP: Removing Test Data');

        try {
            // Delete in reverse order of dependencies
            await prisma.notification.deleteMany({ where: { userId: { in: testUserIds } } });
            await prisma.commission.deleteMany({ where: { fightId: testFightId } });
            await prisma.transaction.deleteMany({ where: { userId: { in: testUserIds } } });
            await prisma.bet.deleteMany({ where: { id: { in: testBetIds } } });
            await prisma.fight.delete({ where: { id: testFightId } });
            await prisma.fighter.deleteMany({ where: { id: { in: testFighterIds } } });
            await prisma.wallet.deleteMany({ where: { userId: { in: testUserIds } } });
            await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });

            logSuccess('Test data cleaned up successfully');
        } catch (cleanupError) {
            logError(`Error during cleanup: ${cleanupError}`);
        }

        await prisma.$disconnect();
    }
}

// Run the integration tests
runIntegrationTests().catch(console.error);
