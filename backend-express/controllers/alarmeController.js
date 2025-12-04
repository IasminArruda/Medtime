import db from "../config/db.js";
import { enviarConfirmacaoAlarme } from "../services/sms.service.js";

const Alarme = db.alarmes;
const User = db.users;

export const createAlarme = async (req, res) => {
  try {
    const { nome, dose, intervalo: intervaloRecebido, horaI, duracao, userId, UserId } = req.body;

    console.log("Recebido no createAlarme:", {
      nome,
      dose,
      intervalo: intervaloRecebido,
      horaI,
      duracao,
      userId,
      UserId,
    });

    const finalUserId = UserId || userId;

    if (!nome || !dose || !horaI || (!duracao && duracao !== 0) || !finalUserId) {
      console.error("Falha na validação:", { nome, dose, horaI, duracao, finalUserId });
      return res.status(400).json({
        error: "Campos obrigatórios: nome, dose, horaI, duracao, UserId.",
      });
    }

    const duracaoNum = (() => {
      if (typeof duracao === "number") return duracao;
      if (typeof duracao === "string" && duracao.trim() !== "") {
        const p = Number(duracao);
        return Number.isNaN(p) ? null : p;
      }
      return null;
    })();

    let intervalo = null;
    if (intervaloRecebido !== undefined && intervaloRecebido !== null && intervaloRecebido !== "") {
      const parsed = Number(intervaloRecebido);
      intervalo = !Number.isNaN(parsed) ? parsed : intervaloRecebido;
    } else if (duracaoNum !== null) {
      intervalo = duracaoNum * 60;
    }

    // Monta payload sem propriedades undefined
    const alarmeData = {
      nome,
      dose,
      horaI,
      duracao: duracaoNum !== null ? duracaoNum : undefined,
      UserId: finalUserId,
    };
    if (intervalo !== undefined && intervalo !== null) alarmeData.intervalo = intervalo;

    console.log("Criando alarme com dados:", alarmeData);
    const created = await Alarme.create(alarmeData);
    console.log("Alarme criado com sucesso:", created.toJSON ? created.toJSON() : created);

    // Buscar dados do usuário para obter telefone e enviar SMS de confirmação (se houver)
    try {
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
    } catch (userErr) {
      console.error("⚠️ Erro ao buscar usuário para enviar SMS:", userErr.message);
    }

    return res.status(201).json(created);
  } catch (error) {
    console.error("Erro ao criar alarme:", error);
    // Se for erro Sequelize, traz detalhes úteis para debug
    if (error && error.name && error.name.includes("Sequelize")) {
      return res.status(400).json({ error: error.message, details: error.errors || null });
    }
    return res.status(500).json({ error: "Erro interno ao criar alarme.", details: error.message });
  }
};

// getAlarmesByUser
export const getAlarmesByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("Buscando alarmes para UserId:", userId);
    const list = await Alarme.findAll({ where: { UserId: userId } });
    console.log("Alarmes encontrados:", list.length);
    return res.json(list);
  } catch (error) {
    console.error("Erro ao buscar alarmes:", error);
    return res.status(500).json({ error: "Erro interno ao buscar alarmes." });
  }
};

// editarAlarme
export const editarAlarme = async (req, res) => {
  try {
    const { id } = req.params;
    const { horaI, dose, duracao, intervalo, nome } = req.body;

    const alarme = await Alarme.findByPk(id);
    if (!alarme) {
      return res.status(404).json({ error: "Alarme não encontrado." });
    }

    if (nome !== undefined) alarme.nome = nome;
    if (dose !== undefined) alarme.dose = dose;
    if (horaI !== undefined) alarme.horaI = horaI;
    if (duracao !== undefined) {
      const parsedDur = Number(duracao);
      alarme.duracao = Number.isNaN(parsedDur) ? duracao : parsedDur;
    }
    if (intervalo !== undefined) {
      const parsedInt = Number(intervalo);
      alarme.intervalo = Number.isNaN(parsedInt) ? intervalo : parsedInt;
    }

    await alarme.save();
    return res.json(alarme);
  } catch (error) {
    console.error("Erro ao atualizar alarme:", error);
    return res.status(500).json({ error: "Erro interno ao atualizar alarme." });
  }
};


//  excluirAlarme
export const excluirAlarme = async (req, res) => {
  try {
    const { id } = req.params;

    const alarme = await Alarme.findByPk(id);
    if (!alarme) {
      return res.status(404).json({ error: "Alarme não encontrado." });
    }

    await alarme.destroy();
    return res.json({ message: "Alarme excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir alarme:", error);
    return res.status(500).json({ error: "Erro interno ao excluir alarme." });
  }
};

// excluirTodosAlarmes
export const excluirTodosAlarmes = async (req, res) => {
  try {
    console.log("Iniciando limpeza de todos os alarmes...");
    const resultado = await Alarme.destroy({ where: {} });
    console.log(`${resultado} alarmes foram excluídos.`);
    return res.json({
      message: `${resultado} alarmes foram excluídos com sucesso.`,
      deletedCount: resultado,
    });
  } catch (error) {
    console.error("Erro ao excluir todos os alarmes:", error);
    return res.status(500).json({ error: "Erro interno ao excluir alarmes.", details: error.message });
  }
};
