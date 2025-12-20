import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { UserService } from '../services/user.service';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();
const userService = Container.get(UserService);

// Get current user profile
router.get('/profile', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const user = await userService.getUserById(userId);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.patch('/profile', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const user = await userService.updateUser(userId, req.body);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    await userService.changePassword(userId, oldPassword, newPassword);
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get user stats
router.get('/stats', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const stats = await userService.getUserStats(userId);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Deactivate account
router.post('/deactivate', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    await userService.deactivateAccount(userId);
    res.json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Reactivate account
router.post('/reactivate', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    await userService.reactivateAccount(userId);
    res.json({
      success: true,
      message: 'Account reactivated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Admin: List all users
router.get('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const users = await userService.listUsers(limit, offset);
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Get user by ID
router.get('/:userId', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.params.userId);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Delete user
router.delete('/:userId', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.deleteUser(req.params.userId);
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
