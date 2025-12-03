import { Injectable } from '@angular/core';

interface AccessibilitySettings {
  textSize: 'pequeno' | 'normal' | 'grande' | 'extra';
  contrast: boolean;
  darkMode: boolean;
  highContrast: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {

  private accessibilityStorageKey = 'medtime-accessibility-settings';

  constructor() {
    this.loadAndApplyAccessibilitySettings();
  }

  loadAndApplyAccessibilitySettings(): void {
    try {
      const raw = localStorage.getItem(this.accessibilityStorageKey);
      const settings: AccessibilitySettings = raw
        ? JSON.parse(raw)
        : { textSize: 'normal', contrast: false, darkMode: false, highContrast: false };

      this.applyAccessibilityClasses(settings);
    } catch (e) {
      console.warn('Falha ao carregar accessibility settings:', e);
      this.applyAccessibilityClasses({ textSize: 'normal', contrast: false, darkMode: false, highContrast: false });
    }
  }

  applyAccessibilityClasses(settings: AccessibilitySettings): void {
    try {
      const root = document.documentElement;
      
      root.classList.remove('text-size-pequeno', 'text-size-normal', 'text-size-grande', 'text-size-extra');
      const size = settings.textSize ?? 'normal';
      root.classList.add(`text-size-${size}`);

      if (settings.contrast) root.classList.add('contrast-on'); else root.classList.remove('contrast-on');
      if (settings.darkMode) root.classList.add('dark-mode'); else root.classList.remove('dark-mode');
      if (settings.highContrast) root.classList.add('high-contrast'); else root.classList.remove('high-contrast');
    } catch (e) {
      console.warn('Não foi possível aplicar classes de acessibilidade', e);
    }
  }
}
