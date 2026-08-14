"use client";

import { useState } from "react";
import type { Archetype } from "@/db";

export function CharacterSelect() {
  const [loading, setLoading] = useState<Archetype | null>(null);
  async function choose(archetype: Archetype) {
    setLoading(archetype);
    const response = await fetch("/api/character", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ archetype }) });
    if (response.ok) location.reload(); else setLoading(null);
  }
  return <div className="character-choice" data-testid="character-select">
    <button onClick={() => choose("adventurer")} disabled={loading !== null}><PixelHero archetype="adventurer" /><span>Aventureiro</span><small>{loading === "adventurer" ? "Preparando…" : "Determinação e coragem"}</small></button>
    <button onClick={() => choose("adventuress")} disabled={loading !== null}><PixelHero archetype="adventuress" /><span>Aventureira</span><small>{loading === "adventuress" ? "Preparando…" : "Agilidade e estratégia"}</small></button>
  </div>;
}

export function PixelHero({ archetype, small = false }: { archetype: Archetype; small?: boolean }) {
  if (archetype === "adventurer") return <div className={`pixel-hero${small ? " pixel-small" : ""}`} style={{ background: "center / contain no-repeat url('/characters/adventurer-male-sprite-v2.png')" }} aria-label="Aventureiro" />;
  return <div className={`pixel-hero${small ? " pixel-small" : ""}`} style={{ background: "center / contain no-repeat url('/characters/adventuress-female-v1.png')" }} aria-label="Aventureira" />;
}
