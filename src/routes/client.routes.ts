import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';

const router = Router();
const clientController = new ClientController();

// Nota: En un entorno de producción real, estas rutas deberían estar protegidas
// por un middleware de "Super Admin" para evitar que cualquiera cree sistemas clientes.
router.post('/', clientController.create);
router.get('/', clientController.list);
router.delete('/:id', clientController.delete);

export default router;
