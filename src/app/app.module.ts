import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { Observable } from 'rxjs';

export function HttpLoaderFactory(http: HttpClient): any {
  return {
    getTranslation: (lang: string): Observable<any> => http.get(`assets/i18n/${lang}.json`)
  };
}
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './views/home/home.component';
import { LoginComponent } from './views/login/login.component';
import { SobreComponent } from './views/sobre/sobre.component';
import { CuriosidadesComponent } from './views/curiosidades/curiosidades.component';
import { FooterComponent } from './templates/footer/footer.component';
import { HeaderComponent } from './templates/header/header.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { AdministradorComponent } from './views/administrador/administrador.component';
import { ConfiguracaoComponent } from './views/configuracao/configuracao.component';
import { PoliticaPrivacidadeComponent } from './views/politica-privacidade/politica-privacidade.component';
import { ScannerComponent } from './views/scanner/scanner.component';
import { QrcodeComponent } from './views/qrcode/qrcode.component';
import { TermosComponent } from './views/termos/termos.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    SobreComponent,
    CuriosidadesComponent,
    FooterComponent,
    HeaderComponent,
    DashboardComponent,
    AdministradorComponent,
    ConfiguracaoComponent,
    PoliticaPrivacidadeComponent,
    ScannerComponent,
    QrcodeComponent,
    TermosComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule.forRoot({
      defaultLanguage: 'pt-BR',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],

})
export class AppModule {}
