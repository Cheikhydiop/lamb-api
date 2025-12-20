"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const typedi_1 = require("typedi");
const AdminController_1 = require("../controllers/AdminController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const AuditMiddleware_1 = require("../middlewares/AuditMiddleware");
const router = (0, express_1.Router)();
const auditMiddleware = typedi_1.Container.get(AuditMiddleware_1.AuditMiddleware);
// Toutes les routes sont protégées par requireAdmin
router.use(authMiddleware_1.requireAdmin);
router.post('/fights', auditMiddleware.auditFightCreate(), AdminController_1.AdminController.createFight);
router.patch('/fights/:fightId/status', auditMiddleware.auditAdminAction(AuditMiddleware_1.AuditAction.FIGHT_UPDATE, AuditMiddleware_1.AuditResourceType.FIGHT, AuditMiddleware_1.AuditSeverity.MEDIUM), AdminController_1.AdminController.updateFightStatus);
router.post('/fights/:fightId/result', auditMiddleware.auditFightResultSet(), AdminController_1.AdminController.validateFightResult);
router.post('/events', auditMiddleware.auditAdminAction(AuditMiddleware_1.AuditAction.SYSTEM_CONFIG_UPDATE, AuditMiddleware_1.AuditResourceType.SYSTEM, AuditMiddleware_1.AuditSeverity.MEDIUM), AdminController_1.AdminController.createDayEvent);
router.get('/stats', AdminController_1.AdminController.getDashboardStats);
// ========== UTILISATEURS ==========
router.get('/users', (req, res, next) => AdminController_1.AdminController.getUsers(req, res, next));
router.get('/users/:id', (req, res, next) => AdminController_1.AdminController.getUser(req, res, next));
router.patch('/users/:id/status', auditMiddleware.auditAdminAction(AuditMiddleware_1.AuditAction.USER_UPDATE, AuditMiddleware_1.AuditResourceType.USER, AuditMiddleware_1.AuditSeverity.HIGH), (req, res, next) => AdminController_1.AdminController.updateUserStatus(req, res, next));
// ========== RETRAITS ==========
router.get('/withdrawals', (req, res, next) => AdminController_1.AdminController.getWithdrawals(req, res, next));
router.post('/withdrawals/:id/approve', auditMiddleware.auditAdminAction(AuditMiddleware_1.AuditAction.WITHDRAWAL_APPROVE, AuditMiddleware_1.AuditResourceType.WITHDRAWAL, AuditMiddleware_1.AuditSeverity.CRITICAL), (req, res, next) => AdminController_1.AdminController.approveWithdrawal(req, res, next));
router.post('/withdrawals/:id/reject', auditMiddleware.auditAdminAction(AuditMiddleware_1.AuditAction.WITHDRAWAL_REJECT, AuditMiddleware_1.AuditResourceType.WITHDRAWAL, AuditMiddleware_1.AuditSeverity.HIGH), (req, res, next) => AdminController_1.AdminController.rejectWithdrawal(req, res, next));
// ========== AUDITS ==========
router.get('/audit-logs', (req, res, next) => AdminController_1.AdminController.getAuditLogs(req, res, next));
exports.default = router;
