import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { AccessibilityService } from 'src/app/services/accessibility.service';
import { firstValueFrom } from 'rxjs';
import { ConfigService, UserProfile } from '../../services/config.service';
import { TranslationService } from 'src/app/services/translation.service';

interface ProfileState {
  name: string;
  email: string;
  phone: string;
  original: { name: string, phone: string, email: string };
}

interface AlarmSettings {
  enabled: boolean;
  soundEnabled: boolean;
  soundName: string;
  volume: number;
  visualNotification: boolean;
  otherReminders: boolean;
}

interface AccessibilitySettings {
  textSize: 'pequeno' | 'normal' | 'grande' | 'extra';
  contrast: boolean;
  darkMode: boolean;
  highContrast: boolean;
}

interface PrivacySettings {
  dataCollection: boolean;
  pesquisasDeSaude: boolean;
}

interface Language {
  name: string;
  code: string;
}

@Component({
  selector: 'app-configuracao',
  templateUrl: './configuracao.component.html',
  styleUrls: ['./configuracao.component.scss'],
})
export class ConfiguracaoComponent implements OnInit {

  private configService = inject(ConfigService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private accessibilityService = inject(AccessibilityService);
  private translationService = inject(TranslationService);

  activePanel = signal<string>('info-pessoal');
  isLoading = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);
  showPrivacyPolicy = signal<boolean>(false);
  showTermsOfUse = signal<boolean>(false);

  alarmSettings = signal<AlarmSettings>({
    enabled: true,
    soundEnabled: false,
    soundName: 'despertador-curto',
    volume: 60,
    visualNotification: true,
    otherReminders: false,
  });

  private alarmStorageKey = 'medtime-alarm-settings';
  private accessibilityStorageKey = 'medtime-accessibility-settings';
  private privacyStorageKey = 'medtime-privacy-settings';
  private languageStorageKey = 'medtime-app-language';

  accessibilitySettings = signal<AccessibilitySettings>({
    textSize: 'normal',
    contrast: false,
    darkMode: false,
    highContrast: false,
  });

  privacySettings = signal<PrivacySettings>({
    dataCollection: true,
    pesquisasDeSaude: false,
  });

  currentDetectedSize = signal<string>('normal');

  profileData = signal<ProfileState>({
    name: '',
    email: '',
    phone: '',
    original: { name: '', phone: '', email: '' },
  });

  selectedLanguage = signal<string>('pt-BR');

  availableLanguages: Language[] = [
    { name: 'Português (Brasil)', code: 'pt-BR' },
    { name: 'Inglês (US)', code: 'en-US' },
    { name: 'Espanhol', code: 'es' },
    { name: 'Francês', code: 'fr' },
    { name: '(Outros Idiomas)', code: 'other' },
  ];

  supportMessage = '';
  selectedSolution: any = null;
  showSolutionModal = signal<boolean>(false);

  supportSolutions = [
    {
      id: 'manage-prescriptions',
      titleKey: 'CONFIG.SOLUTION_MANAGE_PRESCRIPTIONS',
      icon: 'fas fa-qrcode',
      contentKey: 'CONFIG.SOLUTION_MANAGE_PRESCRIPTIONS_DESC'
    },
    {
      id: 'medication-reminders',
      titleKey: 'CONFIG.SOLUTION_MEDICATION_REMINDERS',
      icon: 'fas fa-pills',
      contentKey: 'CONFIG.SOLUTION_MEDICATION_REMINDERS_DESC'
    },
    {
      id: 'medication-info',
      titleKey: 'CONFIG.SOLUTION_MEDICATION_INFO',
      icon: 'fas fa-book',
      contentKey: 'CONFIG.SOLUTION_MEDICATION_INFO_DESC'
    },
    {
      id: 'specific-doubts',
      titleKey: 'CONFIG.SOLUTION_SPECIFIC_DOUBTS',
      icon: 'fas fa-user-friends',
      contentKey: 'CONFIG.SOLUTION_SPECIFIC_DOUBTS_DESC'
    }
  ];

