"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSettingsService = void 0;
const typedi_1 = require("typedi");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const customErrors_1 = require("../errors/customErrors");
let UserSettingsService = class UserSettingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getUserSettings(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.prisma.user.findUnique({
                    where: { id: userId },
                    include: {
                        profile: true,
                        wallet: true
                    }
                });
                if (!user) {
                    throw new customErrors_1.NotFoundError('Utilisateur non trouvé');
                }
                // Ensure profile exists (it should, but good to be safe or create default)
                if (!user.profile) {
                    // Auto-create profile if missing?
                    const newProfile = yield this.prisma.userProfile.create({
                        data: {
                            id: (0, crypto_1.randomUUID)(),
                            userId: user.id,
                            updatedAt: new Date()
                        }
                    });
                    user.profile = newProfile;
                }
                return Object.assign(Object.assign({}, user), { password: undefined // Don't return password
                 });
            }
            catch (error) {
                if (error instanceof customErrors_1.NotFoundError)
                    throw error;
                throw new customErrors_1.DatabaseError('Erreur lors de la récupération des paramètres utilisateur');
            }
        });
    }
    updateProfile(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, email } = data, profileData = __rest(data, ["name", "email"]);
                // Prepare user update data
                const userUpdateData = {};
                if (name)
                    userUpdateData.name = name;
                if (email)
                    userUpdateData.email = email;
                // Helper to handle Date conversion
                if (profileData.dateOfBirth && typeof profileData.dateOfBirth === 'string') {
                    profileData.dateOfBirth = new Date(profileData.dateOfBirth);
                }
                // Transaction to update both User and UserProfile
                yield this.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    if (Object.keys(userUpdateData).length > 0) {
                        yield tx.user.update({
                            where: { id: userId },
                            data: userUpdateData
                        });
                    }
                    if (Object.keys(profileData).length > 0) {
                        yield tx.userProfile.upsert({
                            where: { userId },
                            update: profileData,
                            create: Object.assign({ id: (0, crypto_1.randomUUID)(), userId, updatedAt: new Date() }, profileData)
                        });
                    }
                }));
                return this.getUserSettings(userId);
            }
            catch (error) {
                console.error('Update profile error:', error);
                throw new customErrors_1.DatabaseError('Erreur lors de la mise à jour du profil');
            }
        });
    }
    updatePreferences(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.prisma.userProfile.upsert({
                    where: { userId },
                    update: data,
                    create: Object.assign({ id: (0, crypto_1.randomUUID)(), userId, updatedAt: new Date() }, data)
                });
                return this.getUserSettings(userId);
            }
            catch (error) {
                throw new customErrors_1.DatabaseError('Erreur lors de la mise à jour des préférences');
            }
        });
    }
};
exports.UserSettingsService = UserSettingsService;
exports.UserSettingsService = UserSettingsService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], UserSettingsService);
