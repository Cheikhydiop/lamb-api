// prisma/seed.ts
import { PrismaClient, UserRole, BetStatus, FightStatus, EventStatus, FighterChoice } from '@prisma/client';
import bcrypt from 'bcrypt';
import { addDays, addHours, addMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // Nettoyer la base de données
  console.log('🧹 Nettoyage de la base de données...');
  await prisma.withdrawalRequest.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.fight.deleteMany();
  await prisma.fighter.deleteMany();
  await prisma.dayEvent.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Hash du mot de passe
  const hashedPassword = await bcrypt.hash('Diop@1234', 10);

  // ==================== UTILISATEURS ====================
  console.log('👥 Création des utilisateurs...');

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      phone: '770000000',
      email: 'superadmin@uadb.edu.sn',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isEmailVerified: true,
      isActive: true,
      wallet: {
        create: {
          balance: BigInt(1000000), // 1,000,000 FCFA
        },
      },
    },
  });

  const pape = await prisma.user.create({
    data: {
      name: 'Pape Diop',
      phone: '771234567',
      email: 'pape@uadb.edu.sn',
      password: hashedPassword,
      role: UserRole.BETTOR,
      isEmailVerified: true,
      isActive: true,
      wallet: {
        create: {
          balance: BigInt(500000), // 500,000 FCFA
        },
      },
    },
  });

  const modou = await prisma.user.create({
    data: {
      name: 'Modou Fall',
      phone: '772345678',
      email: 'modou@uadb.edu.sn',
      password: hashedPassword,
      role: UserRole.BETTOR,
      isEmailVerified: true,
      isActive: true,
      wallet: {
        create: {
          balance: BigInt(300000), // 300,000 FCFA
        },
      },
    },
  });

  const fatou = await prisma.user.create({
    data: {
      name: 'Fatou Sall',
      phone: '773456789',
      email: 'fatou@uadb.edu.sn',
      password: hashedPassword,
      role: UserRole.BETTOR,
      isEmailVerified: true,
      isActive: true,
      wallet: {
        create: {
          balance: BigInt(200000), // 200,000 FCFA
        },
      },
    },
  });

  console.log('✅ Utilisateurs créés');

  // ==================== LUTTEURS SÉNÉGALAIS ====================
  console.log('🥊 Création des lutteurs sénégalais...');

  const fighters = await Promise.all([
    // Légendes et champions actuels
    prisma.fighter.create({
      data: {
        name: 'Modou Lô',
        nickname: 'Le Roi des Arènes',
        stable: 'Écurie Fass',
        nationality: 'Senegal',
        weight: 95,
        height: 1.85,
        status: 'ACTIVE',
        totalFights: 45,
        wins: 38,
        losses: 5,
        draws: 2,
        knockouts: 25,
        popularity: 98,
        ranking: 1,
      },
    }),
    prisma.fighter.create({
      data: {
        name: 'Ama Baldé',
        nickname: 'Le Lion de Guédiawaye',
        stable: 'Écurie Lansar',
        nationality: 'Senegal',
        weight: 92,
        height: 1.83,
        status: 'ACTIVE',
        totalFights: 42,
        wins: 35,
        losses: 6,
        draws: 1,
        knockouts: 22,
        popularity: 95,
        ranking: 2,
      },
    }),
    prisma.fighter.create({
      data: {
        name: 'Balla Gaye 2',
        nickname: 'Le Tigre de Fass',
        stable: 'Écurie Fass',
        nationality: 'Senegal',
        weight: 98,
        height: 1.88,
        status: 'ACTIVE',
        totalFights: 38,
        wins: 32,
        losses: 5,
        draws: 1,
        knockouts: 28,
        popularity: 96,
        ranking: 3,
      },
    }),
    prisma.fighter.create({
      data: {
        name: 'Tapha Tine',
        nickname: 'Le Roc des Parcelles',
        stable: 'Écurie Parcelles Assainies',
        nationality: 'Senegal',
        weight: 100,
        height: 1.90,
        status: 'ACTIVE',
        totalFights: 35,
        wins: 28,
        losses: 6,
        draws: 1,
        knockouts: 20,
        popularity: 92,
        ranking: 4,
      },
    }),
    prisma.fighter.create({
      data: {
        name: 'Bombardier',
        nickname: 'Le Bombardier',
        stable: 'Écurie Mbour',
        nationality: 'Senegal',
        weight: 94,
        height: 1.84,
        status: 'ACTIVE',
        totalFights: 40,
        wins: 30,
        losses: 8,
        draws: 2,
        knockouts: 18,
        popularity: 88,
        ranking: 5,
      },
    }),
    prisma.fighter.create({
      data: {
        name: 'Eumeu Sène',
        nickname: 'Le Taureau de Pikine',
        stable: 'Écurie Pikine',
        nationality: 'Senegal',
        weight: 96,
        height: 1.86,
        status: 'ACTIVE',
        totalFights: 37,
        wins: 29,
        losses: 7,
        draws: 1,
        knockouts: 21,
        popularity: 90,
        ranking: 6,
      },
    }),
    prisma.fighter.create({
      data: {
        name: 'Gris Bordeaux',
        nickname: 'Le Tigre de Fass',
        stable: 'Écurie Fass',
        nationality: 'Senegal',
        weight: 93,
        height: 1.82,
        status: 'ACTIVE',
        totalFights: 44,
        wins: 36,
        losses: 7,
        draws: 1,
        knockouts: 24,
        popularity: 91,
        ranking: 7,
      },
    }),
    prisma.fighter.create({
      data: {
        name: 'Lac 2',
        nickname: 'Le Prince de Guédiawaye',
        stable: 'Écurie Guédiawaye',
        nationality: 'Senegal',
        weight: 91,
        height: 1.81,
        status: 'ACTIVE',
        totalFights: 33,
        wins: 25,
        losses: 7,
        draws: 1,
        knockouts: 16,
        popularity: 85,
        ranking: 8,
      },
    }),
    prisma.fighter.create({
      data: {
        name: 'Boy Niang 2',
        nickname: 'Le Lion de Guédiawaye',
        stable: 'Écurie Guédiawaye',
        nationality: 'Senegal',
        weight: 89,
        height: 1.79,
        status: 'ACTIVE',
        totalFights: 36,
        wins: 27,
        losses: 8,
        draws: 1,
        knockouts: 17,
        popularity: 83,
        ranking: 9,
      },
    }),
    prisma.fighter.create({
      data: {
        name: 'Siteu',
        nickname: 'Le Baol-Baol',
        stable: 'Écurie Baol',
        nationality: 'Senegal',
        weight: 97,
        height: 1.87,
        status: 'ACTIVE',
        totalFights: 32,
        wins: 24,
        losses: 7,
        draws: 1,
        knockouts: 19,
        popularity: 86,
        ranking: 10,
      },
    }),
  ]);

  console.log('✅ Lutteurs créés');

  // ==================== JOURNÉES DE LUTTE ====================
  console.log('📅 Création des journées de lutte...');

  const grandLamb = await prisma.dayEvent.create({
    data: {
      title: 'Grand Lamb de Dakar 2025',
      slug: 'grand-lamb-dakar-2025',
      description: 'Le plus grand événement de lutte de l\'année au Sénégal',
      date: addDays(new Date(), 7), // Dans 7 jours
      location: 'Arène Nationale',
      venue: 'Stade Demba Diop',
      capacity: 20000,
      ticketPrice: BigInt(5000),
      status: EventStatus.SCHEDULED,
      isFeatured: true,
      minBetAmount: BigInt(1000),
      maxBetAmount: BigInt(1000000),
      createdById: superAdmin.id,
    },
  });

  const tournoiThies = await prisma.dayEvent.create({
    data: {
      title: 'Tournoi de Thiès',
      slug: 'tournoi-thies-2025',
      description: 'Tournoi régional de lutte à Thiès',
      date: addDays(new Date(), 14), // Dans 14 jours
      location: 'Arène de Thiès',
      venue: 'Stade Caroline Faye',
      capacity: 10000,
      ticketPrice: BigInt(3000),
      status: EventStatus.SCHEDULED,
      isFeatured: false,
      minBetAmount: BigInt(500),
      maxBetAmount: BigInt(500000),
      createdById: superAdmin.id,
    },
  });

  console.log('✅ Journées créées');

  // ==================== COMBATS ====================
  console.log('⚔️ Création des combats...');

  const fight1 = await prisma.fight.create({
    data: {
      title: 'Modou Lô vs Ama Baldé',
      description: 'Combat de l\'année - Le choc des titans',
      location: 'Arène Nationale',
      scheduledAt: addDays(new Date(), 7),
      status: FightStatus.SCHEDULED,
      fighterAId: fighters[0].id, // Modou Lô
      fighterBId: fighters[1].id, // Ama Baldé
      dayEventId: grandLamb.id,
      oddsA: 1.8,
      oddsB: 2.0,
      order: 1,
      popularity: 100,
    },
  });

  const fight2 = await prisma.fight.create({
    data: {
      title: 'Balla Gaye 2 vs Tapha Tine',
      description: 'Le combat des géants',
      location: 'Arène Nationale',
      scheduledAt: addDays(new Date(), 7),
      status: FightStatus.SCHEDULED,
      fighterAId: fighters[2].id, // Balla Gaye 2
      fighterBId: fighters[3].id, // Tapha Tine
      dayEventId: grandLamb.id,
      oddsA: 1.9,
      oddsB: 1.9,
      order: 2,
      popularity: 95,
    },
  });

  const fight3 = await prisma.fight.create({
    data: {
      title: 'Bombardier vs Eumeu Sène',
      description: 'Duel explosif',
      location: 'Arène Nationale',
      scheduledAt: addDays(new Date(), 7),
      status: FightStatus.SCHEDULED,
      fighterAId: fighters[4].id, // Bombardier
      fighterBId: fighters[5].id, // Eumeu Sène
      dayEventId: grandLamb.id,
      oddsA: 2.1,
      oddsB: 1.7,
      order: 3,
      popularity: 88,
    },
  });

  const fight4 = await prisma.fight.create({
    data: {
      title: 'Gris Bordeaux vs Lac 2',
      description: 'Combat technique',
      location: 'Arène de Thiès',
      scheduledAt: addDays(new Date(), 14),
      status: FightStatus.SCHEDULED,
      fighterAId: fighters[6].id, // Gris Bordeaux
      fighterBId: fighters[7].id, // Lac 2
      dayEventId: tournoiThies.id,
      oddsA: 1.6,
      oddsB: 2.2,
      order: 1,
      popularity: 82,
    },
  });

  // 5. COMBAT EN COURS (Pour tester la validation)
  const ongoingFight = await prisma.fight.create({
    data: {
      title: 'Siteu vs Lac 2 (LIVE)',
      description: 'Combat en cours de validation',
      location: 'Arène Nationale',
      scheduledAt: addHours(new Date(), -1),
      startedAt: addHours(new Date(), -1),
      status: FightStatus.ONGOING,
      fighterAId: fighters[9].id, // Siteu
      fighterBId: fighters[7].id, // Lac 2
      dayEventId: grandLamb.id,
      oddsA: 1.5,
      oddsB: 2.5,
      order: 4,
      popularity: 90,
    },
  });

  // 6. COMBAT TERMINÉ (Pour l'historique)
  const finishedFight = await prisma.fight.create({
    data: {
      title: 'Eumeu Sène vs Boy Niang 2',
      description: 'Combat historique',
      location: 'Arène Nationale',
      scheduledAt: addDays(new Date(), -30),
      startedAt: addDays(new Date(), -30),
      endedAt: addDays(new Date(), -30),
      status: FightStatus.FINISHED,
      fighterAId: fighters[5].id, // Eumeu Sène
      fighterBId: fighters[8].id, // Boy Niang 2
      dayEventId: grandLamb.id,
      oddsA: 1.9,
      oddsB: 1.9,
      result: {
        create: {
          winner: 'A',
          victoryMethod: 'KO',
          notes: 'Victoire éclatante de Eumeu Sène',
          adminId: superAdmin.id,
        }
      }
    },
  });

  // 7. COMBAT TERMINÉ MAIS NON VALIDÉ (Pour tester le flux de validation)
  const finishedUnvalidatedFight = await prisma.fight.create({
    data: {
      title: 'Balla Gaye 2 vs Tapha Tine (TERMINE)',
      description: 'En attente de validation du résultat',
      location: 'Arène Nationale',
      scheduledAt: addHours(new Date(), -2),
      startedAt: addHours(new Date(), -2),
      endedAt: addHours(new Date(), -1.5),
      status: FightStatus.FINISHED,
      fighterAId: fighters[2].id, // Balla Gaye 2
      fighterBId: fighters[3].id, // Tapha Tine
      dayEventId: grandLamb.id,
      oddsA: 1.9,
      oddsB: 1.9,
      order: 5,
    },
  });

  console.log('✅ Combats créés');

  // ==================== PARIS ====================
  console.log('🎲 Création des paris de test...');

  const now = new Date();

  // 1. PARI PENDING (pour tester le bouton d'annulation) - Créé par Pape
  const pendingBet1 = await prisma.bet.create({
    data: {
      amount: 5000,
      chosenFighter: FighterChoice.A,
      status: BetStatus.PENDING,
      potentialWin: BigInt(9000),
      odds: 1.8,
      creatorId: pape.id,
      fightId: fight1.id,
      canCancelUntil: addMinutes(now, 20), // 20 minutes pour annuler
      createdAt: now,
    },
  });

  // Débiter le wallet de Pape
  await prisma.wallet.update({
    where: { userId: pape.id },
    data: {
      balance: { decrement: BigInt(5000) },
      lockedBalance: { increment: BigInt(5000) },
    },
  });

  // 2. PARI PENDING (presque expiré) - Créé par Modou
  const pendingBet2 = await prisma.bet.create({
    data: {
      amount: 10000,
      chosenFighter: FighterChoice.B,
      status: BetStatus.PENDING,
      potentialWin: BigInt(20000),
      odds: 2.0,
      creatorId: modou.id,
      fightId: fight1.id,
      canCancelUntil: addMinutes(now, 2), // Seulement 2 minutes restantes
      createdAt: addMinutes(now, -18),
    },
  });

  await prisma.wallet.update({
    where: { userId: modou.id },
    data: {
      balance: { decrement: BigInt(10000) },
      lockedBalance: { increment: BigInt(10000) },
    },
  });

  // 3. PARI ACCEPTÉ - Créé par Pape, accepté par Fatou
  const acceptedBet = await prisma.bet.create({
    data: {
      amount: 15000,
      chosenFighter: FighterChoice.A,
      status: BetStatus.ACCEPTED,
      potentialWin: BigInt(27000),
      odds: 1.8,
      creatorId: pape.id,
      acceptorId: fatou.id,
      fightId: fight2.id,
      canCancelUntil: null, // Plus annulable
      createdAt: addHours(now, -2),
      acceptedAt: addHours(now, -1),
    },
  });

  await prisma.wallet.update({
    where: { userId: pape.id },
    data: {
      balance: { decrement: BigInt(15000) },
      lockedBalance: { increment: BigInt(15000) },
    },
  });

  await prisma.wallet.update({
    where: { userId: fatou.id },
    data: {
      balance: { decrement: BigInt(15000) },
      lockedBalance: { increment: BigInt(15000) },
    },
  });

  // 4. PARI PENDING (pour Fatou)
  const pendingBet3 = await prisma.bet.create({
    data: {
      amount: 8000,
      chosenFighter: FighterChoice.B,
      status: BetStatus.PENDING,
      potentialWin: BigInt(15200),
      odds: 1.9,
      creatorId: fatou.id,
      fightId: fight3.id,
      canCancelUntil: addMinutes(now, 15),
      createdAt: addMinutes(now, -5),
    },
  });

  await prisma.wallet.update({
    where: { userId: fatou.id },
    data: {
      balance: { decrement: BigInt(8000) },
      lockedBalance: { increment: BigInt(8000) },
    },
  });

  // 5. PARI PENDING (pour Modou sur un autre combat)
  const pendingBet4 = await prisma.bet.create({
    data: {
      amount: 12000,
      chosenFighter: FighterChoice.A,
      status: BetStatus.PENDING,
      potentialWin: BigInt(19200),
      odds: 1.6,
      creatorId: modou.id,
      fightId: fight4.id,
      canCancelUntil: addMinutes(now, 18),
      createdAt: addMinutes(now, -2),
    },
  });

  await prisma.wallet.update({
    where: { userId: modou.id },
    data: {
      balance: { decrement: BigInt(12000) },
      lockedBalance: { increment: BigInt(12000) },
    },
  });

  // 6. PARIS SUR LE COMBAT EN COURS (Pour tester le gain de redistribution)
  const ongoingBet = await prisma.bet.create({
    data: {
      amount: 20000,
      chosenFighter: FighterChoice.A,
      status: BetStatus.ACCEPTED,
      potentialWin: BigInt(30000),
      odds: 1.5,
      creatorId: pape.id,
      acceptorId: modou.id,
      fightId: ongoingFight.id,
      createdAt: addHours(now, -1),
      acceptedAt: addMinutes(now, -45),
    },
  });

  await prisma.wallet.update({
    where: { userId: pape.id },
    data: {
      balance: { decrement: BigInt(20000) },
      lockedBalance: { increment: BigInt(20000) },
    },
  });

  await prisma.wallet.update({
    where: { userId: modou.id },
    data: {
      balance: { decrement: BigInt(20000) },
      lockedBalance: { increment: BigInt(20000) },
    },
  });

  // 7. PARIS SUR LE COMBAT TERMINÉ MAIS NON VALIDÉ (Pour tester le gain immédiat)
  const validationBet = await prisma.bet.create({
    data: {
      amount: 10000,
      chosenFighter: FighterChoice.A,
      status: BetStatus.ACCEPTED,
      potentialWin: BigInt(19000),
      odds: 1.9,
      creatorId: pape.id,
      acceptorId: fatou.id,
      fightId: finishedUnvalidatedFight.id,
      createdAt: addHours(now, -3),
      acceptedAt: addHours(now, -2.5),
    },
  });

  await prisma.wallet.update({
    where: { userId: pape.id },
    data: {
      balance: { decrement: BigInt(10000) },
      lockedBalance: { increment: BigInt(10000) },
    },
  });

  await prisma.wallet.update({
    where: { userId: fatou.id },
    data: {
      balance: { decrement: BigInt(10000) },
      lockedBalance: { increment: BigInt(10000) },
    },
  });

  console.log('✅ Paris créés');

  // ==================== RETRAITS ====================
  console.log('💸 Création des demandes de retrait...');

  await prisma.withdrawalRequest.createMany({
    data: [
      {
        userId: pape.id,
        amount: BigInt(15000),
        phoneNumber: '771234567',
        provider: 'WAVE',
        status: 'PENDING',
        requestedAt: addHours(now, -2),
      },
      {
        userId: modou.id,
        amount: BigInt(50000),
        phoneNumber: '772345678',
        provider: 'ORANGE_MONEY',
        status: 'APPROVED',
        requestedAt: addDays(now, -1),
        approvedAt: addDays(now, -1),
        approvedById: superAdmin.id,
        transactionRef: 'TXN-123456789',
      },
      {
        userId: fatou.id,
        amount: BigInt(10000),
        phoneNumber: '773456789',
        provider: 'FREE_MONEY',
        status: 'REJECTED',
        requestedAt: addHours(now, -1),
        rejectedAt: addHours(now, -0.5),
        rejectionReason: 'Solde insuffisant',
      }
    ]
  });

  // Verrouiller le solde de Pape pour son retrait en attente
  await prisma.wallet.update({
    where: { userId: pape.id },
    data: {
      balance: { decrement: BigInt(15000) },
      lockedBalance: { increment: BigInt(15000) },
    }
  });

  // ==================== RÉSUMÉ ====================
  console.log('\n📊 RÉSUMÉ DU SEEDING');
  console.log('='.repeat(50));
  console.log(`✅ 4 utilisateurs créés`);
  console.log(`✅ ${fighters.length} lutteurs créés`);
  console.log(`✅ 2 journées de lutte créées`);
  console.log(`✅ 6 combats créés`);
  console.log(`✅ 6 paris créés`);
  console.log(`✅ 3 demandes de retrait créées`);
  console.log('='.repeat(50));
  console.log('\n🔑 IDENTIFIANTS DE CONNEXION');
  console.log('Email: superadmin@uadb.edu.sn | Mot de passe: Diop@1234');
  console.log('Email: pape@uadb.edu.sn | Mot de passe: Diop@1234');
  console.log('Email: modou@uadb.edu.sn | Mot de passe: Diop@1234');
  console.log('Email: fatou@uadb.edu.sn | Mot de passe: Diop@1234');
  console.log('\n📋 PARIS DE TEST');
  console.log(`- Pape: 2 paris PENDING (annulables), 1 ACCEPTED`);
  console.log(`- Modou: 2 paris PENDING (1 presque expiré)`);
  console.log(`- Fatou: 1 pari PENDING, 1 ACCEPTED`);
  console.log('\n🎯 Pour tester l\'annulation:');
  console.log('1. Connectez-vous avec pape@uadb.edu.sn');
  console.log('2. Allez sur "Mes Paris"');
  console.log('3. Vous verrez le bouton "Annuler" avec le compte à rebours');
  console.log('\n✨ Seeding terminé avec succès!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
