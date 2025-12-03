import { Component, inject, effect } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AccessibilityService } from './services/accessibility.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  private translate = inject(TranslateService);
  private router = inject(Router);
  private accessibilityService = inject(AccessibilityService);

  esconderHeaderFooter = false;
  isHomePage: any;

  constructor() {
    this.initializeTranslation();

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Adicione todas as rotas que NÃO devem mostrar header/footer
        this.esconderHeaderFooter = ['/login'].includes(
          event.urlAfterRedirects
        );
      }
    });
  }

  private initializeTranslation() {
    this.translate.setDefaultLang('pt-BR');

    const storedLang = localStorage.getItem('medtime-app-language');
    const browserLang = navigator.language || 'pt-BR';
    const supported = ['pt-BR', 'en-US', 'es', 'fr'];

    const activeLanguage = storedLang || (supported.includes(browserLang) ? browserLang : 'pt-BR');
    console.log('Setting language to:', activeLanguage);
    this.translate.use(activeLanguage).subscribe(
      () => console.log('Language loaded successfully:', activeLanguage),
      (error) => console.error('Error loading language:', activeLanguage, error)
    );
  }

  title(title: any) {
    throw new Error('Method not implemented.');
  }
}

