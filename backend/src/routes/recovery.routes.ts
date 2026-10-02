import { Router } from 'express';
import { RecoveryController } from '../controllers/recovery.controller';
import { clientAuthMiddleware } from '../middlewares/clientAuth.middleware';

const router = Router();
const recoveryController = new RecoveryController();

router.post('/forgot-password', clientAuthMiddleware, recoveryController.sendEmail);
router.post('/reset-password', recoveryController.resetPassword);

export default router;
