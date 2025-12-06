import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription, Observable } from 'rxjs';
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
  recipeKey?: string;
  duracaoEmDias?: number;
  totalDoses?: number;
  intervaloHoras?: number;
}

@Component({
  selector: 'app-qrcode',
  templateUrl: './qrcode.component.html',
  styleUrls: ['./qrcode.component.scss']
})
export class QrcodeComponent implements OnInit, OnDestroy {
  temProgramacao = false;
  isLoggedIn = false;
  isAdmin = false;
  qrData: any = null;
  medicamentos: any[] = [];
  medicamentoSelecionado: any = null;
  horaInicial: string = '';
  schedule: Array<{ horario: string; dose: string; dia: number }> = [];
  saving = false;
  menuAtivo = false;
  userMenuAtivo = false;

  @ViewChild('menu') menuElement!: ElementRef;
  @ViewChild('menuIcon') menuIcon!: ElementRef;
  @ViewChild('userMenu') userMenuElement!: ElementRef;
  @ViewChild('userIcon') userIconElement!: ElementRef;

  alarmes: AlarmeAgendado[] = [];
  alarmesVisiveis: AlarmeAgendado[] = [];

  userId: string | number | null = null;
  editandoAlarmeId: string | number | null = null;
  editHoraInicio: string = '';
  editDose: string = '';
  editDuracao: number = 0;
  mensagem: string = '';
  mensagemStatus: 'sucesso' | 'erro' | 'aviso' = 'sucesso';

  currentRecipeKey: string = '';
  private recipeSavedMap: Record<string, boolean> = {};

  sidebarOpen = false;
  selectedAlarme: AlarmeAgendado | null = null;

  modoProgramacao: boolean = false;

  private readonly STORAGE_KEY = 'medtime_alarmes_agendados';
  private alertaTimeout: any = null;
  private subscriptions: Subscription[] = [];
  private routerEventsSub?: Subscription;
  private syncInterval: any = null;

  constructor(
    private router: Router,
    private alarmeService: AlarmeService,
    public authService: AuthService,
    private translation: TranslationService) { }

  ngOnInit(): void {
    this.updateUserFlags();

    this.checkNavigationState();

    const stateInit: any = window.history.state || {};
    this.qrData = stateInit.qrData || null;

    if (!this.qrData) {
      this.medicamentos = [];
      this.medicamentoSelecionado = null;
    } else {
      if (Array.isArray(this.qrData)) {
        this.medicamentos = this.qrData;
      } else if (this.qrData.medicamentos && Array.isArray(this.qrData.medicamentos)) {
        this.medicamentos = this.qrData.medicamentos;
      } else {
        this.medicamentos = [this.qrData];
      }
      if (this.medicamentos.length > 0) {
        this.medicamentoSelecionado = this.medicamentos[0];
      }
    }

    if (!this.userId) {
      this.updateUserFlags();
    }

    if (!this.userId) {
      window.alert(this.translation.instant('QRCODE.ALERT_NO_USER'));
      this.router.navigate(['/login']);
      return;
    }

    this.currentRecipeKey = (this.qrData && (this.qrData.id || this.qrData.recipeId)) || `recipe_${Date.now()}`;

    if (this.medicamentos && this.medicamentos.length > 0) {
      this.medicamentos.forEach((m: any) => {
        const medKey = this._medKey(m);
        this.recipeSavedMap[medKey] = false;
      });
    }

    this.carregarAlarmesDoStorage();

    if (this.userId) {
      this.syncAlarmesWithServer();
      this.syncInterval = setInterval(() => this.syncAlarmesWithServer(), 30000);
    }

    this.temProgramacao = this.alarmes.length > 0;

    if (this.modoProgramacao) {
      this.alarmesVisiveis = this.alarmes.slice();
    } else {
      this.atualizarAlarmesVisiveisInicial();
    }

    this.routerEventsSub = this.router.events
      .pipe(filter(evt => evt instanceof NavigationEnd))
      .subscribe(() => {
        this.checkNavigationState();
      });
  }

