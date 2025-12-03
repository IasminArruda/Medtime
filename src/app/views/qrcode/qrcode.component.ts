import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from 'src/app/services/translation.service';
import { AlarmeService } from 'src/app/services/alarme.service';
import { AuthService } from 'src/app/services/auth.service';

interface AlarmeAgendado {
  id: string | number; // ID do banco de dados (número) ou local (string)
  nome: string;
  dose: string;
  horaI: string; // hora inicial
  duracao: number;
  intervalo: number; // Intervalo entre doses (horas)
  dataCriacao: number; // timestamp
  userId: string | number;
  horarios: Array<{ horario: string; dose: string; dia: number }>; // sequência de horários
}

@Component({
  selector: 'app-qrcode',
  templateUrl: './qrcode.component.html',
  styleUrls: ['./qrcode.component.scss']
})
export class QrcodeComponent implements OnInit {
  qrData: any = null; // Array de medicamentos ou medicamento único
  medicamentos: any[] = []; // Lista de medicamentos do QR code
  medicamentoSelecionado: any = null; // Medicamento atualmente selecionado
  horaInicial: string = '';
  schedule: Array<{ horario: string; dose: string; dia: number }> = [];
  saving = false;

  // Propriedades para gerenciar alarmes
  alarmes: AlarmeAgendado[] = [];
  userId: string | number | null = null;
  editandoAlarmeId: string | number | null = null;
  editHoraInicio: string = '';
  editDose: string = '';
  editDuracao: number = 0;
  mensagem: string = '';
  mensagemStatus: string = '';

  private readonly STORAGE_KEY = 'medtime_alarmes_agendados';

  constructor(private router: Router, private alarmeService: AlarmeService, private authService: AuthService, private translation: TranslationService) { }

  ngOnInit(): void {
    const state: any = window.history.state || {};
    this.qrData = state.qrData || null;
    // If no qrData (navigated from menu 'Ver Programação'), do not redirect
    // to scanner — just load scheduled alarms from storage and allow the
    // user to view existing programações. qrData will be null in that case.

    // Processar medicamentos - pode ser array ou objeto único
    if (!this.qrData) {
      // Navegado a partir do menu 'Ver Programação' — sem dados escaneados.
      // Apenas inicializar listas vazias e carregar alarmes do storage.
      this.medicamentos = [];
      this.medicamentoSelecionado = null;
    } else {
      if (Array.isArray(this.qrData)) {
        this.medicamentos = this.qrData;
      } else if (this.qrData.medicamentos && Array.isArray(this.qrData.medicamentos)) {
        this.medicamentos = this.qrData.medicamentos;
      } else {
        // Se for um medicamento único, converter para array
        this.medicamentos = [this.qrData];
      }

      // Selecionar o primeiro medicamento por padrão
      if (this.medicamentos.length > 0) {
        this.medicamentoSelecionado = this.medicamentos[0];
      }
    }

    const user = this.authService.getUsuario();
    this.userId = user?.id || null;
    if (!this.userId) {
      window.alert(this.translation.instant('QRCODE.ALERT_NO_USER'));
      this.router.navigate(['/login']);
      return;
    }

    // Carregar alarmes do localStorage
    this.carregarAlarmesDoStorage();
  }

  /**
   * Carrega alarmes do localStorage para o usuário atual
   */
  private carregarAlarmesDoStorage(): void {
    try {
      const todosAlarmes = localStorage.getItem(this.STORAGE_KEY);
      if (todosAlarmes) {
        const alarmesParsed: AlarmeAgendado[] = JSON.parse(todosAlarmes);
        // Filtrar apenas os alarmes do usuário atual
        this.alarmes = alarmesParsed.filter(a => a.userId === this.userId);
        console.log(`Carregados ${this.alarmes.length} alarmes do localStorage`);
      }
    } catch (error) {
      console.error('Erro ao carregar alarmes do localStorage:', error);
      this.alarmes = [];
    }
  }