  hasChanges = computed(() => {
    const data = this.profileData();
    return (
      (data.name.trim() !== data.original.name.trim() && data.name.trim() !== '') ||
      data.phone.trim() !== data.original.phone.trim() ||
      data.email.trim() !== data.original.email.trim()
    );
  });

  private userId: string | null = null;

  constructor() { }

  ngOnInit(): void {
    this.fetchUserData();
    this.loadAlarmSettings();
    this.loadAccessibilitySettings();
    this.loadPrivacySettings();
    this.loadLanguageSettings();
    try { this.translationService.init(); } catch (e) { console.warn('Translation init failed', e); }
  }

  private loadLanguageSettings(): void {
    try {
      const storedLang = localStorage.getItem(this.languageStorageKey);
      if (storedLang) {
        this.selectedLanguage.set(storedLang);
      }
    } catch (e) {
      console.warn('Falha ao ler idioma salvo:', e);
    }
  }

  selectLanguage(code: string): void {
    if (code === 'other') {
      window.alert('Em desenvolvimento: Outros idiomas.');
      return;
    }

    this.selectedLanguage.set(code);
    try {
      const obs = this.translationService.use(code) as any;
      if (obs && typeof obs.subscribe === 'function') {
        obs.subscribe({
          next: () => {
            window.alert(this.translationService.instant('LANG.SAVED', { lang: code }));
          },
          error: (err: any) => {
            console.error('Erro ao mudar idioma dinamicamente:', err);
            this.saveAndReloadLanguage(code);
          }
        });
      } else {
        this.saveAndReloadLanguage(code);
      }
    } catch (e) {
      console.error('Erro ao mudar idioma dinamicamente:', e);
      this.saveAndReloadLanguage(code);
    }
  }

  saveAndReloadLanguage(langCode: string): void {
    try {
      console.debug('[Config] Salvando idioma:', langCode);
      localStorage.setItem(this.languageStorageKey, langCode);

      window.alert(`Idioma salvo: ${langCode}. A aplicação será recarregada para aplicar a mudança.`);
      try {
        window.location.reload();
      } catch (e) {
        console.warn('Reload direto falhou, tentando navegar antes do reload', e);
        this.router.navigate(['/']).then(() => window.location.reload());
      }

    } catch (e) {
      console.error('Erro ao salvar idioma:', e);
      window.alert('Erro ao salvar a configuração de idioma.');
    }
  }

