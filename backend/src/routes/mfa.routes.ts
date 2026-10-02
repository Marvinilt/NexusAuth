import { Router } from 'express';
import { MfaController } from '../controllers/mfa.controller';
import { authRequired, mfaPendingRequired } from '../middlewares/auth.middleware';

const router = Router();
const mfaController = new MfaController();

router.post('/setup', authRequired, mfaController.setup);
router.post('/verify-setup', authRequired, mfaController.verify);
router.post('/verify-login', mfaPendingRequired, mfaController.loginVerify);

export default router;
