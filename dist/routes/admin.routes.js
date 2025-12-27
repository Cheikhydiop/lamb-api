"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminRoutes = void 0;
const express_1 = require("express");
const ServiceContainer_1 = require("../container/ServiceContainer");
const AdminController_1 = require("../controllers/AdminController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const AuditMiddleware_1 = require("../middlewares/AuditMiddleware");
const asyncHandler_1 = require("../middlewares/asyncHandler");
const createAdminRoutes = () => {
    const router = (0, express_1.Router)();
    const { auditMiddleware } = ServiceContainer_1.ServiceContainer.getInstance();
    // Toutes les routes sont protégées par requireAdmin
    router.use(authMiddleware_1.requireAdmin);
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
    router.post('/fights', auditMiddleware.auditFightCreate(), (0, asyncHandler_1.asyncHandler)(AdminController_1.AdminController.createFight));
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
    router.patch('/fights/:fightId/status', auditMiddleware.auditAdminAction(AuditMiddleware_1.AuditAction.FIGHT_UPDATE, AuditMiddleware_1.AuditResourceType.FIGHT, AuditMiddleware_1.AuditSeverity.MEDIUM), (0, asyncHandler_1.asyncHandler)(AdminController_1.AdminController.updateFightStatus));
    router.post('/fights/:fightId/result', auditMiddleware.auditFightResultSet(), (0, asyncHandler_1.asyncHandler)(AdminController_1.AdminController.validateFightResult));
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
    router.post('/events', auditMiddleware.auditAdminAction(AuditMiddleware_1.AuditAction.SYSTEM_CONFIG_UPDATE, AuditMiddleware_1.AuditResourceType.SYSTEM, AuditMiddleware_1.AuditSeverity.MEDIUM), (0, asyncHandler_1.asyncHandler)(AdminController_1.AdminController.createDayEvent));
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
    router.get('/stats', (0, asyncHandler_1.asyncHandler)(AdminController_1.AdminController.getDashboardStats));
    router.get('/analytics', (0, asyncHandler_1.asyncHandler)(AdminController_1.AdminController.getAnalytics));
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
    router.get('/users', (0, asyncHandler_1.asyncHandler)((req, res, next) => AdminController_1.AdminController.getUsers(req, res, next)));
    router.get('/users/:id', (0, asyncHandler_1.asyncHandler)((req, res, next) => AdminController_1.AdminController.getUser(req, res, next)));
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
    router.patch('/users/:id/status', auditMiddleware.auditAdminAction(AuditMiddleware_1.AuditAction.USER_UPDATE, AuditMiddleware_1.AuditResourceType.USER, AuditMiddleware_1.AuditSeverity.HIGH), (0, asyncHandler_1.asyncHandler)((req, res, next) => AdminController_1.AdminController.updateUserStatus(req, res, next)));
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
    router.get('/withdrawals', (0, asyncHandler_1.asyncHandler)((req, res, next) => AdminController_1.AdminController.getWithdrawals(req, res, next)));
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
    router.post('/withdrawals/:id/approve', auditMiddleware.auditAdminAction(AuditMiddleware_1.AuditAction.WITHDRAWAL_APPROVE, AuditMiddleware_1.AuditResourceType.WITHDRAWAL, AuditMiddleware_1.AuditSeverity.CRITICAL), (0, asyncHandler_1.asyncHandler)((req, res, next) => AdminController_1.AdminController.approveWithdrawal(req, res, next)));
    router.post('/withdrawals/:id/reject', auditMiddleware.auditAdminAction(AuditMiddleware_1.AuditAction.WITHDRAWAL_REJECT, AuditMiddleware_1.AuditResourceType.WITHDRAWAL, AuditMiddleware_1.AuditSeverity.HIGH), (0, asyncHandler_1.asyncHandler)((req, res, next) => AdminController_1.AdminController.rejectWithdrawal(req, res, next)));
    // ========== AUDITS ==========
    router.get('/audit-logs', (0, asyncHandler_1.asyncHandler)((req, res, next) => AdminController_1.AdminController.getAuditLogs(req, res, next)));
    return router;
};
exports.createAdminRoutes = createAdminRoutes;
