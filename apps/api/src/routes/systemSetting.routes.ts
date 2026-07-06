import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@buymedicines/shared';
import * as systemSettingController from '../controllers/systemSetting.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate, requireRole(Role.ADMIN));
router.get('/otp-bypass', systemSettingController.getOtpBypass);
router.patch('/otp-bypass', validate({ body: z.object({ enabled: z.boolean() }) }), systemSettingController.setOtpBypass);

export default router;
