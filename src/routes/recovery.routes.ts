import { Router } from 'express';
import { RecoveryController } from '../controllers/recovery.controller';

const router = Router();
const recoveryController = new RecoveryController();

router.post('/forgot-password', recoveryController.sendEmail);
router.post('/reset-password', recoveryController.resetPassword);

export default router;