  sendSupportMessage(): void {
    if (!this.supportMessage.trim()) {
      window.alert('Por favor, escreva uma mensagem antes de enviar.');
      return;
    }

    try {
      const messages = JSON.parse(localStorage.getItem('medtime-support-messages') || '[]');
      messages.push({
        id: Date.now(),
        text: this.supportMessage,
        timestamp: new Date().toISOString(),
        userId: this.authService.getUsuario()?.id || 'unknown'
      });
      localStorage.setItem('medtime-support-messages', JSON.stringify(messages));

      window.alert('Mensagem enviada com sucesso! O administrador receberá sua solicitação.');
      this.supportMessage = '';
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e);
      window.alert('Erro ao enviar a mensagem. Tente novamente.');
    }
  }

  openSolutionModal(solution: any): void {
    this.selectedSolution = solution;
    this.showSolutionModal.set(true);
  }

  closeSolutionModal(): void {
    this.showSolutionModal.set(false);
    this.selectedSolution = null;
  }

  private loadAlarmSettings(): void {
    try {
      const raw = localStorage.getItem(this.alarmStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as AlarmSettings;
        this.alarmSettings.set({ ...this.alarmSettings(), ...parsed });
      }
    } catch (e) {
      console.warn('Falha ao ler alarm settings:', e);
    }
  }

  saveAlarmSettings(): void {
    try {
      localStorage.setItem(this.alarmStorageKey, JSON.stringify(this.alarmSettings()));
      window.alert('Configurações de alertas salvas.');
    } catch (e) {
      console.error('Erro ao salvar alarm settings:', e);
      window.alert('Erro ao salvar as configurações de alertas.');
    }
  }

  resetAlarmSettings(): void {
    const defaults: AlarmSettings = {
      enabled: true,
      soundEnabled: false,
      soundName: 'despertador-curto',
      volume: 60,
      visualNotification: true,
      otherReminders: false,
    };
    this.alarmSettings.set(defaults);
    this.saveAlarmSettings();
  }

  private loadAccessibilitySettings(): void {
    try {
      const raw = localStorage.getItem(this.accessibilityStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as AccessibilitySettings;
        this.accessibilitySettings.set({ ...this.accessibilitySettings(), ...parsed });
      }
    } catch (e) {
      console.warn('Falha ao ler accessibility settings:', e);
    }
  }

  saveAccessibilitySettings(): void {
    try {
      localStorage.setItem(this.accessibilityStorageKey, JSON.stringify(this.accessibilitySettings()));
      window.alert('Configurações de acessibilidade salvas.');
    } catch (e) {
      console.error('Erro ao salvar accessibility settings:', e);
      window.alert('Erro ao salvar as configurações de acessibilidade.');
    }
  }

  resetAccessibilitySettings(): void {
    const defaults: AccessibilitySettings = {
      textSize: 'normal',
      contrast: false,
      darkMode: false,
      highContrast: false,
    };
    this.accessibilitySettings.set(defaults);
    this.saveAccessibilitySettings();
    this.accessibilityService.applyAccessibilityClasses(defaults);
  }

  setTextSize(size: AccessibilitySettings['textSize']): void {
    this.accessibilitySettings.update(s => ({ ...s, textSize: size }));
    this.saveAccessibilitySettings();
    this.accessibilityService.applyAccessibilityClasses(this.accessibilitySettings());
  }

  toggleAccessibility<K extends keyof AccessibilitySettings>(key: K) {
    this.accessibilitySettings.update(s => ({ ...s, [key]: !s[key] } as AccessibilitySettings));
    this.saveAccessibilitySettings();
    this.accessibilityService.applyAccessibilityClasses(this.accessibilitySettings());
  }

  private loadPrivacySettings(): void {
    try {
      const raw = localStorage.getItem(this.privacyStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as PrivacySettings;
        this.privacySettings.set({ ...this.privacySettings(), ...parsed });
      }
    } catch (e) {
      console.warn('Falha ao ler privacy settings:', e);
    }
  }

  savePrivacySettings(): void {
    try {
      localStorage.setItem(this.privacyStorageKey, JSON.stringify(this.privacySettings()));
      window.alert('Configurações de privacidade salvas.');
    } catch (e) {
      console.error('Erro ao salvar privacy settings:', e);
      window.alert('Erro ao salvar as configurações de privacidade.');
    }
  }

  togglePrivacy<K extends keyof PrivacySettings>(key: K): void {
    this.privacySettings.update(s => ({ ...s, [key]: !s[key] } as PrivacySettings));
    this.savePrivacySettings();
  }

  setSound(name: string) {
    this.alarmSettings.update(s => ({ ...s, soundName: name }));
    const isVibrationTest = name === 'vibracao';
    if (this.canPlaySound() || (isVibrationTest && this.alarmSettings().enabled)) {
      setTimeout(() => this.playPreview(name), 80);
    }
  }

  toggleAlarm<K extends keyof AlarmSettings>(key: K) {
    if (key === 'soundEnabled' && !this.alarmSettings().soundEnabled) {
      window.alert('Notificações sonoras ainda não estão disponíveis. Desculpe pelo inconveniente!');
      return;
    }
    this.alarmSettings.update(s => ({ ...s, [key]: !s[key] } as AlarmSettings));
  }

  setAlarmVolume(v: number | string) {
    const n = typeof v === 'string' ? parseInt(v as string, 10) : (v as number);
    const normalized = Math.max(0, Math.min(100, Number.isNaN(n) ? 60 : n));
    this.alarmSettings.update(s => ({ ...s, volume: normalized }));
    if (this.canPlaySound()) {
      this.playPreview('beep-volume-test');
    }
  }

  rangeBackground(): string {
    const v = this.alarmSettings().volume ?? 0;
    const primary = '#052659';
    const track = 'rgba(0,0,0,0.06)';
    return `linear-gradient(90deg, ${primary} ${v}%, ${track} ${v}%)`;
  }

  canPlaySound(): boolean {
    const s = this.alarmSettings();
    return !!(s.enabled && s.soundEnabled);
  }

  playPreview(soundName: string): void {
    if (!this.canPlaySound() && soundName !== 'beep-volume-test') { return; }
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) { return; }
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = Math.max(0, Math.min(1, (this.alarmSettings().volume / 100))) * 0.6;
      master.connect(ctx.destination);

      const now = ctx.currentTime;
      const scheduleTone = (time: number, duration: number, freq: number, type: OscillatorType = 'sine') => {
        if (!ctx || !master) return;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(1, time + 0.01);
        g.gain.linearRampToValueAtTime(0, time + duration - 0.02);
        o.connect(g);
        g.connect(master);
        o.start(time);
        o.stop(time + duration);
      };

      if (soundName === 'despertador-curto') {
        scheduleTone(now, 0.1, 784, 'square');
        scheduleTone(now + 0.15, 0.15, 988, 'square');
      } else if (soundName === 'despertador-longo') {
        scheduleTone(now, 0.1, 523, 'sine');
        scheduleTone(now + 0.15, 0.1, 659, 'sine');
        scheduleTone(now + 0.3, 0.1, 784, 'sine');
        scheduleTone(now + 0.5, 0.1, 523, 'sine');
        scheduleTone(now + 0.65, 0.1, 659, 'sine');
        scheduleTone(now + 0.8, 0.1, 784, 'sine');
      } else if (soundName === 'alarme-intermitente') {
        scheduleTone(now, 0.15, 880, 'square');
        scheduleTone(now + 0.3, 0.15, 880, 'square');
        scheduleTone(now + 0.6, 0.15, 880, 'square');
      } else if (soundName === 'vibracao') {
        const nav = (navigator as any);
        const vibrationPattern = [80, 70, 80, 70, 80, 70, 80];
        if (nav && nav.vibrate) {
          nav.vibrate(vibrationPattern);
        } else {
          scheduleTone(now, 0.08, 120, 'sine');
          scheduleTone(now + 0.15, 0.08, 120, 'sine');
          scheduleTone(now + 0.3, 0.08, 120, 'sine');
          scheduleTone(now + 0.45, 0.08, 120, 'sine');
        }
      } else if (soundName === 'beep-volume-test') {
        scheduleTone(now, 0.1, 700, 'sine');
      } else {
        scheduleTone(now, 0.25, 880, 'sine');
      }

      if (ctx) {
        setTimeout(() => {
          try { ctx?.close(); } catch (e) { }
        }, 1200);
      }
    } catch (e) {
      console.warn('Preview audio or vibration failed', e);
    }
  }

  selectPanel(panel: string): void {
    this.activePanel.set(panel);
  }

  goToDashboard(): void {
    try {
      this.router.navigate(['/dashboard']);
    } catch (e) {
      console.warn('Erro ao navegar para dashboard', e);
    }
  }

  async fetchUserData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const fromAuth = this.configService.getCurrentUserProfile();
      let profileData: UserProfile | null = fromAuth;

      if (!profileData || !profileData.phone) {
        try {
          const fetched = await firstValueFrom(this.configService.fetchProfileFromServer());
          profileData = fetched || profileData;
        } catch (e) {
          console.warn('Falha ao buscar perfil no servidor, usando dados locais se existirem.', e);
        }
      }

      const phone = profileData?.phone ?? '';
      const profile: UserProfile = {
        ...profileData,
        phone
      } as UserProfile;

      this.profileData.set({
        name: profile.name,
        email: profile.email,
        phone: phone,
        original: { name: profile.name, phone, email: profile.email }
      });

    } catch (error) {
      console.error('Erro ao buscar dados do perfil:', error);
      window.alert('Erro ao carregar seu perfil. Por favor, tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }

  updateField(field: 'name' | 'phone' | 'email', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.profileData.update(state => ({
      ...state,
      [field]: value
    }));
  }

  async saveChanges(): Promise<void> {
    if (!this.hasChanges() || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    const currentState = this.profileData();
    const originalState = currentState.original;

    const updates: Partial<UserProfile> = {};
    if (currentState.name.trim() !== originalState.name.trim() && currentState.name.trim() !== '') {
      updates.name = currentState.name.trim();
    }
    if (currentState.phone.trim() !== originalState.phone.trim()) {
      updates.phone = currentState.phone.trim();
    }
    if (currentState.email.trim() !== originalState.email.trim() && currentState.email.trim() !== '') {
      updates.email = currentState.email.trim();
    }

    if (Object.keys(updates).length === 0) {
      this.isLoading.set(false);
      return;
    }

    try {
      await firstValueFrom(this.configService.updateProfileOnServer(updates));

      this.profileData.update(state => ({
        ...state,
        original: { name: state.name, phone: state.phone, email: state.email }
      }));

      window.alert('Alterações salvas com sucesso!');

    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      window.alert('Erro ao salvar as alterações. Tente novamente.');

    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteAccount(): Promise<void> {
    if (this.isLoading()) {
      return;
    }

    this.showDeleteModal.set(false);
    this.isLoading.set(true);

    try {
      await firstValueFrom(this.configService.deleteAccountOnServer());

      window.alert('Sua conta foi excluída com sucesso. Você será desconectado.');

      this.profileData.set({
        name: '', email: '', phone: '', original: { name: '', phone: '', email: '' }
      });
      try {
        this.authService.logout();
      } catch (e) { }
      this.router.navigate(['/home']);

    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      window.alert('Erro ao excluir a conta. Por favor, tente novamente.');

    } finally {
      this.isLoading.set(false);
    }
  }

  openPrivacyPolicy(): void {
    this.router.navigate(['/politica-privacidade']);
  }

  openTermsOfUse(): void {
    this.router.navigate(['/termos-uso']);
  }

  exportUserDataAsPDF(): void {
    try {
      import('jspdf').then((module) => {
        const jsPDF = module.jsPDF;
        const pdf = new jsPDF();

        const profile = this.profileData();
        const now = new Date().toLocaleDateString('pt-BR');
        const primaryColor: [number, number, number] = [5, 38, 89];
        const textColor: [number, number, number] = [0, 0, 0];
        const lightGray: [number, number, number] = [100, 100, 100];

        let yPosition = 15;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;

        // Cabeçalho
        pdf.setFontSize(20);
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.text('RELATÓRIO DE DADOS PESSOAIS', margin, yPosition);

        yPosition += 10;
        pdf.setFontSize(10);
        pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
        pdf.text(`Gerado em: ${now}`, margin, yPosition);

        yPosition += 15;
        pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);

        // Informações Pessoais
        yPosition += 10;
        pdf.setFontSize(14);
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.text('INFORMAÇÕES PESSOAIS', margin, yPosition);

        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);

        const personalInfo = [
          { label: 'Nome:', value: profile.name || 'Não informado' },
          { label: 'Email:', value: profile.email || 'Não informado' },
          { label: 'Telefone:', value: profile.phone || 'Não informado' }
        ];

        personalInfo.forEach(info => {
          pdf.setFont('helvetica', 'bold');
          pdf.text(info.label, margin, yPosition);
          pdf.setFont('helvetica', 'normal');
          pdf.text(info.value, margin + 30, yPosition);
          yPosition += 7;
        });

        // Histórico de Pesquisas
        yPosition += 8;
        pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);

        yPosition += 10;
        pdf.setFontSize(14);
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.text('HISTÓRICO DE PESQUISAS', margin, yPosition);

        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);

        // Obter pesquisas do localStorage
        const searchHistory: string[] = [];
        try {
          const stored = localStorage.getItem('medtime-search-history');
          if (stored) {
            searchHistory.push(...JSON.parse(stored).slice(-10));
          }
        } catch (e) {
          console.warn('Erro ao recuperar histórico de pesquisas:', e);
        }

        if (searchHistory.length > 0) {
          searchHistory.forEach((search, index) => {
            if (yPosition > pageHeight - margin - 10) {
              pdf.addPage();
              yPosition = 15;
            }
            pdf.text(`${index + 1}. ${search}`, margin + 5, yPosition);
            yPosition += 6;
          });
        } else {
          pdf.text('Nenhuma pesquisa realizada.', margin + 5, yPosition);
          yPosition += 6;
        }

        // Receitas Cadastradas
        yPosition += 8;
        if (yPosition > pageHeight - margin - 30) {
          pdf.addPage();
          yPosition = 15;
        }

        pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);

        yPosition += 10;
        pdf.setFontSize(14);
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.text('RECEITAS CADASTRADAS', margin, yPosition);

        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);

        // Obter receitas do localStorage
        const recipes: any[] = [];
        try {
          const stored = localStorage.getItem('medtime-recipes');
          if (stored) {
            recipes.push(...JSON.parse(stored).slice(-10));
          }
        } catch (e) {
          console.warn('Erro ao recuperar receitas:', e);
        }

        if (recipes.length > 0) {
          recipes.forEach((recipe, index) => {
            // Verificar se precisa de nova página
            if (yPosition > pageHeight - margin - 25) {
              pdf.addPage();
              yPosition = 15;
            }

            pdf.setFont('helvetica', 'bold');
            pdf.text(`${index + 1}. ${recipe.name || 'Sem nome'}`, margin + 5, yPosition);
            yPosition += 5;

            pdf.setFont('helvetica', 'normal');
            if (recipe.doctor) {
              pdf.text(`Médico: ${recipe.doctor}`, margin + 10, yPosition);
              yPosition += 4;
            }
            if (recipe.medications && Array.isArray(recipe.medications)) {
              pdf.text(`Medicamentos: ${recipe.medications.length}`, margin + 10, yPosition);
              yPosition += 4;
            }
            if (recipe.date) {
              pdf.text(`Data: ${recipe.date}`, margin + 10, yPosition);
              yPosition += 4;
            }
            yPosition += 3;
          });
        } else {
          pdf.text('Nenhuma receita cadastrada.', margin + 5, yPosition);
          yPosition += 6;
        }

        // Rodapé
        yPosition += 10;
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 15;
        }

        pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);

        yPosition += 8;
        pdf.setFontSize(8);
        pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
        pdf.text('Este documento contém informações privadas do usuário. Mantenha em local seguro.', margin, yPosition);
        yPosition += 4;
        pdf.text('MedTime - Seu assistente de medicamentos. Data de exportação: ' + now, margin, yPosition);
        pdf.save(`medtime-dados-${profile.name?.replace(/\s+/g, '-') || 'usuario'}-${now.replace(/\//g, '-')}.pdf`);

        window.alert('PDF exportado com sucesso!');

      }).catch((error) => {
        console.error('Erro ao carregar jsPDF:', error);
        window.alert('Erro ao gerar o PDF. Por favor, tente novamente.');
      });
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      window.alert('Erro ao exportar os dados. Por favor, tente novamente.');
    }
  }

}
