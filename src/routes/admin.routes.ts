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

    /**
     * @swagger
     * tags:
     *   name: Admin
     *   description: Administrative operations
     */

    /**
     * @swagger
     * /api/admin/fights:
     *   post:
     *     summary: Create a new fight
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               title:
     *                 type: string
     *               fighterAId:
     *                 type: string
     *               fighterBId:
     *                 type: string
     *               scheduledAt:
     *                 type: string
     *                 format: date-time
     *     responses:
     *       201:
     *         description: Fight created
     */

    router.post(
        '/fights',
        auditMiddleware.auditFightCreate(),
        asyncHandler(AdminController.createFight)
    );

    /**
     * @swagger
     * /api/admin/fights/{fightId}/status:
     *   patch:
     *     summary: Update fight status
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: fightId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               status:
     *                 type: string
     *                 enum: [PENDING, ONGOING, COMPLETED, CANCELLED]
     *     responses:
     *       200:
     *         description: Fight status updated
     */
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

    /**
     * @swagger
     * /api/admin/events:
     *   post:
     *     summary: Create a new day event
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       201:
     *         description: Event created
     */
    router.post(
        '/events',
        auditMiddleware.auditAdminAction(AuditAction.SYSTEM_CONFIG_UPDATE, AuditResourceType.SYSTEM, AuditSeverity.MEDIUM),
        asyncHandler(AdminController.createDayEvent)
    );

    /**
     * @swagger
     * /api/admin/stats:
     *   get:
     *     summary: Get dashboard stats
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Dashboard statistics
     */
    router.get('/stats',
        asyncHandler(AdminController.getDashboardStats)
    );

    router.get('/analytics',
        asyncHandler(AdminController.getAnalytics)
    );

    // ========== UTILISATEURS ==========

    /**
     * @swagger
     * /api/admin/users:
     *   get:
     *     summary: List users
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: List of users
     */
    router.get('/users', asyncHandler((req, res, next) => AdminController.getUsers(req, res, next)));
    router.get('/users/:id', asyncHandler((req, res, next) => AdminController.getUser(req, res, next)));

    /**
     * @swagger
     * /api/admin/users/{id}/status:
     *   patch:
     *     summary: Update user status (ban/unban)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               active:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: User status updated
     */
    router.patch(
        '/users/:id/status',
        auditMiddleware.auditAdminAction(AuditAction.USER_UPDATE, AuditResourceType.USER, AuditSeverity.HIGH),
        asyncHandler((req, res, next) => AdminController.updateUserStatus(req, res, next))
    );

    // ========== RETRAITS ==========

    /**
     * @swagger
     * /api/admin/withdrawals:
     *   get:
     *     summary: List withdrawals
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of withdrawals
     */
    router.get('/withdrawals', asyncHandler((req, res, next) => AdminController.getWithdrawals(req, res, next)));

    /**
     * @swagger
     * /api/admin/withdrawals/{id}/approve:
     *   post:
     *     summary: Approve withdrawal
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Withdrawal approved
     */
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
