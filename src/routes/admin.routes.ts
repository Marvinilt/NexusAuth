import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { requireSuperAdmin } from '../middlewares/superAdmin.middleware';

const router = Router();
const adminController = new AdminController();

// Todas las rutas de administración están protegidas por el middleware de Super Administrador
router.use(requireSuperAdmin);

router.get('/stats', adminController.getStats);
router.get('/logs', adminController.getLogs);
router.get('/users', adminController.getUsers);
router.post('/users/:id/reset-mfa', adminController.resetUserMfa);

export default router;
