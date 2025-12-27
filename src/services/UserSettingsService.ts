import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { DatabaseError, NotFoundError, ValidationError } from '../errors/customErrors';

@Service()
export class UserSettingsService {
    constructor(private prisma: PrismaClient) { }

    async getUserSettings(userId: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    profile: true,
                    wallet: true
                }
            });

            if (!user) {
                throw new NotFoundError('Utilisateur non trouvé');
            }

            // Ensure profile exists (it should, but good to be safe or create default)
            if (!user.profile) {
                // Auto-create profile if missing?
                const newProfile = await this.prisma.userProfile.create({
                    data: {
                        id: randomUUID(),
                        userId: user.id,
                        updatedAt: new Date()
                    }
                });
                user.profile = newProfile;
            }

            return {
                ...user,
                password: undefined // Don't return password
            };
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new DatabaseError('Erreur lors de la récupération des paramètres utilisateur');
        }
    }

    async updateProfile(userId: string, data: {
        name?: string;
        email?: string;
        bio?: string;
        city?: string;
        country?: string;
        dateOfBirth?: Date | string;
        favoriteStable?: string;
        avatar?: string;
    }) {
        try {
            const { name, email, ...profileData } = data;

            // Prepare user update data
            const userUpdateData: any = {};
            if (name) userUpdateData.name = name;
            if (email) userUpdateData.email = email;

            // Helper to handle Date conversion
            if (profileData.dateOfBirth && typeof profileData.dateOfBirth === 'string') {
                profileData.dateOfBirth = new Date(profileData.dateOfBirth);
            }

            // Transaction to update both User and UserProfile
            await this.prisma.$transaction(async (tx) => {
                if (Object.keys(userUpdateData).length > 0) {
                    await tx.user.update({
                        where: { id: userId },
                        data: userUpdateData
                    });
                }

                if (Object.keys(profileData).length > 0) {
                    await tx.userProfile.upsert({
                        where: { userId },
                        update: profileData,
                        create: {
                            id: randomUUID(),
                            userId,
                            updatedAt: new Date(),
                            ...profileData
                        }
                    });
                }
            });

            return this.getUserSettings(userId);
        } catch (error) {
            console.error('Update profile error:', error);
            throw new DatabaseError('Erreur lors de la mise à jour du profil');
        }
    }

    async updatePreferences(userId: string, data: {
        notificationsEnabled?: boolean;
        emailNotifications?: boolean;
        smsNotifications?: boolean;
        language?: string;
    }) {
        try {
            await this.prisma.userProfile.upsert({
                where: { userId },
                update: data,
                create: {
                    id: randomUUID(),
                    userId,
                    updatedAt: new Date(),
                    ...data
                }
            });

            return this.getUserSettings(userId);
        } catch (error) {
            throw new DatabaseError('Erreur lors de la mise à jour des préférences');
        }
    }
}
