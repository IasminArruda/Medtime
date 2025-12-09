import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface PrivacidadeItem {
  id: string;
  title: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrivacidadeService {
  private key = 'privacidade_docs';
  private subject = new BehaviorSubject<PrivacidadeItem[]>([]);
  items$ = this.subject.asObservable();

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) {
        const parsed: PrivacidadeItem[] = JSON.parse(raw) || [];
        while (parsed.length < 2) {
          const idx = parsed.length;
          parsed.push({ id: idx === 0 ? 'policy' : 'terms', title: idx === 0 ? 'Política de Privacidade' : 'Termos de Uso', content: '' });
        }
        this.subject.next(parsed);
      } else {
        const initial: PrivacidadeItem[] = [
          { id: 'policy', title: 'Política de Privacidade', content: `
            <h3>Política de Privacidade</h3>
            <p>A MedTime valoriza sua privacidade e adota medidas técnicas e administrativas para proteger seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD).</p>
            <p>Coleta: Podemos coletar informações fornecidas por você ao criar uma conta ou utilizar nossos serviços, tais como nome, e-mail, telefone, dados de saúde e preferências de notificação. Também coletamos dados técnicos automaticamente (endereço IP, tipo de dispositivo e registros de uso) para melhorar a experiência.</p>
            <p>Finalidade: Utilizamos seus dados para fornecer e operar o serviço (envio de alertas e lembretes), para armazenar histórico de notificações, para melhorar e personalizar a plataforma, e para fins administrativos e de segurança.</p>
            <p>Compartilhamento: Não vendemos seus dados. Podemos compartilhar informações com prestadores de serviço que nos auxiliam (ex.: envio de SMS/e-mail) sob obrigações contratuais de confidencialidade. Também poderemos divulgar dados quando exigido por lei ou por ordem judicial.</p>
            <p>Segurança: Adotamos práticas de segurança razoáveis para proteger os dados. Contudo, nenhuma transmissão pela Internet é totalmente segura; por isso encorajamos boas práticas de proteção de conta (senhas fortes, manter o acesso ao dispositivo seguro).</p>
            <p>Retenção e direitos: Reteremos dados pelo tempo necessário às finalidades descritas. Você tem direitos como acesso, correção, exclusão e portabilidade, conforme a LGPD. Para exercer esses direitos, entre em contato conosco por meio dos canais disponíveis na plataforma.</p>
            <p>Cookies e tecnologias similares: Utilizamos cookies e tecnologias semelhantes para fins analíticos e funcionais; você pode configurar seu navegador para rejeitá-los, o que pode afetar a experiência.</p>
            <p>Contato: Para dúvidas, solicitações ou reclamações sobre privacidade, entre em contato pelo e-mail de suporte disponível na plataforma.</p>
          ` },
          { id: 'terms', title: 'Termos de Uso', content: `
            <h3>Termos de Uso</h3>
            <p>Ao utilizar o MedTime, você concorda com estes Termos de Uso e com as regras e políticas da plataforma. Se não concordar, não utilize o serviço.</p>
            <p>Uso do serviço: Você se compromete a fornecer informações verdadeiras e a utilizar a plataforma de forma responsável, não violando leis aplicáveis, direitos de terceiros ou regras de conduta.</p>
            <p>Conta e credenciais: Caso crie uma conta, você é responsável por manter a confidencialidade de suas credenciais e por todas as atividades realizadas por meio dela.</p>
            <p>Conteúdo: O usuário é responsável pelo conteúdo que inserir na plataforma. A MedTime pode excluir conteúdo que viole políticas ou leis e pode suspender contas em caso de abuso.</p>
            <p>Limitação de responsabilidade: Na máxima extensão permitida por lei, a MedTime não será responsável por danos indiretos, incidentais, especiais ou consequenciais decorrentes do uso da plataforma.</p>
            <p>Modificações: Podemos modificar os Termos e a plataforma; alterações importantes serão comunicadas. O uso contínuo após mudanças implica aceitação das novas condições.</p>
            <p>Legislação aplicável: Estes Termos são regidos pela legislação brasileira, e eventuais disputas serão dirimidas conforme previsto na legislação vigente.</p>
          ` }
        ];
        try { localStorage.setItem(this.key, JSON.stringify(initial)); } catch {}
        this.subject.next(initial);
      }
    } catch (e) {
      this.subject.next([]);
    }
  }

  getList() {
    return this.subject.getValue();
  }

  update(index: number, item: PrivacidadeItem) {
    const list = this.getList();
    list[index] = item;
    try { localStorage.setItem(this.key, JSON.stringify(list)); } catch {}
    this.subject.next(list.slice());
  }
}
