const db = require('../config/db');
const User = db.users;
const bcrypt = require('bcryptjs');


exports.cadastro = async (req, res) => {
  const { nome, email, senha } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(senha, salt);

    const newUser = await User.create({
      nome: nome,
      email: email,
      senha: hash
    });

    res.status(201).json(newUser);

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
};

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const match = await bcrypt.compare(senha, user.senha);
    if (!match) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const userData = user.toJSON();

    res.status(200).json({
      id: userData.id,
      nome: userData.nome,
      email: userData.email,
      perfil: userData.role
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no login.' });
  }
};

// Retorna usuário por id
exports.getUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const u = user.toJSON();
    res.json({ id: u.id, nome: u.nome, email: u.email, perfil: u.role, phone: u.phone });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
};

// Atualiza usuário (nome, email, phone)
exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { nome, email, phone } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    // Atualiza apenas campos permitidos
    if (nome !== undefined) user.nome = nome;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;

    await user.save();
    const u = user.toJSON();
    res.json({ id: u.id, nome: u.nome, email: u.email, perfil: u.role, phone: u.phone });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
};

// Exclui usuário
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    await user.destroy();
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
};
