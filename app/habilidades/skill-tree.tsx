"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SkillTreeNode } from "@/db";

const LABELS = { knowledge: "Conhecimento", resilience: "Resiliência", strategy: "Estratégia" } as const;

export function SkillTree({ nodes, level, points }: { nodes: SkillTreeNode[]; level: number; points: number }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function acquire(id: string) {
    setLoading(id); setMessage(null);
    const response = await fetch(`/api/skills/${id}/purchase`, { method: "POST" });
    const result = await response.json() as { message: string };
    setMessage(result.message); setLoading(null);
    if (response.ok) router.refresh();
  }

  return <>{message ? <p className="skill-tree-message" role="status">{message}</p> : null}<div className="skill-forest">
    {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((category) => <section className={`skill-branch branch-${category}`} key={category}>
      <header><span>{category === "knowledge" ? "🧠" : category === "resilience" ? "❤️" : "💡"}</span><h2>{LABELS[category]}</h2></header>
      <div className="skill-constellation">{nodes.filter((node) => node.category === category).map((node, index) => {
        const prerequisitesMet = node.prerequisites.every((item) => item.currentRank >= item.minimumRank);
        const acquired = node.rank >= node.maxRanks;
        const available = prerequisitesMet && level >= node.minLevel && points >= node.cost && !acquired;
        const status = acquired ? "acquired" : available ? "available" : prerequisitesMet && level >= node.minLevel ? "insufficient" : "locked";
        return <div className={`skill-node state-${status}`} key={node.id}>{index ? <i className="skill-link" aria-hidden="true" /> : null}<button type="button" disabled={!available || loading !== null} onClick={() => acquire(node.id)} aria-label={`${node.name}: ${status}`}><b>{node.icon}</b></button><div><strong>{node.name}</strong><p>{node.description}</p><small>{acquired ? "ADQUIRIDA" : `◇ ${node.cost} · NÍVEL ${node.minLevel}`}</small>{!prerequisitesMet ? <em>Requer {node.prerequisites.map((item) => item.name).join(", ")}</em> : null}</div></div>;
      })}</div>
    </section>)}
  </div></>;
}
