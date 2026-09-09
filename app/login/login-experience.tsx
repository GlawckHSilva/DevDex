"use client";

import Image from "next/image";
import { type FormEvent, type ReactNode, useState } from "react";
import { Bot, Check, Eye, EyeOff, Flame, Heart, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { FaGithub, FaGoogle } from "react-icons/fa";

type Props = {
  error: string | null;
  googleEnabled: boolean;
  githubEnabled: boolean;
  googleUrl: string;
  githubUrl: string;
  chatgptUrl: string;
  passwordEnabled: boolean;
  returnTo: string;
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
  const [showPassword, setShowPassword] = useState(false);
  const [reset, setReset] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; ok: boolean } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setPending(true); setFeedback(null);
    const form = new FormData(formElement);
    if (props.signup && form.get("password") !== form.get("confirmPassword")) {
      setPending(false); setFeedback({ message: "As senhas não são iguais.", ok: false }); return;
    }
    const action = reset ? "reset" : props.signup ? "signup" : "login";
    try {
      const response = await fetch("/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, name: form.get("name"), email: form.get("email"), password: form.get("password"), returnTo: props.returnTo }) });
      const result = await response.json() as { ok: boolean; message?: string; returnTo?: string };
      if (result.message) setFeedback({ message: result.message, ok: result.ok });
      if (result.ok && result.returnTo) window.location.assign(result.returnTo);
      if (result.ok && props.signup) formElement.reset();
    } catch { setFeedback({ message: "Não foi possível conectar. Tente novamente.", ok: false }); }
    finally { setPending(false); }
  }
  return <section className={`login-face ${props.signup ? "login-face-back" : "login-face-front"}`} aria-hidden={!props.active}>
    <span className="kicker">{reset ? "RECUPERE SEU ACESSO" : props.signup ? "COMENCE SUA AVENTURA" : "CONTINUE SUA JORNADA"}</span>
    <h1>{reset ? "Recuperar senha" : props.signup ? "Crie sua conta" : "Boas-vindas de volta!"}</h1>
    <p>{reset ? "Enviaremos as instruções para o seu e-mail." : props.signup ? "Crie seu perfil e comece a ganhar XP." : "Entre para continuar exatamente de onde parou."}</p>
    {props.error && !props.signup && <div className="login-error" role="alert">{props.error}</div>}
    <form className="login-form" onSubmit={submit}>
      {props.signup && !reset && <Field icon={<UserRound />} label="Nome" name="name" type="text" placeholder="Como devemos chamar você?" active={props.active} autoComplete="name" />}
      <Field icon={<Mail />} label="E-mail" name="email" type="email" placeholder="voce@exemplo.com" active={props.active} autoComplete="email" />
      {!reset && <label className="login-field"><span>Senha</span><i><LockKeyhole /><input name="password" type={showPassword ? "text" : "password"} minLength={8} maxLength={128} required tabIndex={props.active ? 0 : -1} autoComplete={props.signup ? "new-password" : "current-password"} placeholder="Mínimo de 8 caracteres" /><button type="button" onClick={() => setShowPassword((value) => !value)} tabIndex={props.active ? 0 : -1} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff /> : <Eye />}</button></i></label>}
      {props.signup && !reset && <Field icon={<LockKeyhole />} label="Confirmar senha" name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Repita sua senha" active={props.active} autoComplete="new-password" minLength={8} />}
      {!props.signup && !reset && <button className="login-forgot" type="button" onClick={() => { setReset(true); setFeedback(null); }} tabIndex={props.active ? 0 : -1}>Esqueci minha senha</button>}
      {feedback && <div className={`login-feedback ${feedback.ok ? "success" : ""}`} role="status">{feedback.message}</div>}
      <button className="login-submit" type="submit" disabled={pending || !props.passwordEnabled} tabIndex={props.active ? 0 : -1}>{pending ? <LoaderCircle className="login-spinner" /> : reset ? "Enviar recuperação" : props.signup ? "Criar conta" : "Entrar"}</button>
      {!props.passwordEnabled && <small className="login-pending">Login por e-mail em configuração.</small>}
    </form>
    {reset ? <button className="login-switch" type="button" onClick={() => { setReset(false); setFeedback(null); }} tabIndex={props.active ? 0 : -1}>← Voltar para entrar</button> : <>
      <div className="login-divider"><span>OU CONTINUE COM</span></div>
      <div className="login-socials">
        <Provider href={props.googleUrl} active={props.active} enabled={props.googleEnabled} className="login-google" icon={<FaGoogle />} label="Google" />
        <Provider href={props.githubUrl} active={props.active} enabled={props.githubEnabled} icon={<FaGithub />} label="GitHub" />
        <Provider href={props.chatgptUrl} active={props.active} enabled icon={<Bot />} label="ChatGPT" top />
      </div>
      {props.signup && <p className="login-assurance"><Check /> Seu progresso será vinculado ao e-mail verificado.</p>}
    </>}
    <button className="login-switch" type="button" onClick={props.onFlip} tabIndex={props.active ? 0 : -1}>
      {props.signup ? "Já tem uma conta? " : "Ainda não tem uma conta? "}<strong>{props.signup ? "Entrar" : "Criar conta"}</strong>
    </button>
  </section>;
}

function Field({ icon, label, active, ...input }: { icon: ReactNode; label: string; active: boolean; name: string; type: string; placeholder: string; autoComplete: string; minLength?: number }) {
  return <label className="login-field"><span>{label}</span><i>{icon}<input {...input} required tabIndex={active ? 0 : -1} /></i></label>;
}

function Provider({ href, label, icon, enabled, active, className = "", top = false }: { href: string; label: string; icon: ReactNode; enabled: boolean; active: boolean; className?: string; top?: boolean }) {
  return <a className={`login-provider ${className}`} href={enabled ? href : "#"} aria-disabled={!enabled} tabIndex={active ? 0 : -1} target={top ? "_top" : undefined} onClick={enabled ? undefined : (event) => event.preventDefault()}>
    {icon}<span>{label}</span>
  </a>;
}
