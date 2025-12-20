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
const express_1 = require("express");
const ServiceContainer_1 = require("../container/ServiceContainer");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const asyncHandler_1 = require("../middlewares/asyncHandler");
const router = (0, express_1.Router)();
// Helper to get service instance safely
const getUserService = () => ServiceContainer_1.ServiceContainer.getInstance().userService;
/**
 * @swagger
 * tags:
 *   name: User
 *   description: User profile management
 */
/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
// Get current user profile
router.get('/profile', authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const user = yield getUserService().getUserById(userId);
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
})));
/**
 * @swagger
 * /api/user/profile:
 *   patch:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
// Update user profile
router.patch('/profile', authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const user = yield getUserService().updateUser(userId, req.body);
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
})));
// Change password
router.post('/change-password', authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const { oldPassword, newPassword, confirmPassword } = req.body;
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match',
            });
        }
        yield getUserService().changePassword(userId, oldPassword, newPassword);
        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        next(error);
    }
})));
// Get user stats
router.get('/stats', authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const stats = yield getUserService().getUserStats(userId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
})));
// Deactivate account
router.post('/deactivate', authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        yield getUserService().deactivateAccount(userId);
        res.json({
            success: true,
            message: 'Account deactivated successfully',
        });
    }
    catch (error) {
        next(error);
    }
})));
// Reactivate account
router.post('/reactivate', authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        yield getUserService().reactivateAccount(userId);
        res.json({
            success: true,
            message: 'Account reactivated successfully',
        });
    }
    catch (error) {
        next(error);
    }
})));
// Admin: List all users
router.get('/', (0, authMiddleware_1.requireRole)('ADMIN'), (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = parseInt(req.query.offset) || 0;
        const users = yield getUserService().listUsers(limit, offset);
        res.json({
            success: true,
            data: users,
        });
    }
    catch (error) {
        next(error);
    }
})));
// Admin: Get user by ID
router.get('/:userId', (0, authMiddleware_1.requireRole)('ADMIN'), (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield getUserService().getUserById(req.params.userId);
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
})));
// Admin: Delete user
router.delete('/:userId', (0, authMiddleware_1.requireRole)('ADMIN'), (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userResult = yield getUserService().deleteUser(req.params.userId);
        res.json({
            success: true,
            message: 'User deleted successfully',
            data: userResult,
        });
        // Note: deleteUser signature returns something? adjusted to expect return or just void
    }
    catch (error) {
        next(error);
    }
})));
exports.default = router;