  ngOnDestroy(): void {
    if (this.alertaTimeout) {
      clearTimeout(this.alertaTimeout);
    }
    this.subscriptions.forEach(s => s.unsubscribe && s.unsubscribe());
    if (this.routerEventsSub) {
      this.routerEventsSub.unsubscribe();
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private updateUserFlags(): void {
    try {
      const maybeUser = (this.authService as any).getUsuario?.();
      if (!maybeUser) {
        this.isAdmin = false;
        this.isLoggedIn = false;
        this.userId = null;
        return;
      }

      if (typeof (maybeUser as any).subscribe === 'function') {
        const sub: Subscription = (maybeUser as Observable<any>).subscribe({
          next: (user: any) => {
            this._applyUserToFlags(user);
          },
          error: () => {
            this.isAdmin = false;
            this.isLoggedIn = false;
          }
        });
        this.subscriptions.push(sub);
      } else {
        this._applyUserToFlags(maybeUser);
      }
    } catch (e) {
      this.isAdmin = false;
      this.isLoggedIn = false;
      console.error('Erro em updateUserFlags', e);
    }
  }

  private _applyUserToFlags(user: any) {
    try {
      if (!user) {
        this.isAdmin = false;
        this.isLoggedIn = false;
        this.userId = null;
        return;
      }
      this.userId = user?.id ?? user?.ID ?? user?.userId ?? this.userId;
      this.isLoggedIn = true;
      this.isAdmin = !!(
        user?.isAdmin ||
        user?.admin ||
        user?.is_adm ||
        user?.role === 'admin' ||
        user?.perfil === 'admin' ||
        (Array.isArray(user?.roles) && user.roles.includes('admin'))
      );
    } catch (e) {
      this.isAdmin = false;
    }
  }

  private syncAlarmesWithServer() {
    if (!this.userId) return;
    this.alarmeService.getAlarmesByUser(this.userId).subscribe({
      next: (res: any) => {
        try {
          const serverAlarmes: AlarmeAgendado[] = Array.isArray(res) ? res.map((a: any) => ({
            id: a.id || a.ID || a._id || a.idBanco || a.idTmp,
            nome: a.nome || a.Nome || a.name || '',
            dose: a.dose || a.Dose || '',
            horaI: a.horaI || a.hora || a.horaInicio || '',
            duracao: Number(a.duracao || a.Duracao || 0) || 0,
            intervalo: Number(a.intervalo || a.Intervalo || 24) || 24,
            dataCriacao: Number(a.dataCriacao || a.createdAt) || Date.now(),
            userId: a.UserId || a.userId || this.userId,
            horarios: a.horarios || a.Horarios || [],
            recipeKey: a.recipeKey || (a.recipeId || '')
          })) : [];

          const prevCount = this.alarmes.length;

          const todosAlarmesRaw = localStorage.getItem(this.STORAGE_KEY);
          let todos: any[] = todosAlarmesRaw ? JSON.parse(todosAlarmesRaw) : [];
          todos = todos.filter(a => String(a.userId) !== String(this.userId));
          todos.push(...serverAlarmes);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todos));

          this.alarmes = serverAlarmes;
          this.temProgramacao = this.alarmes.length > 0;

          if (this.modoProgramacao) {
            this.alarmesVisiveis = this.alarmes.slice();
          } else {
            this.atualizarAlarmesVisiveisInicial();
          }

          if (prevCount > 0 && this.alarmes.length === 0) {
            this.exibirAlerta(this.translation.instant('QRCODE.DELETED_ALL_AUTOMATIC') || 'Tratamentos finalizados e removidos.', 'aviso', 4000);
            this.temProgramacao = false;
          }
        } catch (e) {
          console.error('Erro parseando alarmes do servidor', e);
        }
      },
      error: () => { /* manter estado local em falha */ }
    });
  }

