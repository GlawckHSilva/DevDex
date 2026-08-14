"use client";

import { PixelHero } from "@/app/aventura/character-select";
import type { Archetype } from "@/db";

export type BattleView = { enemyName: string; enemyType: "enemy" | "elite" | "boss"; enemyLevel: number; lives: number; state: "active" | "defeated" | "completed"; archetype: Archetype };

export function BattleCard({ battle, hint }: { battle: BattleView; hint?: string }) {
  return <div className={`campaign-battle-card battle-${battle.state}`}>
    <div className="campaign-battle-stage"><PixelHero archetype={battle.archetype} small /><span>VS</span><i className={`campaign-enemy enemy-${battle.enemyType}`}>{battle.enemyType === "boss" ? "♛" : battle.enemyType === "elite" ? "✦" : "◆"}</i></div>
    <strong>{battle.enemyName}</strong><small>NÍVEL {battle.enemyLevel}</small>
    <div className="campaign-battle-lives" aria-label={`${battle.lives} vidas restantes`}>{[1, 2, 3].map((life) => <span className={life <= battle.lives ? "alive" : "lost"} key={life}>♥</span>)}</div>
    {hint ? <p>{hint}</p> : null}
  </div>;
}
