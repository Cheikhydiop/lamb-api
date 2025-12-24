import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('password123', 10);

    const users = [
        { name: 'Test User 1', email: 'test1@test.com', phone: '+221770000001' },
        { name: 'Test User 2', email: 'test2@test.com', phone: '+221770000002' }
    ];

    for (const u of users) {
        const existing = await prisma.user.findUnique({ where: { email: u.email } });
        if (!existing) {
            await prisma.user.create({
                data: {
                    ...u,
                    password,
                    role: UserRole.BETTOR,
                    isEmailVerified: true as any,
                    wallet: {
                        create: {
                            balance: 100000,
                            bonusBalance: 0,
                            lockedBalance: 0
                        }
                    }
                } as any
            });
            console.log(`✅ Utilisateur créé : ${u.email}`);
        } else {
            // S'assurer qu'il a de l'argent
            await prisma.wallet.update({
                where: { userId: existing.id },
                data: { balance: 100000 } // Reset solde
            });
            console.log(`ℹ️ Utilisateur existant (solde réinitialisé) : ${u.email}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
