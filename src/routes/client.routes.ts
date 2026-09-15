import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { requireSuperAdmin } from '../middlewares/superAdmin.middleware';

const router = Router();
const clientController = new ClientController();

// Todas las operaciones de gestión de clientes requieren privilegios de Super Administrador
router.use(requireSuperAdmin);

router.post('/', clientController.create);
router.get('/', clientController.list);
router.post('/:id/regenerate-key', clientController.regenerateKey);
router.delete('/:id', clientController.delete);

export default router;
