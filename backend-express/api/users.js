const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/cadastro', userController.cadastro);
router.post('/login', userController.login);

// Rotas para obter, atualizar e excluir usuário (usadas pelo frontend)
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
