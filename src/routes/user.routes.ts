import { Router, Request, Response, NextFunction } from 'express';
import { ServiceContainer } from '../container/ServiceContainer';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

// Helper to get service instance safely
const getUserService = () => ServiceContainer.getInstance().userService;

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
router.get('/profile', requireAuth, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const user = await getUserService().getUserById(userId);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}));

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
router.patch('/profile', requireAuth, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const user = await getUserService().updateUser(userId, req.body);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}));

// Change password
router.post('/change-password', requireAuth, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    await getUserService().changePassword(userId, oldPassword, newPassword);
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
}));

// Get user stats
router.get('/stats', requireAuth, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const stats = await getUserService().getUserStats(userId);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}));

// Deactivate account
router.post('/deactivate', requireAuth, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    await getUserService().deactivateAccount(userId);
    res.json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
}));

// Reactivate account
router.post('/reactivate', requireAuth, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    await getUserService().reactivateAccount(userId);
    res.json({
      success: true,
      message: 'Account reactivated successfully',
    });
  } catch (error) {
    next(error);
  }
}));

// Admin: List all users
router.get('/', requireRole('ADMIN'), asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const users = await getUserService().listUsers(limit, offset);
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}));

// Admin: Get user by ID
router.get('/:userId', requireRole('ADMIN'), asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUserService().getUserById(req.params.userId);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}));

// Admin: Delete user
router.delete('/:userId', requireRole('ADMIN'), asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userResult = await getUserService().deleteUser(req.params.userId);
    res.json({
      success: true,
      message: 'User deleted successfully',
      data: userResult,
    });
    // Note: deleteUser signature returns something? adjusted to expect return or just void
  } catch (error) {
    next(error);
  }
}));

export default router;
