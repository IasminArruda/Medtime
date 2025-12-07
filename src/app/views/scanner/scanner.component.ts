import { Component, OnDestroy, AfterViewInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from 'src/app/services/translation.service';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.scss']
})
export class ScannerComponent implements AfterViewInit, OnDestroy {
  private html5QrCode: any = null;
  private scriptLoaded = false;
  cameras: any[] = [];
  currentCameraIndex = 0;

  constructor(private ngZone: NgZone, private router: Router, private translation: TranslationService) {}

  ngAfterViewInit(): void {
    this.loadScript()
      .then(() => this.startScanner())
      .catch(err => console.error('Erro ao carregar scanner:', err));
  }

  ngOnDestroy(): void {
    try {
      if (this.html5QrCode && this.html5QrCode.stop) {
        this.html5QrCode.stop().catch(() => {});
      }
    } catch (e) { }
  }

  private loadScript(): Promise<void> {
    if (this.scriptLoaded) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-html5-qrcode]');
      if (existing) { this.scriptLoaded = true; resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode';
      script.setAttribute('data-html5-qrcode', 'true');
      script.onload = () => { this.scriptLoaded = true; resolve(); };
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  }

  private startScanner(): void {
    const globalAny: any = window as any;
    if (!globalAny.Html5Qrcode) {
      console.error('Html5Qrcode não disponível.');
      return;
    }

    try {
      const readerId = 'reader';
      this.html5QrCode = new globalAny.Html5Qrcode(readerId);
      globalAny.Html5Qrcode.getCameras().then((devices: any[]) => {
        if (devices && devices.length) {
          this.cameras = devices;
          const cameraId = devices[this.currentCameraIndex].id;
          this.html5QrCode.start(
            cameraId,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText: string) => {
              this.ngZone.run(() => this.onScanSuccess(decodedText));
            },
            (errorMessage: any) => {
            }
          ).catch((err: any) => console.error('Start error', err));
        }
      }).catch((err: any) => console.error('Cameras error', err));
    } catch (e) {
      console.error('Erro ao iniciar scanner', e);
    }
  }

  async flipCamera(): Promise<void> {
    try {
      if (!this.cameras || this.cameras.length <= 1) return;
      if (this.html5QrCode && this.html5QrCode.stop) {
        await this.html5QrCode.stop().catch(() => {});
      }
      this.currentCameraIndex = (this.currentCameraIndex + 1) % this.cameras.length;
      const nextId = this.cameras[this.currentCameraIndex].id;
      const globalAny: any = window as any;
      this.html5QrCode = new globalAny.Html5Qrcode('reader');
      await this.html5QrCode.start(
        nextId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          this.ngZone.run(() => this.onScanSuccess(decodedText));
        },
        (errorMessage: any) => {
        }
      ).catch((err: any) => console.error('Start error', err));
    } catch (e) {
      console.error('Erro ao alternar câmera', e);
    }
  }

  private onScanSuccess(decodedText: string): void {
    try {
      if (this.html5QrCode && this.html5QrCode.stop) {
        this.html5QrCode.stop().catch(() => {});
      }
    } catch (e) { }

    const navigateWithData = (data: any) => {
      try {
        this.router.navigate(['/qrcode'], { state: { qrData: data } });
      } catch (e) {
        console.error('Navigation error', e);
      }
    };

    if (decodedText && decodedText.startsWith('http')) {
      try {
        const url = new URL(decodedText);
        const params = url.searchParams;
        const data: any = {};

        if (params.has('data')) {
          const dataParam = params.get('data');
          try {
            const decoded = decodeURIComponent(dataParam!);
            const jsonData = JSON.parse(decoded);
            Object.assign(data, jsonData);
          } catch (e) {
            console.warn('Falha ao decodificar data parameter', e);
          }
        }

        if (Object.keys(data).length === 0) {
          if (params.has('nome')) data.nome = params.get('nome');
          if (params.has('dose')) data.dose = params.get('dose');
          if (params.has('intervalo')) data.intervalo = params.get('intervalo');
          if (params.has('duracao')) data.duracao = params.get('duracao');
        }

        if (Object.keys(data).length === 0) {
          navigateWithData({ nome: 'Medicamento desconhecido', dose: '', intervalo: '', duracao: '' });
        } else {
          navigateWithData(data);
        }
      } catch (e) {
        console.error('Erro ao parsear URL do QR Code:', e);
        navigateWithData({ nome: 'Medicamento desconhecido', dose: '', intervalo: '', duracao: '' });
      }
    } else {
      try {
        const parsed = JSON.parse(decodedText);
        navigateWithData(parsed);
      } catch (e) {
        navigateWithData({ nome: decodedText, dose: '', intervalo: '', duracao: '' });
      }
    }
  }

  readManualUrl(val: string): void {
    if (!val || !val.trim()) { window.alert(this.translation.instant('SCANNER.ALERT_PASTE_URL')); return; }
    this.onScanSuccess(val.trim());
  }
}