  private checkNavigationState() {
    // Reavalia flags do usuário sempre que checamos o estado de navegação
    this.updateUserFlags();

    const state: any = window.history.state || {};
    const wantModoProgramacao = !!state?.verProgramacao;

    if (wantModoProgramacao && !this.modoProgramacao) {
      this.modoProgramacao = true;
      this.carregarAlarmesDoStorage();
      this.alarmesVisiveis = this.alarmes.slice();
      this.temProgramacao = this.alarmes.length > 0;
    } else if (!wantModoProgramacao && this.modoProgramacao) {
      this.modoProgramacao = false;
      this.atualizarAlarmesVisiveisInicial();
      this.temProgramacao = this.alarmes.length > 0;
    } else {
      this.carregarAlarmesDoStorage();
      this.temProgramacao = this.alarmes.length > 0;
      if (this.modoProgramacao) {
        this.alarmesVisiveis = this.alarmes.slice();
      }
    }
  }

  private _medKey(medicamento: any): string {
    return `${(medicamento.nome || '').toLowerCase()}___${medicamento.dose}___${medicamento.intervalo}___${medicamento.duracao}`;
  }

  private carregarAlarmesDoStorage(): void {
    try {
      const todosAlarmes = localStorage.getItem(this.STORAGE_KEY);
      if (todosAlarmes) {
        const alarmesParsed: AlarmeAgendado[] = JSON.parse(todosAlarmes);
        this.alarmes = alarmesParsed.filter(a => String(a.userId) === String(this.userId));
        console.log(`Carregados ${this.alarmes.length} alarmes do localStorage`);
      } else {
        this.alarmes = [];
      }
      this.temProgramacao = this.alarmes.length > 0;
    } catch (error) {
      console.error('Erro ao carregar alarmes do localStorage:', error);
      this.alarmes = [];
      this.temProgramacao = false;
    }
  }

