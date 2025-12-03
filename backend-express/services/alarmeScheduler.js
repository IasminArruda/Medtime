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
        if (alarme.horaI === horaAtual) {
          const usuario = alarme.User;

          if (!usuario) {
            console.warn(`⚠️ Alarme ${alarme.id} não possui usuário associado`);
            continue;
          }

          if (!usuario.phone) {
            console.warn(`⚠️ Usuário ${usuario.nome} (ID: ${usuario.id}) não possui telefone cadastrado`);
            continue;
          }

          await smsService.enviarNotificacaoAlarme(
            usuario.phone,
            alarme.nome,
            alarme.dose,
            alarme.horaI
          );

          console.log(`✅ Notificação enviada para ${usuario.nome} - Medicamento: ${alarme.nome}`);
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

export function iniciarScheduler() {
  console.log('🚀 Iniciando verificador de alarmes...');

  verificarEEnviarNotificacoes();

  const intervalo = setInterval(verificarEEnviarNotificacoes, 60000);

  return intervalo;
}
