// prisma/seed.ts
import { PrismaClient, UserRole, BetStatus, FightStatus, EventStatus, FighterChoice, TransactionType, TransactionStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { addDays, addHours, addMinutes, subDays, subMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding spécifique LambJi...');

  // Nettoyage complet
  await prisma.winning.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.fightResult.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.withdrawalRequest.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.session.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.fight.deleteMany();
  await prisma.fighterStatistics.deleteMany();
  await prisma.fighter.deleteMany();
  await prisma.dayEvent.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('Diop@1234', 10);
  // Date de référence (Simulation en Décembre 2025 selon le contexte)
  const now = new Date('2025-12-20T12:00:00Z');

  // ==================== UTILISATEURS ====================
  console.log('👥 Création des utilisateurs...');

  // 1. Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      phone: '770000000',
      email: 'superadmin@uadb.edu.sn',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isEmailVerified: true,
      isActive: true,
      wallet: { create: { balance: BigInt(1000000) } },
      profile: { create: { country: 'Senegal', city: 'Dakar', bio: 'Gestionnaire principal' } }
    },
  });

  // 2. Utilisateurs standards
  const usersData = [
    { name: 'Pape Diop', phone: '771234567', email: 'pape@uadb.edu.sn', balance: 500000 },
    { name: 'Modou Fall', phone: '772345678', email: 'modou@uadb.edu.sn', balance: 300000 },
    { name: 'Fatou Sall', phone: '773456789', email: 'fatou@uadb.edu.sn', balance: 200000 },
    { name: 'Cheikh Riche', phone: '775555555', email: 'vip@uadb.edu.sn', balance: 50000000 },
  ];

  const standardUsers = [];
  for (const u of usersData) {
    standardUsers.push(await prisma.user.create({
      data: {
        name: u.name,
        phone: u.phone,
        email: u.email,
        password: hashedPassword,
        role: UserRole.BETTOR,
        isEmailVerified: true,
        isActive: true,
        wallet: { create: { balance: BigInt(u.balance) } },
        profile: { create: { country: 'Senegal', city: 'Dakar' } }
      }
    }));
  }

  // Utilisateurs aléatoires supplémentaires
  const extraUsers = [];
  for (let i = 0; i < 15; i++) {
    try {
      extraUsers.push(await prisma.user.create({
        data: {
          name: `User ${i}`,
          phone: `77${Math.floor(1000000 + Math.random() * 9000000)}`,
          email: `user${i}@lambji.sn`,
          password: hashedPassword,
          role: UserRole.BETTOR,
          isEmailVerified: true,
          isActive: true,
          wallet: { create: { balance: BigInt(Math.floor(Math.random() * 500000)) } },
          profile: { create: { country: 'Senegal', city: 'Dakar' } }
        }
      }));
    } catch (e) { }
  }

  const allBettors = [...standardUsers, ...extraUsers];

  // ==================== LUTTEURS ====================
  console.log('🥊 Création des lutteurs...');

  const fightersList = [
    // Poids Lourds / VIP
    { name: 'Modou Lô', nickname: 'Le Roi des Arènes', stable: 'Rock Énergie', weight: 95, height: 1.85, wins: 38, losses: 5 },
    { name: 'Ama Baldé', nickname: 'Seulou Bou Ndaw', stable: 'Falaye Baldé', weight: 92, height: 1.83, wins: 35, losses: 6 },
    { name: 'Balla Gaye 2', nickname: 'Le Lion de Guédiawaye', stable: 'Balla Gaye', weight: 98, height: 1.88, wins: 32, losses: 6 }, // Perdu vs Siteu
    { name: 'Tapha Tine', nickname: 'Le Géant du Baol', stable: 'Baol Mbollo', weight: 100, height: 1.95, wins: 28, losses: 6 },
    { name: 'Bombardier', nickname: 'B52', stable: 'Mbour', weight: 120, height: 1.90, wins: 30, losses: 9 }, // Perdu vs Jackson Jr
    { name: 'Eumeu Sène', nickname: 'Le Fou', stable: 'Tay Shinger', weight: 96, height: 1.84, wins: 29, losses: 8 }, // Perdu vs Franc
    { name: 'Gris Bordeaux', nickname: '3ème Tigre', stable: 'Fass', weight: 100, height: 1.82, wins: 36, losses: 8 }, // Perdu vs Zarco
    { name: 'Lac de Guiers 2', nickname: 'Le Puncheur du Walo', stable: 'Walo', weight: 95, height: 1.89, wins: 25, losses: 7 },
    { name: 'Boy Niang 2', nickname: 'Thiapathioly', stable: 'Boy Niang', weight: 90, height: 1.80, wins: 27, losses: 8 },
    { name: 'Reug Reug', nickname: 'La Foudre', stable: 'Thiaroye', weight: 110, height: 1.88, wins: 16, losses: 1 },
    { name: 'Siteu', nickname: 'Le Phénomène', stable: 'Lansar', weight: 88, height: 1.87, wins: 25, losses: 7 }, // Gagné vs BG2
    { name: 'Franc', nickname: 'Ndiambour Ndiambour', stable: 'Parcelles Mbollo', weight: 92, height: 1.85, wins: 13, losses: 0 }, // Invaincu

    // Espoirs / Outsiders confirmés
    { name: 'Ada Fass', nickname: 'L\'espoir de Fass', stable: 'Fass', weight: 95, height: 1.90, wins: 15, losses: 3 },
    { name: 'Liss Ndiago', nickname: 'Le Technicien', stable: 'Diamaguène', weight: 85, height: 1.80, wins: 14, losses: 4 },
    { name: 'Zarco', nickname: 'Le Showman', stable: 'Grand Yoff', weight: 90, height: 1.78, wins: 20, losses: 10 },
    { name: 'Sa Thiès', nickname: 'Le Volcan', stable: 'Balla Gaye', weight: 92, height: 1.85, wins: 22, losses: 4 },

    // Autres
    { name: 'Lac Rose', nickname: 'La Rose', stable: 'Fass', weight: 100, height: 1.85, wins: 12, losses: 6 },
    { name: 'Diop 2', nickname: 'Diop', stable: 'Lébou', weight: 88, height: 1.82, wins: 10, losses: 5 }, // Adversaire de Liss Ndiago
    { name: 'Jackson Jr', nickname: 'Jackson', stable: 'Guédiawaye', weight: 95, height: 1.85, wins: 11, losses: 2 },
    { name: 'Thiatou Daouda Fall', nickname: 'Thiatou', stable: 'Banlieue', weight: 85, height: 1.80, wins: 9, losses: 1 },
    { name: 'Moussa Ndoye', nickname: 'Moussa', stable: 'Yarakh', weight: 88, height: 1.75, wins: 18, losses: 6 },
    { name: 'Serigne Ndiaye 2', nickname: 'Serigne', stable: 'Calme', weight: 110, height: 1.92, wins: 8, losses: 2 },
    { name: 'Doudou Sané', nickname: 'Doudou', stable: 'Tay', weight: 90, height: 1.80, wins: 7, losses: 3 },
    { name: 'Général Malika', nickname: 'Général', stable: 'Malika', weight: 95, height: 1.85, wins: 10, losses: 5 },
    { name: 'Alioune Sèye 2', nickname: 'Alioune', stable: 'Walo', weight: 94, height: 1.83, wins: 11, losses: 4 },
  ];

  const fightersMap = new Map();
  for (const f of fightersList) {
    const fighter = await prisma.fighter.create({
      data: {
        ...f,
        nationality: 'Senegal',
        status: 'ACTIVE',
        popularity: Math.floor(Math.random() * 20) + 80,
      }
    });
    fightersMap.set(f.name, fighter);
  }

  const getFighter = (name: string) => {
    const f = fightersMap.get(name);
    if (!f) console.error(`⚠️ Lutteur non trouvé lors de la création du combat: ${name}`);
    return f;
  };

  // ==================== ÉVÉNEMENTS & COMBATS ====================
  console.log('📅 Création des événements et combats...');

  // 1. Début 2025 (Passé)
  // "Zarco terrasse Gris Bordeaux (combat début 2025)"
  // "Liss Ndiago vs Lac Rose — fév. 2025 : victoire"
  const eventFeb2025 = await prisma.dayEvent.create({
    data: {
      title: 'Gala d\'Ouverture 2025',
      slug: 'ouverture-saison-2025',
      date: new Date('2025-02-15T16:00:00Z'),
      location: 'Arène Nationale',
      status: EventStatus.COMPLETED,
      isFeatured: false,
      createdById: superAdmin.id,
    }
  });

  await createFight(eventFeb2025, 'Zarco', 'Gris Bordeaux', FightStatus.FINISHED, 'Zarco');
  await createFight(eventFeb2025, 'Liss Ndiago', 'Lac Rose', FightStatus.FINISHED, 'Liss Ndiago');


  // 2. Juillet 2025 (Passé Notable)
  // "Ada Fass vs Liss Ndiago — 19 juil. 2025 : Ada Fass l’a emporté."
  // "Siteu bat Balla Gaye 2 – victoire notable à l’Arène nationale (juillet 2025)."
  // "Thiatou Daouda Fall vs Moussa Ndoye – combat annoncé pour fin juillet."
  const eventJuly2025 = await prisma.dayEvent.create({
    data: {
      title: 'Grand Combat Juillet 2025',
      slug: 'grand-lamb-juillet-2025',
      date: new Date('2025-07-19T20:00:00Z'),
      location: 'Arène Nationale',
      status: EventStatus.COMPLETED,
      isFeatured: true, // Vedette passée
      createdById: superAdmin.id,
    }
  });

  await createFight(eventJuly2025, 'Ada Fass', 'Liss Ndiago', FightStatus.FINISHED, 'Ada Fass');
  await createFight(eventJuly2025, 'Siteu', 'Balla Gaye 2', FightStatus.FINISHED, 'Siteu');
  await createFight(eventJuly2025, 'Thiatou Daouda Fall', 'Moussa Ndoye', FightStatus.FINISHED, 'Thiatou Daouda Fall');


  // 3. Mi-Saison / Divers 2025 (Passé)
  // "Franc terrasse Eumeu Sène – série de victoires"
  const eventMid2025 = await prisma.dayEvent.create({
    data: {
      title: 'Choc des Titans 2025',
      slug: 'choc-titans-2025',
      date: new Date('2025-05-10T18:00:00Z'),
      location: 'Stade Demba Diop',
      status: EventStatus.COMPLETED,
      createdById: superAdmin.id,
    }
  });

  await createFight(eventMid2025, 'Franc', 'Eumeu Sène', FightStatus.FINISHED, 'Franc');


  // 4. Combat Récent (Décembre 2025 / Novembre 2025)
  // "Jackson Jr terrasse Bombardier – combat récent."
  const eventRecent = await prisma.dayEvent.create({
    data: {
      title: 'Gala de la Renaissance',
      slug: 'gala-renaissance-2025',
      date: new Date('2025-11-20T19:00:00Z'),
      location: 'Arène Nationale',
      status: EventStatus.COMPLETED,
      isFeatured: false,
      createdById: superAdmin.id,
    }
  });

  await createFight(eventRecent, 'Jackson Jr', 'Bombardier', FightStatus.FINISHED, 'Jackson Jr');


  // 5. Futurs et Anticipés (2026 / Fin 2025)
  // "Liss Ndiago vs Diop 2"
  // "Lac de Guiers 2 vs Ada Fass"
  // "Reug Reug vs Boy Niang 2"
  // "Modou Lô vs Sa Thiès"
  // "Ama Baldé vs Franc"
  // "Franc vs Tapha Tine" - Probablement un tournoi ou une suite
  // "Serigne Ndiaye 2 vs Doudou Sané"
  // "Général Malika vs Alioune Sèye 2"

  const eventJan2026 = await prisma.dayEvent.create({
    data: {
      title: 'Le Choc du Nouvel An 2026',
      slug: 'nouvel-an-2026',
      date: new Date('2026-01-01T17:00:00Z'),
      location: 'Arène Nationale',
      status: EventStatus.SCHEDULED,
      isFeatured: true, // Vedette à venir
      minBetAmount: BigInt(5000),
      createdById: superAdmin.id,
    }
  });

  await createFight(eventJan2026, 'Modou Lô', 'Sa Thiès', FightStatus.SCHEDULED);
  await createFight(eventJan2026, 'Ama Baldé', 'Franc', FightStatus.SCHEDULED);

  const eventFeb2026 = await prisma.dayEvent.create({
    data: {
      title: 'Gala de l\'Indépendance (Anticipé)',
      slug: 'independance-2026',
      date: new Date('2026-04-04T18:00:00Z'),
      location: 'Stade Léopold Sédar Senghor',
      status: EventStatus.SCHEDULED,
      isFeatured: false,
      createdById: superAdmin.id,
    }
  });

  await createFight(eventFeb2026, 'Reug Reug', 'Boy Niang 2', FightStatus.SCHEDULED);
  await createFight(eventFeb2026, 'Lac de Guiers 2', 'Ada Fass', FightStatus.SCHEDULED);


  const eventProjected = await prisma.dayEvent.create({
    data: {
      title: 'Affrontements Espoirs',
      slug: 'espoirs-2026',
      date: new Date('2026-02-15T16:00:00Z'),
      location: 'Stade Iba Mar Diop',
      status: EventStatus.SCHEDULED,
      createdById: superAdmin.id,
    }
  });

  await createFight(eventProjected, 'Liss Ndiago', 'Diop 2', FightStatus.SCHEDULED);
  await createFight(eventProjected, 'Serigne Ndiaye 2', 'Doudou Sané', FightStatus.SCHEDULED);
  await createFight(eventProjected, 'Général Malika', 'Alioune Sèye 2', FightStatus.SCHEDULED);

  // Franc vs Tapha Tine (Peut-être plus tard)
  const eventLate2026 = await prisma.dayEvent.create({
    data: {
      title: 'Le Roi du Baol',
      slug: 'roi-baol-2026',
      date: new Date('2026-06-20T20:00:00Z'),
      location: 'Stade Demba Diop',
      status: EventStatus.SCHEDULED,
      createdById: superAdmin.id,
    }
  });
  await createFight(eventLate2026, 'Franc', 'Tapha Tine', FightStatus.SCHEDULED);


  // ==================== FONCTIONS HELPER ====================

  async function createFight(event: any, fAGivenName: string, fBGivenName: string, status: FightStatus, winnerName?: string) {
    const fA = getFighter(fAGivenName);
    const fB = getFighter(fBGivenName);

    if (!fA || !fB) return;

    const notes = status === FightStatus.FINISHED
      ? `Victoire de ${winnerName}`
      : 'Combat très attendu';

    let resultStore = undefined;
    if (status === FightStatus.FINISHED && winnerName) {
      const winner = winnerName === fA.name ? FighterChoice.A : FighterChoice.B;
      resultStore = {
        create: {
          winner: winner,
          victoryMethod: 'KO',
          notes: notes,
          adminId: superAdmin.id
        }
      };
    }

    const fight = await prisma.fight.create({
      data: {
        title: `${fA.name} vs ${fB.name}`,
        scheduledAt: event.date,
        startedAt: status === FightStatus.FINISHED ? event.date : null,
        endedAt: status === FightStatus.FINISHED ? addHours(event.date, 1) : null,
        status: status,
        fighterAId: fA.id,
        fighterBId: fB.id,
        dayEventId: event.id,
        location: event.location,
        oddsA: Number((1.5 + Math.random()).toFixed(2)),
        oddsB: Number((1.5 + Math.random()).toFixed(2)),
        popularity: Math.floor(Math.random() * 50) + 50,
        result: resultStore
      }
    });

    // Générer des paris pour ce combat
    await generateBets(fight, allBettors, winnerName);
  }

  async function generateBets(fight: any, bettors: any[], winnerName?: string) {
    // Ne pas parier sur des combats trop vieux si on veut du réalisme, 
    // mais pour le test on veut des données partout.
    const numBets = Math.floor(Math.random() * 8) + 2;

    // Si le combat est fini, on connait le gagnant
    let winnerChoice: FighterChoice | null = null;
    if (winnerName) {
      if (fight.title.startsWith(winnerName)) winnerChoice = FighterChoice.A;
      else winnerChoice = FighterChoice.B; // Approximation
    }

    for (let i = 0; i < numBets; i++) {
      const bettor = bettors[Math.floor(Math.random() * bettors.length)];
      const choice = Math.random() > 0.5 ? FighterChoice.A : FighterChoice.B;
      const odds = choice === FighterChoice.A ? fight.oddsA : fight.oddsB;
      const amount = (Math.floor(Math.random() * 50) + 1) * 1000;

      // Déterminer le statut du pari
      let betStatus: BetStatus = BetStatus.PENDING;
      if (fight.status === FightStatus.FINISHED && winnerChoice) {
        // Si le combat est fini, le pari est GAGNÉ si le choix correspond
        betStatus = (choice === winnerChoice) ? BetStatus.WON : BetStatus.LOST;
      } else {
        betStatus = BetStatus.PENDING;
      }

      // Créer le pari
      await prisma.bet.create({
        data: {
          amount: amount,
          chosenFighter: choice,
          status: betStatus,
          potentialWin: BigInt(Math.floor(amount * odds)),
          actualWin: betStatus === BetStatus.WON ? BigInt(Math.floor(amount * odds)) : BigInt(0),
          odds: odds,
          creatorId: bettor.id,
          fightId: fight.id,
          createdAt: subMinutes(fight.scheduledAt, 60 * 24), // Parié 1 jour avant
        }
      });
    }
  }


  console.log('✅ Seeding terminé avec les données spécifiques Lambji.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
