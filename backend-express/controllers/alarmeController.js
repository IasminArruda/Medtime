import db from "../config/db.js";
import { enviarConfirmacaoAlarme } from "../services/sms.service.js";

const Alarme = db.alarmes;
const User = db.users;

// Criar um alarme associado a um usuário
export const createAlarme = async (req, res) => {
  try {
    const { nome, dose, horaI, duracao, userId, UserId } = req.body;

    console.log("Recebido no createAlarme:", { nome, dose, horaI, duracao, userId, UserId });

    const finalUserId = UserId || userId;

    // Validação de campos obrigatórios
    if (!nome || !dose || !horaI || !duracao || !finalUserId) {
      console.error("Falha na validação:", { nome, dose, horaI, duracao, finalUserId });
      return res
        .status(400)
        .json({ error: "Campos obrigatórios: nome, dose, horaI, duracao, UserId." });
    }

    const alarmeData = {
      nome: nome,
      dose: dose,
      horaI: horaI,
      duracao: Number(duracao),
      UserId: finalUserId,
    };

    console.log("Criando alarme com dados:", alarmeData);
    const created = await Alarme.create(alarmeData);
    console.log("Alarme criado com sucesso:", created.toJSON ? created.toJSON() : created);

    // Buscar dados do usuário para obter telefone
    const usuario = await User.findByPk(finalUserId);
    if (usuario && usuario.phone) {
      try {
        await enviarConfirmacaoAlarme(usuario.phone, nome);
        console.log(`✅ SMS de confirmação enviado para ${usuario.phone}`);
      } catch (smsError) {
        console.error("⚠️ Aviso: Erro ao enviar SMS de confirmação:", smsError.message);
      }
    } else {
      console.warn("⚠️ Usuário não possui telefone cadastrado");
    }

    res.status(201).json(created);
  } catch (error) {
    console.error("Erro ao criar alarme:", error);
    res.status(500).json({ error: "Erro interno ao criar alarme.", details: error.message });
  }
};

// Listar alarmes por usuário
export const getAlarmesByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("Buscando alarmes para UserId:", userId);
    const list = await Alarme.findAll({ where: { UserId: userId } });
    console.log("Alarmes encontrados:", list.length);
    res.json(list);
  } catch (error) {
    console.error("Erro ao buscar alarmes:", error);
    res.status(500).json({ error: "Erro interno ao buscar alarmes." });
  }
};

// Atualizar alarme
export const editarAlarme = async (req, res) => {
  try {
    const { id } = req.params;
    const { horaI, dose, duracao } = req.body;

    const alarme = await Alarme.findByPk(id);
    if (!alarme) {
      return res.status(404).json({ error: "Alarme não encontrado." });
    }

    // Atualizar campos fornecidos
    if (horaI) alarme.horaI = horaI;
    if (dose) alarme.dose = dose;
    if (duracao) alarme.duracao = duracao;

    await alarme.save();
    res.json(alarme);
  } catch (error) {
    console.error("Erro ao atualizar alarme:", error);
    res.status(500).json({ error: "Erro interno ao atualizar alarme." });
  }
};

// Excluir alarme
export const excluirAlarme = async (req, res) => {
  try {
    const { id } = req.params;

    const alarme = await Alarme.findByPk(id);
    if (!alarme) {
      return res.status(404).json({ error: "Alarme não encontrado." });
    }

    await alarme.destroy();
    res.json({ message: "Alarme excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir alarme:", error);
    res.status(500).json({ error: "Erro interno ao excluir alarme." });
  }
};

// Excluir TODOS os alarmes
export const excluirTodosAlarmes = async (req, res) => {
  try {
    console.log("Iniciando limpeza de todos os alarmes...");
    const resultado = await Alarme.destroy({ where: {} });
    console.log(`${resultado} alarmes foram excluídos.`);
    res.json({
      message: `${resultado} alarmes foram excluídos com sucesso.`,
      deletedCount: resultado,
    });
  } catch (error) {
    console.error("Erro ao excluir todos os alarmes:", error);
    res.status(500).json({ error: "Erro interno ao excluir alarmes.", details: error.message });
  }
};
