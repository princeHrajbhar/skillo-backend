import { Router } from 'express';
import { UserController } from './user.controller.js';

const router = Router();
const userController = new UserController();

router.post('/', userController.createUser.bind(userController));

router.get('/', userController.getUsers.bind(userController));

router.get(
  '/lock-status/:email',
  userController.checkLockStatus.bind(userController)
);

router.patch(
  '/:id/verify',
  userController.toggleVerification.bind(userController)
);

router.get('/:id', userController.getUserById.bind(userController));

router.put('/:id', userController.updateUser.bind(userController));

router.delete('/:id', userController.deleteUser.bind(userController));

export default router;