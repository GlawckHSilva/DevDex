"use client";

import Image from "next/image";
import { useState } from "react";
import { Bot, Check, Flame, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { FaGithub, FaGoogle } from "react-icons/fa";

type Props = {
  error: string | null;
  googleEnabled: boolean;
  githubEnabled: boolean;
  googleUrl: string;
  githubUrl: string;
  chatgptUrl: string;
};

export function LoginExperience(props: Props) {
  const [signup, setSignup] = useState(false);

  return <main className="login-page">
    <section className="login-shell">
      <header className="login-header">
        <a className="brand" href="/"><Image src="/brand/devdex-logo.png" alt="" width={38} height={38} /><span>DevDex</span></a>
        <a className="login-back" href="/">← Voltar ao início</a>
      </header>
      <div className="login-layout">
        <div className="login-auth-stage">
          <div className="login-flip-card" data-signup={signup}>
            <AuthFace {...props} signup={false} active={!signup} onFlip={() => setSignup(true)} />
            <AuthFace {...props} signup active={signup} onFlip={() => setSignup(false)} />
          </div>
        </div>
        <aside className="login-visual" aria-label="Sua jornada no DevDex">
          <div className="login-visual-glow" />
          <div className="login-visual-copy"><span><Sparkles /> UNIVERSO DEVDEX</span><h2>Aprenda.<br />Lute. Evolua.</h2><p>Cada desafio concluído transforma código em experiência.</p></div>
          <Image className="login-character" src="/characters/adventurer-male-sprite-v2.png" alt="Personagem do DevDex" width={310} height={420} priority />
          <div className="login-progress-card">
            <div><strong>PRÓXIMO NÍVEL</strong><span>160 / 200 XP</span></div>
            <i><b style={{ width: "80%" }} /></i>
            <footer><span><Heart /> 5/5</span><span><Flame /> 7 dias</span><span><ShieldCheck /> Progresso salvo</span></footer>
          </div>
        </aside>
      </div>
    </section>
  </main>;
}

function AuthFace(props: Props & { signup: boolean; active: boolean; onFlip: () => void }) {
  const verb = props.signup ? "Criar conta com" : "Continuar com";
  return <section className={`login-face ${props.signup ? "login-face-back" : "login-face-front"}`} aria-hidden={!props.active}>
    <span className="kicker">{props.signup ? "COMENCE SUA AVENTURA" : "CONTINUE SUA JORNADA"}</span>
    <h1>{props.signup ? "Crie sua conta" : "Boas-vindas de volta!"}</h1>
    <p>{props.signup ? "Escolha uma conta para criar seu perfil e começar a ganhar XP." : "Entre para continuar exatamente de onde parou."}</p>
    {props.error && !props.signup && <div className="login-error" role="alert">{props.error}</div>}
    <div className="login-divider"><span>{props.signup ? "CADASTRO SEGURO" : "ESCOLHA COMO ENTRAR"}</span></div>
    <div className="login-options">
      <Provider href={props.googleUrl} active={props.active} enabled={props.googleEnabled} className="login-google" icon={<FaGoogle />} label={`${verb} Google`} />
      <Provider href={props.githubUrl} active={props.active} enabled={props.githubEnabled} icon={<FaGithub />} label={`${verb} GitHub`} />
      <Provider href={props.chatgptUrl} active={props.active} enabled icon={<Bot />} label={`${verb} ChatGPT`} top />
    </div>
    {props.signup && <p className="login-assurance"><Check /> Seu progresso será vinculado ao e-mail verificado.</p>}
    <button className="login-switch" type="button" onClick={props.onFlip} tabIndex={props.active ? 0 : -1}>
      {props.signup ? "Já tem uma conta? " : "Ainda não tem uma conta? "}<strong>{props.signup ? "Entrar" : "Criar conta"}</strong>
    </button>
  </section>;
}

function Provider({ href, label, icon, enabled, active, className = "", top = false }: { href: string; label: string; icon: React.ReactNode; enabled: boolean; active: boolean; className?: string; top?: boolean }) {
  return <a className={`login-provider ${className}`} href={enabled ? href : "#"} aria-disabled={!enabled} tabIndex={active ? 0 : -1} target={top ? "_top" : undefined} onClick={enabled ? undefined : (event) => event.preventDefault()}>
    {icon}<span>{label}</span>{!enabled && <small>Configuração pendente</small>}
  </a>;
}
