import { Router } from 'express';
import * as hostingerEmailWebhookController from '../controllers/hostingerEmailWebhook.controller';
import { verifyHostingerEmailWebhook } from '../middlewares/hostingerWebhookAuth.middleware';

const router = Router();

router.post('/email', verifyHostingerEmailWebhook, hostingerEmailWebhookController.receiveEmailEvent);

export default router;
