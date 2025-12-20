import { Router } from 'express';
import { Container } from 'typedi';
import { AdminController } from '../controllers/AdminController';
import { requireAdmin } from '../middlewares/authMiddleware';
import { AuditMiddleware, AuditAction, AuditResourceType, AuditSeverity } from '../middlewares/AuditMiddleware';

const router = Router();
const auditMiddleware = Container.get(AuditMiddleware);

// Toutes les routes sont protégées par requireAdmin
router.use(requireAdmin);

router.post(
    '/fights',
    auditMiddleware.auditFightCreate(),
    AdminController.createFight
);

router.patch(
    '/fights/:fightId/status',
    auditMiddleware.auditAdminAction(AuditAction.FIGHT_UPDATE, AuditResourceType.FIGHT, AuditSeverity.MEDIUM),
    AdminController.updateFightStatus
);

router.post(
    '/fights/:fightId/result',
    auditMiddleware.auditFightResultSet(),
    AdminController.validateFightResult
);

router.post(
    '/events',
    auditMiddleware.auditAdminAction(AuditAction.SYSTEM_CONFIG_UPDATE, AuditResourceType.SYSTEM, AuditSeverity.MEDIUM),
    AdminController.createDayEvent
);

router.get('/stats',
    AdminController.getDashboardStats
);

// ========== UTILISATEURS ==========
router.get('/users', (req, res, next) => AdminController.getUsers(req, res, next));
router.get('/users/:id', (req, res, next) => AdminController.getUser(req, res, next));

router.patch(
    '/users/:id/status',
    auditMiddleware.auditAdminAction(AuditAction.USER_UPDATE, AuditResourceType.USER, AuditSeverity.HIGH),
    (req, res, next) => AdminController.updateUserStatus(req, res, next)
);

// ========== RETRAITS ==========
router.get('/withdrawals', (req, res, next) => AdminController.getWithdrawals(req, res, next));

router.post(
    '/withdrawals/:id/approve',
    auditMiddleware.auditAdminAction(AuditAction.WITHDRAWAL_APPROVE, AuditResourceType.WITHDRAWAL, AuditSeverity.CRITICAL),
    (req, res, next) => AdminController.approveWithdrawal(req, res, next)
);

router.post(
    '/withdrawals/:id/reject',
    auditMiddleware.auditAdminAction(AuditAction.WITHDRAWAL_REJECT, AuditResourceType.WITHDRAWAL, AuditSeverity.HIGH),
    (req, res, next) => AdminController.rejectWithdrawal(req, res, next)
);

// ========== AUDITS ==========
router.get('/audit-logs', (req, res, next) => AdminController.getAuditLogs(req, res, next));

export default router;
