
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteToAdmin(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log(`❌ Utilisateur non trouvé avec l'email : ${email}`);
            return;
        }

        const updatedUser = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' },
        });

        console.log(`✅ Succès ! L'utilisateur ${updatedUser.name} (${updatedUser.email}) est maintenant ADMIN.`);
        console.log('👉 Vous pouvez accéder au panneau d\'administration via /admin');

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour :', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Récupérer l'email depuis les arguments
const email = process.argv[2];

if (!email) {
    console.log('Usage: npx ts-node scripts/promote-to-admin.ts <email>');
    process.exit(1);
}

promoteToAdmin(email);
