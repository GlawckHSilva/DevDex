"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Avatar } from "@/db/gameplay";

export function AvatarPicker({ avatars, next }: { avatars: Avatar[]; next: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState(avatars[0]?.id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const current = avatars.find((avatar) => avatar.id === selected);

  async function confirm() {
    if (!selected) return;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/player/avatar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ avatarId: selected }) });
      if (!response.ok) throw new Error();
      router.push(next);
      router.refresh();
    } catch { setError("Não foi possível salvar a escolha. Tente novamente."); }
    finally { setSaving(false); }
  }

  return <section className="avatar-picker" aria-label="Escolha de personagem">
    <div className="avatar-options">{avatars.map((avatar) => <button type="button" key={avatar.id} className={`avatar-card ${selected === avatar.id ? "selected" : ""} ${avatar.sprite}`} onClick={() => setSelected(avatar.id)} aria-pressed={selected === avatar.id}>
      <span className="avatar-sprite" aria-hidden="true"><i /><i /><i /></span><small>{avatar.role}</small><strong>{avatar.name}</strong><p>{avatar.description}</p><span className="select-mark">{selected === avatar.id ? "SELECIONADO" : "ESCOLHER"}</span>
    </button>)}</div>
    <div className="avatar-confirm"><div><small>AVENTUREIRO ATIVO</small><strong>{current?.name}</strong></div><button className="button" type="button" onClick={confirm} disabled={saving}>{saving ? "Preparando…" : "Começar jornada →"}</button></div>
    {error ? <p className="avatar-error" role="alert">{error}</p> : null}
  </section>;
}
