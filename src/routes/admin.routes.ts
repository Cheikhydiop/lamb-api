import { Router } from 'express';
import { ServiceContainer } from '../container/ServiceContainer';
import { AdminController } from '../controllers/AdminController';
import { requireAdmin } from '../middlewares/authMiddleware';
import { AuditAction, AuditResourceType, AuditSeverity } from '../middlewares/AuditMiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';

export const createAdminRoutes = () => {
    const router = Router();
    const { auditMiddleware } = ServiceContainer.getInstance();

    // Toutes les routes sont protégées par requireAdmin
    router.use(requireAdmin);

    router.post(
        '/fights',
        auditMiddleware.auditFightCreate(),
        asyncHandler(AdminController.createFight)
    );

    router.patch(
        '/fights/:fightId/status',
        auditMiddleware.auditAdminAction(AuditAction.FIGHT_UPDATE, AuditResourceType.FIGHT, AuditSeverity.MEDIUM),
        asyncHandler(AdminController.updateFightStatus)
    );

    router.post(
        '/fights/:fightId/result',
        auditMiddleware.auditFightResultSet(),
        asyncHandler(AdminController.validateFightResult)
    );

    router.post(
        '/events',
        auditMiddleware.auditAdminAction(AuditAction.SYSTEM_CONFIG_UPDATE, AuditResourceType.SYSTEM, AuditSeverity.MEDIUM),
        asyncHandler(AdminController.createDayEvent)
    );

    router.get('/stats',
        asyncHandler(AdminController.getDashboardStats)
    );

    // ========== UTILISATEURS ==========
    router.get('/users', asyncHandler((req, res, next) => AdminController.getUsers(req, res, next)));
    router.get('/users/:id', asyncHandler((req, res, next) => AdminController.getUser(req, res, next)));

    router.patch(
        '/users/:id/status',
        auditMiddleware.auditAdminAction(AuditAction.USER_UPDATE, AuditResourceType.USER, AuditSeverity.HIGH),
        asyncHandler((req, res, next) => AdminController.updateUserStatus(req, res, next))
    );

    // ========== RETRAITS ==========
    router.get('/withdrawals', asyncHandler((req, res, next) => AdminController.getWithdrawals(req, res, next)));

    router.post(
        '/withdrawals/:id/approve',
        auditMiddleware.auditAdminAction(AuditAction.WITHDRAWAL_APPROVE, AuditResourceType.WITHDRAWAL, AuditSeverity.CRITICAL),
        asyncHandler((req, res, next) => AdminController.approveWithdrawal(req, res, next))
    );

    router.post(
        '/withdrawals/:id/reject',
        auditMiddleware.auditAdminAction(AuditAction.WITHDRAWAL_REJECT, AuditResourceType.WITHDRAWAL, AuditSeverity.HIGH),
        asyncHandler((req, res, next) => AdminController.rejectWithdrawal(req, res, next))
    );

    // ========== AUDITS ==========
    router.get('/audit-logs', asyncHandler((req, res, next) => AdminController.getAuditLogs(req, res, next)));

    return router;
};
