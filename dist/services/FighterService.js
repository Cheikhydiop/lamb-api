"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FighterService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class FighterService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    listFighters(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { search, status, stable, limit = 50, offset = 0, orderBy = 'name', orderDirection = 'asc' } = filters;
                const where = {};
                if (search) {
                    where.OR = [
                        { name: { contains: search, mode: 'insensitive' } },
                        { nickname: { contains: search, mode: 'insensitive' } },
                        { stable: { contains: search, mode: 'insensitive' } }
                    ];
                }
                if (status) {
                    where.status = status;
                }
                if (stable) {
                    where.stable = { contains: stable, mode: 'insensitive' };
                }
                const orderByClause = {};
                orderByClause[orderBy] = orderDirection;
                const [fighters, total] = yield Promise.all([
                    this.prisma.fighter.findMany({
                        where,
                        take: limit,
                        skip: offset,
                        orderBy: orderByClause
                    }),
                    this.prisma.fighter.count({ where })
                ]);
                return {
                    fighters,
                    total,
                    limit,
                    offset
                };
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des lutteurs:', error);
                throw error;
            }
        });
    }
    createFighter(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (data.birthDate) {
                    const existing = yield this.prisma.fighter.findUnique({
                        where: {
                            name_birthDate: {
                                name: data.name,
                                birthDate: data.birthDate
                            }
                        }
                    });
                    if (existing) {
                        throw new Error('Un lutteur avec ce nom et cette date de naissance existe déjà');
                    }
                }
                const fighter = yield this.prisma.fighter.create({
                    data: {
                        name: data.name,
                        nickname: data.nickname,
                        stable: data.stable,
                        birthDate: data.birthDate,
                        birthPlace: data.birthPlace,
                        nationality: data.nationality || 'SN',
                        weight: data.weight,
                        height: data.height,
                        profileImage: data.profileImage,
                        status: 'ACTIVE'
                    }
                });
                logger_1.default.info(`Lutteur créé: ${fighter.id} - ${fighter.name}`);
                return fighter;
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la création du lutteur:', error);
                throw error;
            }
        });
    }
    getFighter(fighterId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fighter = yield this.prisma.fighter.findUnique({
                    where: { id: fighterId },
                    include: {
                        fightsAsA: {
                            include: {
                                fighterB: true,
                                result: true,
                                dayEvent: true
                            },
                            orderBy: { createdAt: 'desc' },
                            take: 10
                        },
                        fightsAsB: {
                            include: {
                                fighterA: true,
                                result: true,
                                dayEvent: true
                            },
                            orderBy: { createdAt: 'desc' },
                            take: 10
                        }
                    }
                });
                if (!fighter) {
                    throw new Error('Lutteur non trouvé');
                }
                return fighter;
            }
            catch (error) {
                logger_1.default.error(`Erreur lors de la récupération du lutteur ${fighterId}:`, error);
                throw error;
            }
        });
    }
    updateFighter(fighterId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fighter = yield this.prisma.fighter.findUnique({
                    where: { id: fighterId }
                });
                if (!fighter) {
                    throw new Error('Lutteur non trouvé');
                }
                const updated = yield this.prisma.fighter.update({
                    where: { id: fighterId },
                    data: {
                        name: data.name,
                        nickname: data.nickname,
                        stable: data.stable,
                        birthDate: data.birthDate,
                        birthPlace: data.birthPlace,
                        nationality: data.nationality,
                        weight: data.weight,
                        height: data.height,
                        status: data.status,
                        profileImage: data.profileImage
                    }
                });
                logger_1.default.info(`Lutteur mis à jour: ${fighterId}`);
                return updated;
            }
            catch (error) {
                logger_1.default.error(`Erreur lors de la mise à jour du lutteur ${fighterId}:`, error);
                throw error;
            }
        });
    }
    deleteFighter(fighterId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fighter = yield this.prisma.fighter.findUnique({
                    where: { id: fighterId }
                });
                if (!fighter) {
                    throw new Error('Lutteur non trouvé');
                }
                yield this.prisma.fighter.delete({
                    where: { id: fighterId }
                });
                logger_1.default.info(`Lutteur supprimé: ${fighterId}`);
                return { success: true };
            }
            catch (error) {
                logger_1.default.error(`Erreur lors de la suppression du lutteur ${fighterId}:`, error);
                throw error;
            }
        });
    }
    searchFighters(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, limit = 20) {
            try {
                const fighters = yield this.prisma.fighter.findMany({
                    where: {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { nickname: { contains: query, mode: 'insensitive' } },
                            { stable: { contains: query, mode: 'insensitive' } }
                        ],
                        status: 'ACTIVE'
                    },
                    take: limit,
                    orderBy: { name: 'asc' }
                });
                return fighters;
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la recherche de lutteurs:', error);
                throw error;
            }
        });
    }
    getTopFighters() {
        return __awaiter(this, arguments, void 0, function* (limit = 10) {
            try {
                const fighters = yield this.prisma.fighter.findMany({
                    where: {
                        status: 'ACTIVE'
                    },
                    orderBy: [
                        { wins: 'desc' },
                        { totalFights: 'desc' }
                    ],
                    take: limit
                });
                return fighters;
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des meilleurs lutteurs:', error);
                throw error;
            }
        });
    }
    getFighterStats(fighterId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fighter = yield this.prisma.fighter.findUnique({
                    where: { id: fighterId }
                });
                if (!fighter) {
                    throw new Error('Lutteur non trouvé');
                }
                return {
                    id: fighter.id,
                    name: fighter.name,
                    nickname: fighter.nickname,
                    stable: fighter.stable,
                    totalFights: fighter.totalFights,
                    wins: fighter.wins,
                    losses: fighter.losses,
                    draws: fighter.draws,
                    knockouts: fighter.knockouts,
                    winRate: fighter.totalFights > 0
                        ? ((fighter.wins / fighter.totalFights) * 100).toFixed(1)
                        : '0.0'
                };
            }
            catch (error) {
                logger_1.default.error(`Erreur lors de la récupération des stats du lutteur ${fighterId}:`, error);
                throw error;
            }
        });
    }
}
exports.FighterService = FighterService;
