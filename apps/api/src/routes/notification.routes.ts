import { Router } from 'express';
import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from '@buymedicines/shared';
import * as notificationController from '../controllers/notification.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: paginationQuerySchema }), notificationController.list);
router.patch('/:id/read', validate({ params: z.object({ id: objectIdSchema }) }), notificationController.markRead);
router.patch('/read-all', notificationController.markAllRead);
router.post('/fcm-token', validate({ body: z.object({ token: z.string().min(10) }) }), notificationController.registerFcmToken);

export default router;
