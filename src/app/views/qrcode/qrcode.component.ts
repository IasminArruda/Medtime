import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from 'src/app/services/translation.service';
import { AlarmeService } from 'src/app/services/alarme.service';
import { AuthService } from 'src/app/services/auth.service';

interface AlarmeAgendado {
  id: string | number;
  nome: string;
  dose: string;
  horaI: string;
  duracao: number;
  intervalo: number;
  dataCriacao: number;
  userId: string | number;
  horarios: Array<{ horario: string; dose: string; dia: number }>;
}

@Component({
  selector: 'app-qrcode',
  templateUrl: './qrcode.component.html',
  styleUrls: ['./qrcode.component.scss']
})
export class QrcodeComponent implements OnInit, OnDestroy {
  temProgramacao = false;
  isLoggedIn = false;
  qrData: any = null;
  medicamentos: any[] = [];
  medicamentoSelecionado: any = null;
  horaInicial: string = '';
  schedule: Array<{ horario: string; dose: string; dia: number }> = [];
  saving = false;
  isAdmin = false;
  menuAtivo = false;
  userMenuAtivo = false;

  @ViewChild('menu') menuElement!: ElementRef;
  @ViewChild('menuIcon') menuIcon!: ElementRef;
  @ViewChild('userMenu') userMenuElement!: ElementRef;
  @ViewChild('userIcon') userIconElement!: ElementRef;

  // Propriedades para gerenciar alarmes
  alarmes: AlarmeAgendado[] = [];
  userId: string | number | null = null;
  editandoAlarmeId: string | number | null = null;
  editHoraInicio: string = '';
  editDose: string = '';
  editDuracao: number = 0;
  mensagem: string = '';
  mensagemStatus: 'sucesso' | 'erro' | 'aviso' = 'sucesso';

  private readonly STORAGE_KEY = 'medtime_alarmes_agendados';
  private alertaTimeout: any = null;

  constructor(
    private router: Router,
    private alarmeService: AlarmeService,
    public authService: AuthService,
    private translation: TranslationService,) { }

