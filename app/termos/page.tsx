import { LegalPage } from "@/app/legal-page";

export const metadata = { title: "Termos de Serviço" };

export default function TermsPage() {
  return <LegalPage title="Termos de Serviço">
    <p>Ao usar o DevDex, você concorda em utilizar a plataforma para fins de aprendizado e respeitar as regras das atividades, serviços integrados e demais usuários.</p>
    <h2>Sua conta</h2>
    <p>Você é responsável por manter sua conta segura. O progresso, XP e conquistas pertencem ao perfil autenticado e não devem ser obtidos por manipulação ou abuso do sistema.</p>
    <h2>Disponibilidade</h2>
    <p>O conteúdo e os recursos podem evoluir ao longo do tempo. Buscamos manter a plataforma disponível e preservar o progresso, mas manutenções podem ocorrer.</p>
    <h2>Contato</h2>
    <p>Em caso de dúvida sobre estes termos, escreva para <a href="mailto:tad-glawcksilva@ucpparana.edu.br">tad-glawcksilva@ucpparana.edu.br</a>.</p>
  </LegalPage>;
}
