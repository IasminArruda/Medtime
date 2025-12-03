const express = require('express');
const router = express.Router();
const alarmeController = require('../controllers/alarmeController');

router.post('/', alarmeController.createAlarme);
router.get('/user/:userId', alarmeController.getAlarmesByUser);
router.patch('/:id', alarmeController.editarAlarme);
router.delete('/:id', alarmeController.excluirAlarme);
router.delete('/', alarmeController.excluirTodosAlarmes);

module.exports = router;
