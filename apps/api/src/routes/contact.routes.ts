import { Router } from 'express';
import { contactMessageSchema } from '@healthmart/shared';
import * as contactController from '../controllers/contact.controller';
import { validate } from '../middlewares/validate.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/', authRateLimiter, validate({ body: contactMessageSchema }), contactController.submit);

export default router;
