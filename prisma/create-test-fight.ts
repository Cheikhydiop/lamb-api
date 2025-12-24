import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Créer ou récupérer deux combattants
    let fighterA = await prisma.fighter.findFirst({ where: { name: 'Modou Lo Test' } });
    if (!fighterA) {
        fighterA = await prisma.fighter.create({
            data: { name: 'Modou Lo Test', weight: 120, height: 190, stable: 'Rock Energie' }
        });
    }

    let fighterB = await prisma.fighter.findFirst({ where: { name: 'Balla Gaye Test' } });
    if (!fighterB) {
        fighterB = await prisma.fighter.create({
            data: { name: 'Balla Gaye Test', weight: 110, height: 185, stable: 'Ecole Balla' }
        });
    }

    // 2. Créer un événement
    let event = await prisma.dayEvent.findFirst({ where: { title: 'Grand Combat Test' } });
    if (!event) {
        event = await prisma.dayEvent.create({
            data: {
                title: 'Grand Combat Test',
                slug: 'grand-combat-test',
                location: 'Stade Demba Diop',
                date: new Date(Date.now() + 86400000), // Demain
                status: 'SCHEDULED' as any
            }
        });
    }

    // 3. Créer le combat
    const fight = await prisma.fight.create({
        data: {
            title: 'Choc des Titans Test',
            dayEventId: event.id,
            fighterAId: fighterA.id,
            fighterBId: fighterB.id,
            scheduledAt: new Date(Date.now() + 86400000),
            status: 'SCHEDULED' as any,
            oddsA: 1.5,
            oddsB: 2.5,
            location: 'Stade Demba Diop'
        }
    });

    console.log(`✅ Combat créé avec succès : ${fight.title} (ID: ${fight.id})`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
