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
exports.paginateOrFindAll = paginateOrFindAll;
function paginateOrFindAll(prisma, modelName, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const model = prisma[modelName];
        if (!model || typeof model.findMany !== 'function' || typeof model.count !== 'function') {
            throw new Error(`Le modèle ${String(modelName)} n'existe pas ou ne supporte pas findMany/count.`);
        }
        const { page, limit = 10, cursor, findOptions = {} } = options || {};
        // Pagination par curseur (infinite scroll)
        if (cursor) {
            const items = yield model.findMany(Object.assign({ take: limit + 1, cursor: cursor, skip: 1 }, findOptions));
            const hasNextPage = items.length > limit;
            const data = hasNextPage ? items.slice(0, -1) : items;
            const nextCursor = hasNextPage ? { id: data[data.length - 1].id } : null;
            return {
                data,
                nextCursor,
                hasNextPage,
                paginated: true,
            };
        }
        // CORRECTION : Pagination classique - condition plus explicite
        const shouldPaginate = typeof page === 'number' && page >= 1;
        if (shouldPaginate) {
            console.log(`🔍 Pagination activée - Page: ${page}, Limit: ${limit}`);
            const skip = (page - 1) * limit;
            const [data, total] = yield prisma.$transaction([
                model.findMany(Object.assign({ skip, take: limit }, findOptions)),
                model.count({ where: findOptions.where }),
            ]);
            const lastPage = Math.ceil(total / limit) || 1;
            const from = total === 0 ? 0 : skip + 1;
            const to = Math.min(skip + limit, total);
            console.log(`📊 Résultat pagination - Total: ${total}, Page: ${page}/${lastPage}, Items: ${data.length}`);
            return {
                data,
                total,
                page,
                perPage: limit,
                lastPage,
                from,
                to,
                hasNextPage: page < lastPage,
                hasPreviousPage: page > 1,
                paginated: true,
            };
        }
        // Fallback : récupérer tout (seulement si aucune pagination n'est demandée)
        console.log('⚠️ ATTENTION: Récupération de TOUS les éléments sans pagination');
        const data = yield model.findMany(findOptions);
        return {
            data,
            total: data.length,
            paginated: false,
        };
    });
}
