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
const typedi_1 = require("typedi");
const user_service_1 = require("../services/user.service");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const userService = typedi_1.Container.get(user_service_1.UserService);
// Get current user profile
router.get('/profile', authMiddleware_1.requireAuth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const user = yield userService.getUserById(userId);
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
}));
// Update user profile
router.patch('/profile', authMiddleware_1.requireAuth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const user = yield userService.updateUser(userId, req.body);
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
}));
// Change password
router.post('/change-password', authMiddleware_1.requireAuth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const { oldPassword, newPassword, confirmPassword } = req.body;
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match',
            });
        }
        yield userService.changePassword(userId, oldPassword, newPassword);
        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        next(error);
    }
}));
// Get user stats
router.get('/stats', authMiddleware_1.requireAuth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const stats = yield userService.getUserStats(userId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
}));
// Deactivate account
router.post('/deactivate', authMiddleware_1.requireAuth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        yield userService.deactivateAccount(userId);
        res.json({
            success: true,
            message: 'Account deactivated successfully',
        });
    }
    catch (error) {
        next(error);
    }
}));
// Reactivate account
router.post('/reactivate', authMiddleware_1.requireAuth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        yield userService.reactivateAccount(userId);
        res.json({
            success: true,
            message: 'Account reactivated successfully',
        });
    }
    catch (error) {
        next(error);
    }
}));
// Admin: List all users
router.get('/', authMiddleware_1.requireAdmin, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = parseInt(req.query.offset) || 0;
        const users = yield userService.listUsers(limit, offset);
        res.json({
            success: true,
            data: users,
        });
    }
    catch (error) {
        next(error);
    }
}));
// Admin: Get user by ID
router.get('/:userId', authMiddleware_1.requireAdmin, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield userService.getUserById(req.params.userId);
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
}));
// Admin: Delete user
router.delete('/:userId', authMiddleware_1.requireAdmin, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield userService.deleteUser(req.params.userId);
        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
