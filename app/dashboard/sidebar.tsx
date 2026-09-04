import { BookOpen, Database, FolderKanban, Gauge, LogOut, Map, Sparkles, Terminal, Trophy } from "lucide-react";
import { SiCss3, SiGithub, SiHtml5, SiJavascript, SiPython } from "react-icons/si";
import { TbSql } from "react-icons/tb";

type SidebarCampaign = { slug: string; pathSlug: string; technologyName: string; progress: number };

export function AppSidebar({ campaigns, skillPoints, admin, signOutHref, activePath = "/dashboard" }: { campaigns: SidebarCampaign[]; skillPoints: number; admin: boolean; signOutHref: string; activePath?: string }) {
  const active = (href: string) => activePath === href;

  return <aside className="sidebar app-sidebar">
    <a className="brand" href="/" title="DevDex"><span className="brand-mark">D_</span><span className="sidebar-brand-name">DevDex</span></a>
    <nav aria-label="Área do aluno">
      <div className="sidebar-nav-section"><small>EXPLORAR</small><a className={active("/dashboard") ? "sidebar-active" : undefined} href="/dashboard" title="Campanhas"><Map /><span>Campanhas</span></a><a className={active("/biblioteca") ? "sidebar-active" : undefined} href="/biblioteca" title="Biblioteca"><BookOpen /><span>Biblioteca</span></a><a className={active("/maestria") ? "sidebar-active" : undefined} href="/maestria" title="Maestria"><Gauge /><span>Maestria</span></a><a className={active("/habilidades") ? "sidebar-active" : undefined} href="/habilidades" title="Habilidades"><Sparkles /><span>Habilidades</span>{skillPoints ? <b>{skillPoints}</b> : null}</a></div>
      <div className="sidebar-nav-section"><small>TRILHAS</small>{campaigns.map((campaign) => { const href = `/trilhas/${campaign.pathSlug}`; return <a className={active(href) ? "sidebar-active" : undefined} href={href} key={campaign.slug} title={campaign.technologyName}><CampaignIcon technology={campaign.technologyName} /><span>{campaign.technologyName}</span><i>{campaign.progress}%</i></a>; })}</div>
      <div className="sidebar-nav-section"><small>CARREIRA</small><a className={active("/projetos/lista-de-tarefas") ? "sidebar-active" : undefined} href="/projetos/lista-de-tarefas" title="Projetos"><FolderKanban /><span>Projetos</span></a>{admin ? <a href="/admin/metricas" title="Métricas"><Database /><span>Métricas</span></a> : null}<span className="sidebar-disabled" aria-disabled="true" title="Conquistas — em breve"><Trophy /><span>Conquistas</span><em>EM BREVE</em></span></div>
    </nav>
    <a className="signout" href={signOutHref} title="Sair"><LogOut /><span>Sair</span></a>
  </aside>;
}

function CampaignIcon({ technology }: { technology: string }) {
  const icon = technology === "GitHub" ? [SiGithub, "github"] : technology === "HTML" ? [SiHtml5, "html"] : technology === "CSS" ? [SiCss3, "css"] : technology === "JavaScript" ? [SiJavascript, "javascript"] : technology === "SQL" ? [TbSql, "sql"] : technology === "Python" ? [SiPython, "python"] : [Terminal, "default"];
  const [Icon, name] = icon;
  return <Icon className={`technology-icon technology-${name}`} aria-hidden="true" />;
}
