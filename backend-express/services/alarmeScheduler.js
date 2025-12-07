import db from '../config/db.js';
import * as smsService from '../services/sms.service.js';

const Alarme = db.alarmes;
const User = db.users;

async function verificarEEnviarNotificacoes() {
  try {
    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    console.log(`\n⏰ [${new Date().toLocaleString('pt-BR')}] Verificando alarmes para hora: ${horaAtual}`);

    const alarmes = await Alarme.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'nome', 'phone']
        }
      ]
    });

    if (alarmes.length === 0) {
      console.log('ℹ️ Nenhum alarme encontrado');
      return;
    }

    let notificacoesEnviadas = 0;
    let errosOcorridos = 0;

    for (const alarme of alarmes) {
      try {
        const horariosDoAlarme = gerarHorariosDoAlarme(alarme.horaI, alarme.intervalo, alarme.duracao);

        // Se o horário atual bater com qualquer horário calculado, envie notificação
        if (horariosDoAlarme.includes(horaAtual)) {
          const usuario = alarme.User;

          if (!usuario) {
            console.warn(`⚠️ Alarme ${alarme.id} não possui usuário associado`);
            continue;
          }

          if (!usuario.phone) {
            console.warn(`⚠️ Usuário ${usuario.nome} (ID: ${usuario.id}) não possui telefone cadastrado`);
            continue;
          }

          // Enviar notificação
          await smsService.enviarNotificacaoAlarme(
            usuario.phone,
            alarme.nome,
            alarme.dose,
            horaAtual
          );

          console.log(`✅ Notificação enviada para ${usuario.nome} - Medicamento: ${alarme.nome} - Horário: ${horaAtual}`);
          notificacoesEnviadas++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar alarme ${alarme.id}:`, error.message);
        errosOcorridos++;
      }
    }

    console.log(`📊 Resumo: ${notificacoesEnviadas} notificação(ões) enviada(s), ${errosOcorridos} erro(s)`);
  } catch (error) {
    console.error('❌ Erro crítico ao verificar alarmes:', error);
  }
}

function gerarHorariosDoAlarme(horaInicial, intervaloHoras, duracaoDias) {
  try {
    const horarios = [];
    const intervalo = Number(intervaloHoras) || 24;
    const duracao = Number(duracaoDias) || 1;
    if (!horaInicial || isNaN(intervalo) || intervalo <= 0 || isNaN(duracao) || duracao <= 0) return horarios;

    const [hh, mm] = (horaInicial || '00:00').split(':').map(s => Number(s));
    const start = new Date();
    start.setHours(hh || 0, mm || 0, 0, 0);

    const dosesPerDay = Math.floor(24 / intervalo) || 1;
    const totalDoses = dosesPerDay * duracao;

    for (let i = 0; i < totalDoses; i++) {
      const horarioAtual = new Date(start.getTime() + i * intervalo * 60 * 60 * 1000);
      const hhStr = String(horarioAtual.getHours()).padStart(2, '0');
      const mmStr = String(horarioAtual.getMinutes()).padStart(2, '0');
      horarios.push(`${hhStr}:${mmStr}`);
    }

    return horarios;
  } catch (e) {
    return [];
  }
}

export function iniciarScheduler() {
  console.log('🚀 Iniciando verificador de alarmes...');

  verificarEEnviarNotificacoes();

  const intervalo = setInterval(verificarEEnviarNotificacoes, 60000);

  return intervalo;
}
