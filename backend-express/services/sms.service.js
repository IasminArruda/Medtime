import 'dotenv/config';
import axios from 'axios';

const CHATPRO_BASE_URL = 'https://v5.chatpro.com.br';
const CHATPRO_API_KEY = process.env.CHATPRO_API_KEY;
const CHATPRO_INSTANCE_ID = process.env.CHATPRO_INSTANCE_ID;

function formatarNumero(telefone) {
  if (!telefone) return null;
  let numero = String(telefone).trim();

  // Remove todos os caracteres não numéricos
  numero = numero.replace(/\D/g, '');

  // Se começar com 55, remove para deixar só os dígitos do número
  if (numero.startsWith('55')) {
    numero = numero.substring(2);
  }

  return numero;
}

export async function enviarSMS(telefone, mensagem) {
  try {
    if (!CHATPRO_API_KEY || !CHATPRO_INSTANCE_ID) {
      throw new Error('ChatPro não configurado: verifique CHATPRO_API_KEY e CHATPRO_INSTANCE_ID no .env');
    }

    if (!telefone || !mensagem) {
      throw new Error('Telefone e mensagem são obrigatórios');
    }

    const numero = formatarNumero(telefone);

    console.log(`📱 Enviando mensagem via ChatPro para ${numero}`);

    const payload = {
      number: numero,
      message: mensagem
    };

    const headers = {
      'Authorization': CHATPRO_API_KEY,
      'Content-Type': 'application/json'
    };

    const url = `${CHATPRO_BASE_URL}/${CHATPRO_INSTANCE_ID}/api/v1/send_message`;

    const resp = await axios.post(url, payload, { headers });

    console.log(`✅ Mensagem enviada via ChatPro - status: ${resp.status}`);

    return {
      sucesso: true,
      status: resp.status,
      data: resp.data,
      telefone: numero,
      timestamp: new Date()
    };
  } catch (err) {
    const details = err?.response?.data || err.message || err;
    console.error('❌ Erro ao enviar mensagem ChatPro:', details);
    const error = new Error('Falha ao enviar mensagem: ' + (typeof details === 'string' ? details : JSON.stringify(details)));
    error.original = err;
    throw error;
  }
}

export async function enviarNotificacaoAlarme(telefone, nomeRemedio, dose, horaI) {
  const mensagem = `🏥 MEDTIME - Lembrete de Medicamento\n\nMedicamento: ${nomeRemedio}\nDose: ${dose}\nHora: ${horaI}\n\nNão esqueça de tomar seu medicamento! 💊`;
  return enviarSMS(telefone, mensagem);
}

export async function enviarConfirmacaoAlarme(telefone, nomeRemedio) {
  const mensagem = `✅ MEDTIME - Alarme Criado\n\nSeu alarme para "${nomeRemedio}" foi criado com sucesso!\n\nVocê receberá lembretes nos horários agendados.`;
  return enviarSMS(telefone, mensagem);
}
