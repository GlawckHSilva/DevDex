import { LegalPage } from "@/app/legal-page";

export const metadata = { title: "Política de Privacidade" };

export default function PrivacyPage() {
  return <LegalPage title="Política de Privacidade">
    <p>O DevDex usa os dados da sua conta somente para autenticar seu acesso, manter seu perfil e registrar progresso, XP e atividades de aprendizado.</p>
    <h2>Dados utilizados</h2>
    <p>Podemos receber nome, e-mail verificado e identificador da conta escolhida no login. Não recebemos nem armazenamos sua senha do Google, GitHub ou ChatGPT.</p>
    <h2>Uso e proteção</h2>
    <p>Os dados são usados para operar a plataforma e preservar o progresso individual. Não vendemos informações pessoais. O acesso é limitado aos serviços necessários para o funcionamento do DevDex.</p>
    <h2>Contato</h2>
    <p>Para dúvidas ou solicitações sobre seus dados, escreva para <a href="mailto:tad-glawcksilva@ucpparana.edu.br">tad-glawcksilva@ucpparana.edu.br</a>.</p>
  </LegalPage>;
}
