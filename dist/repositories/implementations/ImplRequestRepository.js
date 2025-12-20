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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImplRequestRepository = void 0;
const customErrors_1 = require("../../errors/customErrors");
const paginate_helpers_1 = require("../../utils/paginate.helpers");
class ImplRequestRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getAllRequests() {
        return __awaiter(this, arguments, void 0, function* (filters = {}) {
            const { status, type, priority, channel, createdById, assignedToId, projectId, search, page = 1, limit = 10, } = filters;
            if (page < 1) {
                throw new customErrors_1.ValidationError('Le numéro de page doit être supérieur ou égal à 1');
            }
            if (limit < 1 || limit > 100) {
                throw new customErrors_1.ValidationError('La limite doit être comprise entre 1 et 100');
            }
            const where = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (status && { status })), (type && { type })), (priority && { priority })), (channel && { channel })), (createdById && { createdById })), (assignedToId && { assignedToId })), (projectId && { projectId })), (search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }));
            const include = {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                    },
                },
                location: true,
            };
            const result = yield (0, paginate_helpers_1.paginateOrFindAll)(this.prisma, 'request', {
                page,
                limit,
                findOptions: {
                    where,
                    include,
                    orderBy: { createdAt: 'desc' },
                },
            });
            return {
                requests: result.data,
                total: typeof result.total === 'number' ? result.total : result.data.length,
                page: typeof result.page === 'number' ? result.page : page,
                totalPages: typeof result.lastPage === 'number' ? result.lastPage : 1,
            };
        });
    }
    getRequestDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!id || typeof id !== 'string') {
                    throw new customErrors_1.ValidationError('ID de la requête requis et doit être une chaîne de caractères');
                }
                const request = yield this.prisma.request.findUnique({
                    where: { id },
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                avatar: true,
                                phoneNumber: true,
                                jobTitle: true,
                                department: true,
                                organization: true,
                            },
                        },
                        assignedTo: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                avatar: true,
                                phoneNumber: true,
                                jobTitle: true,
                                department: true,
                                organization: true,
                            },
                        },
                        project: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                status: true,
                                startDate: true,
                                endDate: true,
                                budget: true,
                            },
                        },
                        location: {
                            select: {
                                id: true,
                                name: true,
                                address: true,
                                city: true,
                                region: true,
                                country: true,
                                latitude: true,
                                longitude: true,
                                description: true
                            },
                        },
                        comments: {
                            include: {
                                createdBy: {
                                    select: {
                                        id: true,
                                        name: true,
                                        avatar: true,
                                        role: true,
                                    },
                                },
                                attachments: true,
                            },
                            orderBy: { createdAt: 'desc' },
                        },
                        attachments: {
                            include: {
                                uploadedBy: {
                                    select: {
                                        id: true,
                                        name: true,
                                        avatar: true,
                                    },
                                },
                            },
                            orderBy: { uploadedAt: 'desc' },
                        },
                    },
                });
                return request;
            }
            catch (error) {
                if (error instanceof customErrors_1.ValidationError) {
                    throw error;
                }
                throw new customErrors_1.ValidationError(`Erreur lors de la récupération des détails de la requête: ${error.message}`);
            }
        });
    }
    getRequestsByOrganizationId(organizationId_1) {
        return __awaiter(this, arguments, void 0, function* (organizationId, filters = {}) {
            const { status, type, priority, channel, createdById, assignedToId, projectId, search, page = 1, limit = 10, } = filters;
            if (!organizationId) {
                throw new customErrors_1.ValidationError("L'identifiant de l'organisation est requis.");
            }
            const where = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ organisationOrgId: organizationId }, (status && { status })), (type && { type })), (priority && { priority })), (channel && { channel })), (createdById && { createdById })), (assignedToId && { assignedToId })), (projectId && { projectId })), (search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }));
            const include = {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                    },
                },
                location: true,
            };
            const result = yield (0, paginate_helpers_1.paginateOrFindAll)(this.prisma, 'request', {
                page,
                limit,
                findOptions: {
                    where,
                    include,
                    orderBy: { createdAt: 'desc' },
                },
            });
            return {
                requests: result.data,
                total: typeof result.total === 'number' ? result.total : result.data.length,
                page: typeof result.page === 'number' ? result.page : page,
                totalPages: typeof result.lastPage === 'number' ? result.lastPage : 1,
            };
        });
    }
}
exports.ImplRequestRepository = ImplRequestRepository;
