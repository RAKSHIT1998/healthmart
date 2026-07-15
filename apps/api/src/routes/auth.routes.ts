import { Router } from 'express';
import {
  createStaffUserSchema,
  customerLoginSchema,
  customerSignupSchema,
  forgotPasswordSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  sendOtpSchema,
  staffLoginSchema,
  verifyOtpSchema,
} from '@buymedicines/shared';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { Role } from '@buymedicines/shared';
import { authRateLimiter, otpRateLimiter } from '../middlewares/rateLimiter.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as userService from '../services/user.service';

const router = Router();

router.post('/signup', authRateLimiter, validate({ body: customerSignupSchema }), authController.signup);
router.post('/login', authRateLimiter, validate({ body: customerLoginSchema }), authController.login);
router.post('/otp/request', otpRateLimiter, validate({ body: sendOtpSchema }), authController.requestOtp);
router.post('/otp/verify', authRateLimiter, validate({ body: verifyOtpSchema }), authController.verifyOtp);
router.post('/forgot-password', otpRateLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', authRateLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword);
router.post('/staff/login', authRateLimiter, validate({ body: staffLoginSchema }), authController.staffLogin);
router.post('/refresh', validate({ body: refreshTokenSchema }), authController.refresh);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);

router.post(
  '/staff/register',
  authenticate,
  requireRole(Role.ADMIN),
  validate({ body: createStaffUserSchema }),
  asyncHandler(async (req, res) => {
    const user = await userService.createStaffUser(req.body);
    sendSuccess(res, user, 'Staff account created', 201);
  }),
);

export default router;