  /**
   * Salva alarmes no localStorage
   */
  private salvarAlarmesNoStorage(): void {
    try {
      const todosAlarmes = localStorage.getItem(this.STORAGE_KEY);
      let alarmesParsed: AlarmeAgendado[] = todosAlarmes ? JSON.parse(todosAlarmes) : [];

      // Remover alarmes antigos do usuário atual
      alarmesParsed = alarmesParsed.filter(a => a.userId !== this.userId);

      // Adicionar novos alarmes
      alarmesParsed.push(...this.alarmes);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(alarmesParsed));
      console.log('Alarmes salvos no localStorage');
    } catch (error) {
      console.error('Erro ao salvar alarmes no localStorage:', error);
    }
  }

  /**
   * Gera uma série de horários de alarme para o medicamento selecionado
   */
  gerarSchedule() {
    if (!this.horaInicial) {
      window.alert(this.translation.instant('QRCODE.ALERT_CHOOSE_START'));
      return;
    }

    if (!this.medicamentoSelecionado) {
      window.alert(this.translation.instant('QRCODE.ALERT_SELECT_MEDICINE'));
      return;
    }

    const intervaloHoras = Number(this.medicamentoSelecionado.intervalo) || 24;
    const duracaoDias = Number(this.medicamentoSelecionado.duracao) || 1;
    const dose = this.medicamentoSelecionado.dose || '';

    if (intervaloHoras <= 0 || duracaoDias <= 0) {
      window.alert(this.translation.instant('QRCODE.ALERT_INTERVAL_DURATION'));
      return;
    }

    this.schedule = [];
    const [hh, mm] = this.horaInicial.split(':').map(s => Number(s));

    let dataAtual = new Date();
    dataAtual.setHours(hh, mm, 0, 0);

    const dosesPerDay = Math.floor(24 / intervaloHoras);
    const totalDoses = dosesPerDay * duracaoDias;

    for (let i = 0; i < totalDoses; i++) {
      const horarioAtual = new Date(dataAtual.getTime() + i * intervaloHoras * 60 * 60 * 1000);
      const dia = Math.floor(i / dosesPerDay) + 1;
      const horarioFormatado = horarioAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      this.schedule.push({
        horario: horarioFormatado,
        dose: dose,
        dia: dia
      });
    }
  }

  /**
   * Confirma e salva o alarme (apenas um registro no banco com info básicas)
   * Os horários são salvos no localStorage
   */
  confirmarAlarme() {
    if (this.schedule.length === 0) {
      window.alert(this.translation.instant('QRCODE.ALERT_GENERATE_BEFORE_CONFIRM'));
      return;
    }

    if (!this.userId) {
      window.alert('Usuário não identificado. Faça login.');
      this.router.navigate(['/login']);
      return;
    }

    // Criar um ID único temporário para este alarme (será substituído pelo ID do banco depois)
    const alarmeIdTemp = `alarme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Criar objeto do alarme agendado (com horários no localStorage)
    const novoAlarme: AlarmeAgendado = {
      id: alarmeIdTemp, // ID temporário, será atualizado quando o banco responder
      nome: this.medicamentoSelecionado.nome || 'Medicamento',
      dose: this.medicamentoSelecionado.dose || '',
      horaI: this.horaInicial,
      duracao: Number(this.medicamentoSelecionado.duracao) || 1,
      intervalo: Number(this.medicamentoSelecionado.intervalo) || 24,
      dataCriacao: Date.now(),
      userId: this.userId,
      horarios: [...this.schedule] // Cópia da sequência de horários
    };

    this.saving = true;

    // Salvar um registro no banco de dados (opcional, apenas para histórico)
    const payloadBanco = {
      nome: novoAlarme.nome,
      dose: novoAlarme.dose,
      horaI: novoAlarme.horaI,
      duracao: Number(novoAlarme.duracao),
      UserId: this.userId
    };

    console.log('Salvando no banco:', payloadBanco);
    console.log('Salvando horários no localStorage:', novoAlarme);

    this.alarmeService.createAlarme(payloadBanco).subscribe({
      next: (res) => {
        console.log('Alarme salvo no banco com sucesso:', res);

        // Usar o ID retornado pelo banco
        const bancoId = res.id || res.ID; // Tenta ambos (Sequelize pode retornar como 'id' ou 'ID')

        // Adicionar o novo alarme à lista local COM O ID DO BANCO
        novoAlarme.id = bancoId; // Substituir ID local pelo ID real do banco

        // Adicionar à lista
        this.alarmes.push(novoAlarme);

        // Salvar no localStorage
        this.salvarAlarmesNoStorage();

        this.mensagem = `Programação criada com sucesso! ${this.schedule.length} doses agendadas.`;
        this.mensagemStatus = 'sucesso';
        this.horaInicial = '';
        this.schedule = [];
        this.saving = false;
      },
      error: (err) => {
        console.error('Erro ao salvar no banco:', err);

        // Mesmo com erro no banco, salvar no localStorage para persistência local
        this.alarmes.push(novoAlarme);
        this.salvarAlarmesNoStorage();

        this.mensagem = `Programação criada localmente! ${this.schedule.length} doses agendadas. (Banco indisponível)`;
        this.mensagemStatus = 'sucesso';
        this.horaInicial = '';
        this.schedule = [];
        this.saving = false;
      }
    });
  }

  /**
   * Abre modo de edição para um alarme
   */
  abrirEdicao(alarme: AlarmeAgendado) {
    this.editandoAlarmeId = alarme.id;
    this.editHoraInicio = alarme.horaI;
    this.editDose = alarme.dose;
    this.editDuracao = alarme.duracao;
  }

  /**
   * Salva edição do alarme (atualiza localStorage e banco de dados)
   */
  salvarEdicao() {
    if (!this.editandoAlarmeId) return;
    if (!this.editHoraInicio) {
      window.alert(this.translation.instant('QRCODE.ALERT_START_REQUIRED'));
      return;
    }

    const alarmeIndex = this.alarmes.findIndex(a => a.id === this.editandoAlarmeId);
    if (alarmeIndex >= 0) {
      const alarmeAtualizado = this.alarmes[alarmeIndex];

      // Atualizar dados locais
      alarmeAtualizado.horaI = this.editHoraInicio;
      alarmeAtualizado.dose = this.editDose;
      alarmeAtualizado.duracao = this.editDuracao;

      // Recalcular horários com os novos dados
      alarmeAtualizado.horarios = this.recalcularHorarios(
        this.editHoraInicio,
        this.editDose,
        this.editDuracao,
        alarmeAtualizado.intervalo
      );

      // Salvar no localStorage
      this.salvarAlarmesNoStorage();

      // Atualizar no banco de dados (se houver ID do banco)
      const payloadBanco = {
        nome: alarmeAtualizado.nome,
        dose: alarmeAtualizado.dose,
        horaI: alarmeAtualizado.horaI,
        duracao: Number(alarmeAtualizado.duracao),
        UserId: this.userId
      };

      console.log('Atualizando alarme no banco:', payloadBanco);

      // Apenas atualizar no banco se for um ID numérico (real do banco)
      // Se for string, é um ID temporário local que não está no banco
      const isNumericId = typeof this.editandoAlarmeId === 'number' || !isNaN(Number(this.editandoAlarmeId));

      if (isNumericId) {
        this.alarmeService.updateAlarme(this.editandoAlarmeId, payloadBanco).subscribe({
          next: (res) => {
            console.log('Alarme atualizado no banco com sucesso:', res);
            this.mensagem = 'Programação atualizada com sucesso!';
            this.mensagemStatus = 'sucesso';
          },
          error: (err) => {
            console.error('Erro ao atualizar no banco:', err);
            // Mesmo com erro no banco, os dados locais foram atualizados
            this.mensagem = 'Programação atualizada localmente. (Banco indisponível)';
            this.mensagemStatus = 'sucesso';
          }
        });
      } else {
        // ID temporário - apenas atualização local
        this.mensagem = 'Programação atualizada localmente.';
        this.mensagemStatus = 'sucesso';
      }

      this.cancelarEdicao();
    }
  }

  /**
   * Recalcula os horários com base na hora inicial, dose, duração e intervalo
   */
  private recalcularHorarios(horaInicial: string, dose: string, duracao: number, intervalo: number): Array<{ horario: string; dose: string; dia: number }> {
    const horarios: Array<{ horario: string; dose: string; dia: number }> = [];

    const intervaloHoras = Number(intervalo) || 24;
    if (intervaloHoras <= 0 || duracao <= 0) return horarios;

    const [hh, mm] = horaInicial.split(':').map(s => Number(s));
    let dataAtual = new Date();
    dataAtual.setHours(hh, mm, 0, 0);

    const dosesPerDay = Math.floor(24 / intervaloHoras);
    const totalDoses = dosesPerDay * duracao;

    for (let i = 0; i < totalDoses; i++) {
      const horarioAtual = new Date(dataAtual.getTime() + i * intervaloHoras * 60 * 60 * 1000);
      const dia = Math.floor(i / dosesPerDay) + 1;
      const horarioFormatado = horarioAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      horarios.push({
        horario: horarioFormatado,
        dose: dose,
        dia: dia
      });
    }

    return horarios;
  }

  /**
   * Cancela modo de edição
   */
  cancelarEdicao() {
    this.editandoAlarmeId = null;
    this.editHoraInicio = '';
    this.editDose = '';
    this.editDuracao = 0;
  }

  /**
   * Deleta um alarme agendado (remove de localStorage e banco)
   */
  excluirAlarme(id: string | number) {
    if (window.confirm(this.translation.instant('QRCODE.CONFIRM_DELETE'))) {
      this.alarmes = this.alarmes.filter(a => a.id !== id);
      this.salvarAlarmesNoStorage();

      // Apenas tentar deletar do banco se for um ID numérico (real do banco)
      // Se for string, é um ID temporário local que não está no banco
      const isNumericId = typeof id === 'number' || !isNaN(Number(id));

      if (isNumericId) {
        // Tentar deletar do banco de dados
        this.alarmeService.deleteAlarme(id).subscribe({
          next: (res) => {
            console.log('Alarme deletado do banco com sucesso:', res);
            this.mensagem = 'Programação excluída com sucesso!';
            this.mensagemStatus = 'sucesso';
            this.verificarSeHaAlarmes();
          },
          error: (err) => {
            console.error('Erro ao deletar do banco:', err);
            // Mesmo com erro no banco, foi deletado localmente
            this.mensagem = 'Programação excluída localmente. (Banco indisponível)';
            this.mensagemStatus = 'sucesso';
            this.verificarSeHaAlarmes();
          }
        });
      } else {
        // ID temporário - apenas foi deletado localmente
        this.mensagem = 'Programação excluída localmente.';
        this.mensagemStatus = 'sucesso';
        this.verificarSeHaAlarmes();
      }
    }
  }

  /**
   * Verifica se ainda há alarmes. Se não houver, limpa o QR data e oferece opções
   */
  private verificarSeHaAlarmes() {
    if (this.alarmes.length === 0) {
      // Aguardar um pouco para mostrar a mensagem de sucesso antes de limpar
      setTimeout(() => {
        const opcao = window.confirm(this.translation.instant('QRCODE.CONFIRM_NO_ALARMS'));

        if (opcao) {
          // Limpar dados e ir para scanner
          this.qrData = null;
          this.horaInicial = '';
          this.schedule = [];
          this.mensagem = '';
          this.mensagemStatus = '';
          this.router.navigate(['/scanner']);
        } else {
          // Limpar dados e ir para dashboard
          this.qrData = null;
          this.horaInicial = '';
          this.schedule = [];
          this.mensagem = '';
          this.mensagemStatus = '';
          this.router.navigate(['/dashboard']);
        }
      }, 500);
    }
  }

  /**
   * Retorna a quantidade de doses para um alarme
   */
  getTotalDoses(alarme: AlarmeAgendado): number {
    return alarme.horarios ? alarme.horarios.length : 0;
  }

  /**
   * Verifica quantos medicamentos já têm programação
   */
  getMedicamentosProgramados(): number {
    const nomesMedicamentos = this.medicamentos.map(m => m.nome);
    return this.alarmes.filter(a => nomesMedicamentos.includes(a.nome)).length;
  }

  /**
   * Verifica se todos os medicamentos já estão programados
   */
  todosMedicamentosProgramados(): boolean {
    return this.getMedicamentosProgramados() === this.medicamentos.length;
  }

  getViewSchedulesText(alarme: AlarmeAgendado): string {
    try {
      return this.translation.instant('QRCODE.VIEW_SCHEDULES', { count: this.getTotalDoses(alarme) });
    } catch (e) {
      return `Ver Horários Programados (${this.getTotalDoses(alarme)} doses)`;
    }
  }

  getScheduleTotalText(): string {
    try {
      const days = this.medicamentoSelecionado?.duracao || 0;
      return this.translation.instant('QRCODE.SCHEDULE_TOTAL', { count: this.schedule.length, days });
    } catch (e) {
      return `Total de ${this.schedule.length} doses em ${this.medicamentoSelecionado?.duracao || 0} dia(s)`;
    }
  }
}