  private salvarAlarmesNoStorage(): void {
    try {
      const todosAlarmesRaw = localStorage.getItem(this.STORAGE_KEY);
      let alarmesParsed: any[] = todosAlarmesRaw ? JSON.parse(todosAlarmesRaw) : [];
      alarmesParsed = alarmesParsed.filter(a => String(a.userId) !== String(this.userId));
      alarmesParsed.push(...this.alarmes);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(alarmesParsed));
      console.log('Alarmes salvos no localStorage');
      this.temProgramacao = this.alarmes.length > 0;
    } catch (error) {
      console.error('Erro ao salvar alarmes no localStorage:', error);
    }
  }

  exibirAlerta(mensagem: string, status: 'sucesso' | 'erro' | 'aviso' = 'sucesso', duracao: number = 4000): void {
    this.mensagem = mensagem;
    this.mensagemStatus = status;
    if (this.alertaTimeout) clearTimeout(this.alertaTimeout);
    this.alertaTimeout = setTimeout(() => this.fecharAlerta(), duracao);
  }

  fecharAlerta(): void {
    this.mensagem = '';
    if (this.alertaTimeout) {
      clearTimeout(this.alertaTimeout);
      this.alertaTimeout = null;
    }
  }

  atualizarMedicamentoSelecionado(): void { }

  medicamentosDisponiveis(): any[] {
    return this.medicamentos.filter(med => !this.isMedicamentoProgramado(med));
  }

  isMedicamentoProgramado(medicamento: any): boolean {
    return this.alarmes.some(
      alarme =>
        alarme.nome.toLowerCase() === (medicamento.nome || '').toLowerCase() &&
        alarme.dose === medicamento.dose &&
        Number(alarme.intervalo) === Number(medicamento.intervalo) &&
        Number(alarme.duracao) === Number(medicamento.duracao)
    );
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

    const dosesPerDay = Math.floor(24 / intervaloHoras) || 1;
    const totalDoses = dosesPerDay * duracaoDias;

    for (let i = 0; i < totalDoses; i++) {
      const horarioAtual = new Date(dataAtual.getTime() + i * intervaloHoras * 60 * 60 * 1000);
      const dia = Math.floor(i / dosesPerDay) + 1;
      const horarioFormatado = horarioAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      this.schedule.push({ horario: horarioFormatado, dose: dose, dia: dia });
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
      horarios: [...this.schedule],
      recipeKey: this.currentRecipeKey
    };

    this.saving = true;

    const payloadBanco: any = {
      nome: novoAlarme.nome,
      dose: novoAlarme.dose,
      horaI: novoAlarme.horaI,
      duracao: Number(novoAlarme.duracao),
      intervalo: String(novoAlarme.intervalo),
      UserId: this.userId,
      recipeKey: this.currentRecipeKey
    };

    this.alarmeService.createAlarme(payloadBanco).subscribe({
      next: (res) => {
        const bancoId = res?.id ?? res?.ID ?? res?._id ?? novoAlarme.id;
        novoAlarme.id = bancoId;
        this.alarmes.push(novoAlarme);
        this.salvarAlarmesNoStorage();
        this.exibirAlerta(`✓ ${novoAlarme.nome} foi agendado com sucesso! ${this.schedule.length} doses programadas.`, 'sucesso', 3000);
        this.markMedAsSavedForRecipe(this.medicamentoSelecionado, novoAlarme);
        this.horaInicial = '';
        this.schedule = [];
        this.saving = false;
        setTimeout(() => this.scrollToBottom(), 120);
      },
      error: (err) => {
        console.error('Erro ao salvar no banco:', err);
        this.alarmes.push(novoAlarme);
        this.salvarAlarmesNoStorage();
        this.exibirAlerta(`✓ ${novoAlarme.nome} foi agendado localmente! ${this.schedule.length} doses programadas.`, 'sucesso', 3000);
        this.markMedAsSavedForRecipe(this.medicamentoSelecionado, novoAlarme);
        this.schedule = [];
        this.saving = false;
        setTimeout(() => this.scrollToBottom(), 120);
      }
    });
  }

  private scrollToBottom() {
    try {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (e) {
      window.scrollTo(0, document.body.scrollHeight || 0);
    }
  }

  private markMedAsSavedForRecipe(medicamento: any, alarmeSalvo: AlarmeAgendado) {
    const key = this._medKey(medicamento);
    this.recipeSavedMap[key] = true;

    const idx = this.alarmes.findIndex(a => a.id === alarmeSalvo.id);
    if (idx >= 0) this.alarmes[idx].recipeKey = this.currentRecipeKey;

    this.salvarAlarmesNoStorage();
    const allSaved = Object.values(this.recipeSavedMap).every(v => v === true);
    if (allSaved) {
      this.modoProgramacao = true;
      this.carregarAlarmesDoStorage();
      this.alarmesVisiveis = this.alarmes.slice();
      this.temProgramacao = this.alarmes.length > 0;
    }
  }

  private atualizarAlarmesVisiveisPorRecipe(recipeKey: string) {
    const todosAlarmesRaw = localStorage.getItem(this.STORAGE_KEY);
    if (!todosAlarmesRaw) return;
    try {
      const todos: AlarmeAgendado[] = JSON.parse(todosAlarmesRaw);
      this.alarmesVisiveis = todos.filter(a => String(a.userId) === String(this.userId) && (a as any).recipeKey === recipeKey);
    } catch (e) {
      console.error('Erro ao parsear alarmes do storage para visíveis', e);
    }
  }

  private atualizarAlarmesVisiveisInicial() {
    const todosAlarmesRaw = localStorage.getItem(this.STORAGE_KEY);
    if (!todosAlarmesRaw) {
      this.alarmesVisiveis = [];
      return;
    }
    try {
      const todos: AlarmeAgendado[] = JSON.parse(todosAlarmesRaw);
      this.alarmesVisiveis = todos.filter(a => String(a.userId) === String(this.userId) && (!a.recipeKey || a.recipeKey !== this.currentRecipeKey));
    } catch (e) {
      console.error('Erro ao parsear alarmes do storage', e);
      this.alarmesVisiveis = [];
    }
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
      alarmeAtualizado.horaI = this.editHoraInicio;
      alarmeAtualizado.dose = this.editDose;
      alarmeAtualizado.duracao = this.editDuracao;

      alarmeAtualizado.horarios = this.recalcularHorarios(
        this.editHoraInicio,
        this.editDose,
        this.editDuracao,
        alarmeAtualizado.intervalo
      );

      this.salvarAlarmesNoStorage();

      const payloadBanco = {
        nome: alarmeAtualizado.nome,
        dose: alarmeAtualizado.dose,
        horaI: alarmeAtualizado.horaI,
        duracao: Number(alarmeAtualizado.duracao),
        intervalo: String(alarmeAtualizado.intervalo),
        UserId: this.userId
      };

      const isNumericId = typeof this.editandoAlarmeId === 'number' || !isNaN(Number(this.editandoAlarmeId));

      if (isNumericId) {
        this.alarmeService.updateAlarme(this.editandoAlarmeId, payloadBanco).subscribe({
          next: () => this.exibirAlerta('✓ Programação atualizada com sucesso!', 'sucesso'),
          error: () => this.exibirAlerta('✓ Programação atualizada localmente. (Banco indisponível)', 'sucesso')
        });
      } else {
        this.exibirAlerta('✓ Programação atualizada localmente.', 'sucesso');
      }

      this.cancelarEdicao();
    }
  }

  private recalcularHorarios(horaInicial: string, dose: string, duracao: number, intervalo: number) {
    const horarios: Array<{ horario: string; dose: string; dia: number }> = [];
    const intervaloHoras = Number(intervalo) || 24;
    if (intervaloHoras <= 0 || duracao <= 0) return horarios;

    const [hh, mm] = horaInicial.split(':').map(s => Number(s));
    let dataAtual = new Date();
    dataAtual.setHours(hh, mm, 0, 0);

    const dosesPerDay = Math.floor(24 / intervaloHoras) || 1;
    const totalDoses = dosesPerDay * duracao;

    for (let i = 0; i < totalDoses; i++) {
      const horarioAtual = new Date(dataAtual.getTime() + i * intervaloHoras * 60 * 60 * 1000);
      const dia = Math.floor(i / dosesPerDay) + 1;
      const horarioFormatado = horarioAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      horarios.push({ horario: horarioFormatado, dose: dose, dia: dia });
    }
    return horarios;
  }

  public getHorariosForAlarme(alarme: AlarmeAgendado): Array<{ horario: string; dose: string; dia: number }> {
    if (!alarme) return [];
    if (alarme.horarios && Array.isArray(alarme.horarios) && alarme.horarios.length > 0) {
      return alarme.horarios;
    }
    try {
      const hora = alarme.horaI || '';
      const dose = alarme.dose || '';
      const duracao = Number(alarme.duracao) || 0;
      const intervalo = Number(alarme.intervalo) || 24;
      return this.recalcularHorarios(hora, dose, duracao, intervalo);
    } catch (e) {
      return [];
    }
  }

  cancelarEdicao() {
    this.editandoAlarmeId = null;
    this.editHoraInicio = '';
    this.editDose = '';
    this.editDuracao = 0;
  }

  excluirAlarmeConfirm(id: string | number) {
    if (window.confirm(this.translation.instant('QRCODE.CONFIRM_DELETE'))) {
      this.excluirAlarme(id, true);
    }
  }

  excluirAlarme(id: string | number, userInitiated: boolean = false) {
    this.alarmes = this.alarmes.filter(a => a.id !== id);
    this.salvarAlarmesNoStorage();

    const isNumericId = typeof id === 'number' || !isNaN(Number(id));
    if (isNumericId) {
      this.alarmeService.deleteAlarme(id).subscribe({
        next: () => {
          this.exibirAlerta('✓ Programação excluída com sucesso!', 'sucesso');
          this.atualizarAlarmesVisiveisInicial();
          if (userInitiated && this.alarmes.length === 0) {
            this.verificarSeHaAlarmes();
          }
        },
        error: () => {
          this.exibirAlerta('✓ Programação excluída localmente. (Banco indisponível)', 'sucesso');
          this.atualizarAlarmesVisiveisInicial();
          if (userInitiated && this.alarmes.length === 0) {
            this.verificarSeHaAlarmes();
          }
        }
      });
    } else {
      this.exibirAlerta('✓ Programação excluída localmente.', 'sucesso');
      this.atualizarAlarmesVisiveisInicial();
      if (userInitiated && this.alarmes.length === 0) {
        this.verificarSeHaAlarmes();
      }
    }
  }

  private verificarSeHaAlarmes() {
    if (this.alarmes.length === 0) {
      setTimeout(() => {
        const opcao = window.confirm(this.translation.instant('QRCODE.CONFIRM_NO_ALARMS'));
        if (opcao) {
          this.qrData = null;
          this.horaInicial = '';
          this.schedule = [];
          this.fecharAlerta();
          this.router.navigate(['/scanner']);
        } else {
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
    try {
      const horarios = this.getHorariosForAlarme(alarme);
      if (horarios && horarios.length > 0) return horarios.length;
      const intervalo = Number(alarme.intervalo) || 24;
      const duracao = Number(alarme.duracao) || 1;
      const dosesPerDay = Math.max(1, Math.floor(24 / intervalo));
      return dosesPerDay * Math.max(1, duracao);
    } catch (e) {
      return 0;
    }
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

  openScheduleSidebar(alarme: AlarmeAgendado) {
    const encontrado = this.alarmes.find(a => String(a.id) === String(alarme.id));
    const alvo = encontrado ? { ...encontrado } : { ...alarme };
    alvo.horarios = this.getHorariosForAlarme(alvo);
    this.selectedAlarme = alvo;
    this.sidebarOpen = true;
  }

  closeScheduleSidebar() {
    this.selectedAlarme = null;
    this.sidebarOpen = false;
  }

  fecharScheduleModal() {
    this.schedule = [];
  }

  toggleMenu() {
    this.menuAtivo = !this.menuAtivo;
    if (this.menuAtivo) this.userMenuAtivo = false;
  }

  toggleUserMenu() {
    this.userMenuAtivo = !this.userMenuAtivo;
    if (this.userMenuAtivo) this.menuAtivo = false;
  }

  efetuarLogout() {
    this.authService.logout();
    this.router.navigate(['/home']);
    this.userMenuAtivo = false;
  }

  @HostListener('document:click', ['$event'])
  clickFora(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.menuAtivo && this.menuElement && this.menuIcon &&
      !this.menuElement.nativeElement.contains(target) && !this.menuIcon.nativeElement.contains(target)) {
      this.menuAtivo = false;
    }
    if (this.userMenuAtivo && this.userMenuElement && this.userIconElement &&
      !this.userMenuElement.nativeElement.contains(target) && !this.userIconElement.nativeElement.contains(target)) {
      this.userMenuAtivo = false;
    }
    try {
      if (this.sidebarOpen && this.modoProgramacao) {
        const aside = document.querySelector('.schedule-sidebar') as HTMLElement | null;
        if (aside && !aside.contains(target)) {
          if (target.closest('.alarme-card') || target.closest('.card-actions') || target.closest('.btn-primary') || target.closest('.btn-editar')) {
            return;
          }
          this.closeScheduleSidebar();
        }
      }
    } catch (e) {
    }
  }

  openVerProgramacao() {
    this.updateUserFlags();

    this.modoProgramacao = true;
    this.carregarAlarmesDoStorage();
    this.alarmesVisiveis = this.alarmes.slice();
    this.temProgramacao = this.alarmes.length > 0;
    this.schedule = [];
    this.editandoAlarmeId = null;
    this.horaInicial = '';
    console.log('openVerProgramacao -> alarmesVisiveis:', this.alarmesVisiveis.length);
  }

  getDurationDays(alarme: any): number {
    if (!alarme) return 0;
    if (alarme.duracaoEmDias) return alarme.duracaoEmDias;
    return alarme.duracao || Math.ceil((alarme.totalDoses || 0) / (24 / (alarme.intervaloHoras || 1)));
  }
}