  ngOnInit(): void {
    const state: any = window.history.state || {};
    this.qrData = state.qrData || null;

    if (!this.qrData) {
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

  ngOnDestroy(): void {
    // Limpar timeout ao destruir componente
    if (this.alertaTimeout) {
      clearTimeout(this.alertaTimeout);
    }
  }
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

  exibirAlerta(mensagem: string, status: 'sucesso' | 'erro' | 'aviso' = 'sucesso', duracao: number = 4000): void {
    this.mensagem = mensagem;
    this.mensagemStatus = status;

    // Limpar timeout anterior se houver
    if (this.alertaTimeout) {
      clearTimeout(this.alertaTimeout);
    }

    // Auto-fechar após duração especificada
    this.alertaTimeout = setTimeout(() => {
      this.fecharAlerta();
    }, duracao);
  }

  fecharAlerta(): void {
    this.mensagem = '';
    if (this.alertaTimeout) {
      clearTimeout(this.alertaTimeout);
      this.alertaTimeout = null;
    }
  }

  getAlertIcon(): string {
    switch (this.mensagemStatus) {
      case 'sucesso':
        return 'fas fa-check-circle';
      case 'erro':
        return 'fas fa-exclamation-circle';
      case 'aviso':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-info-circle';
    }
  }

  atualizarMedicamentoSelecionado(): void {
  }

  excluirAlarmeConfirm(id: string | number): void {
    if (window.confirm(this.translation.instant('QRCODE.CONFIRM_DELETE'))) {
      this.excluirAlarme(id);
    }
  }

  medicamentosDisponiveis(): any[] {
    return this.medicamentos.filter(med => !this.isMedicamentoProgramado(med));
  }

  isMedicamentoProgramado(medicamento: any): boolean {
    return this.alarmes.some(
      alarme =>
        alarme.nome.toLowerCase() === medicamento.nome.toLowerCase() &&
        alarme.dose === medicamento.dose &&
        alarme.intervalo === medicamento.intervalo &&
        alarme.duracao === medicamento.duracao
    );
  }

  private salvarAlarmesNoStorage(): void {
    try {
      const todosAlarmes = localStorage.getItem(this.STORAGE_KEY);
      let alarmesParsed: AlarmeAgendado[] = todosAlarmes ? JSON.parse(todosAlarmes) : [];

      alarmesParsed = alarmesParsed.filter(a => a.userId !== this.userId);
      alarmesParsed.push(...this.alarmes);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(alarmesParsed));
      console.log('Alarmes salvos no localStorage');
    } catch (error) {
      console.error('Erro ao salvar alarmes no localStorage:', error);
    }
  }

  gerarSchedule() {
    if (!this.horaInicial) {
      this.exibirAlerta('Por favor, defina uma hora inicial', 'aviso');
      return;
    }

    if (!this.medicamentoSelecionado) {
      this.exibirAlerta('Por favor, selecione um medicamento', 'aviso');
      return;
    }

    const intervaloHoras = Number(this.medicamentoSelecionado.intervalo) || 24;
    const duracaoDias = Number(this.medicamentoSelecionado.duracao) || 1;
    const dose = this.medicamentoSelecionado.dose || '';

    if (intervaloHoras <= 0 || duracaoDias <= 0) {
      this.exibirAlerta('Intervalo e duração devem ser maiores que zero', 'erro');
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

  confirmarAlarme() {
    if (this.schedule.length === 0) {
      this.exibirAlerta('Por favor, gere um schedule antes de confirmar', 'aviso');
      return;
    }

    if (!this.userId) {
      window.alert('Usuário não identificado. Faça login.');
      this.router.navigate(['/login']);
      return;
    }

    // Criar um ID único temporário para este alarme
    const alarmeIdTemp = `alarme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const novoAlarme: AlarmeAgendado = {
      id: alarmeIdTemp,
      nome: this.medicamentoSelecionado.nome || 'Medicamento',
      dose: this.medicamentoSelecionado.dose || '',
      horaI: this.horaInicial,
      duracao: Number(this.medicamentoSelecionado.duracao) || 1,
      intervalo: Number(this.medicamentoSelecionado.intervalo) || 24,
      dataCriacao: Date.now(),
      userId: this.userId,
      horarios: [...this.schedule]
    };

    this.saving = true;

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
        const bancoId = res.id || res.ID;

        novoAlarme.id = bancoId;

        this.alarmes.push(novoAlarme);
        this.salvarAlarmesNoStorage();
        this.exibirAlerta(
          `✓ ${novoAlarme.nome} foi agendado com sucesso! ${this.schedule.length} doses programadas.`,
          'sucesso',
          3000
        );

        this.horaInicial = '';
        this.schedule = [];
        this.saving = false;
      },
      error: (err) => {
        console.error('Erro ao salvar no banco:', err);

        // Mesmo com erro no banco, salvar no localStorage para persistência local
        this.alarmes.push(novoAlarme);
        this.salvarAlarmesNoStorage();

        this.exibirAlerta(
          `✓ ${novoAlarme.nome} foi agendado localmente! ${this.schedule.length} doses programadas.`,
          'sucesso',
          3000
        );

        this.horaInicial = '';
        this.schedule = [];
        this.saving = false;
      }
    });
  }

  abrirEdicao(alarme: AlarmeAgendado) {
    this.editandoAlarmeId = alarme.id;
    this.editHoraInicio = alarme.horaI;
    this.editDose = alarme.dose;
    this.editDuracao = alarme.duracao;
  }

  salvarEdicao() {
    if (!this.editandoAlarmeId) return;
    if (!this.editHoraInicio) {
      this.exibirAlerta('Por favor, defina uma hora de início', 'aviso');
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

      const isNumericId = typeof this.editandoAlarmeId === 'number' || !isNaN(Number(this.editandoAlarmeId));

      if (isNumericId) {
        this.alarmeService.updateAlarme(this.editandoAlarmeId, payloadBanco).subscribe({
          next: (res) => {
            console.log('Alarme atualizado no banco com sucesso:', res);
            this.exibirAlerta('✓ Programação atualizada com sucesso!', 'sucesso');
          },
          error: (err) => {
            console.error('Erro ao atualizar no banco:', err);
            this.exibirAlerta('✓ Programação atualizada localmente. (Banco indisponível)', 'sucesso');
          }
        });
      } else {
        this.exibirAlerta('✓ Programação atualizada localmente.', 'sucesso');
      }

      this.cancelarEdicao();
    }
  }

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

  cancelarEdicao() {
    this.editandoAlarmeId = null;
    this.editHoraInicio = '';
    this.editDose = '';
    this.editDuracao = 0;
  }


  excluirAlarme(id: string | number) {
    if (window.confirm(this.translation.instant('QRCODE.CONFIRM_DELETE'))) {
      this.alarmes = this.alarmes.filter(a => a.id !== id);
      this.salvarAlarmesNoStorage();

      const isNumericId = typeof id === 'number' || !isNaN(Number(id));

      if (isNumericId) {
        // Tentar deletar do banco de dados
        this.alarmeService.deleteAlarme(id).subscribe({
          next: (res) => {
            console.log('Alarme deletado do banco com sucesso:', res);
            this.exibirAlerta('✓ Programação excluída com sucesso!', 'sucesso');
            this.verificarSeHaAlarmes();
          },
          error: (err) => {
            console.error('Erro ao deletar do banco:', err);
            this.exibirAlerta('✓ Programação excluída localmente. (Banco indisponível)', 'sucesso');
            this.verificarSeHaAlarmes();
          }
        });
      } else {
        this.exibirAlerta('✓ Programação excluída localmente.', 'sucesso');
        this.verificarSeHaAlarmes();
      }
    }
  }

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
          this.fecharAlerta();
          this.router.navigate(['/scanner']);
        } else {
          // Limpar dados e ir para dashboard
          this.qrData = null;
          this.horaInicial = '';
          this.schedule = [];
          this.fecharAlerta();
          this.router.navigate(['/dashboard']);
        }
      }, 500);
    }
  }

  getTotalDoses(alarme: AlarmeAgendado): number {
    return alarme.horarios ? alarme.horarios.length : 0;
  }

  getMedicamentosProgramados(): number {
    const nomesMedicamentos = this.medicamentos.map(m => m.nome);
    return this.alarmes.filter(a => nomesMedicamentos.includes(a.nome)).length;
  }

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

 toggleMenu() {
    this.menuAtivo = !this.menuAtivo;
    if (this.menuAtivo) {
        this.userMenuAtivo = false;
    }
  }

  toggleUserMenu() {
    this.userMenuAtivo = !this.userMenuAtivo;
    if (this.userMenuAtivo) {
      this.menuAtivo = false;
    }
  }

  fecharQualquerMenu() {
    this.menuAtivo = false;
    this.userMenuAtivo = false;
  }

  @HostListener('document:click', ['$event'])
  clickFora(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (
      this.menuAtivo &&
      this.menuElement &&
      this.menuIcon &&
      !this.menuElement.nativeElement.contains(target) &&
      !this.menuIcon.nativeElement.contains(target)
    ) {
      this.menuAtivo = false;
    }

    if (this.userMenuAtivo) {
        if (
            this.userMenuElement &&
            this.userIconElement &&
            !this.userMenuElement.nativeElement.contains(target) &&
            !this.userIconElement.nativeElement.contains(target)
        ) {
            this.userMenuAtivo = false;
        }
    }
  }

  efetuarLogout() {
    this.authService.logout();
    this.router.navigate(['/home']);
    this.userMenuAtivo = false;
  }

}
