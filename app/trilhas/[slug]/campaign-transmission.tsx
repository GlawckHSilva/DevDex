"use client";

import { useEffect, useState } from "react";
import type { CampaignLore } from "@/db";

export function CampaignTransmission({ open, lore, firstView, onClose }: { open: boolean; lore: CampaignLore; firstView: boolean; onClose: () => void }) {
  const [visible, setVisible] = useState(firstView ? 0 : lore.introText.length);
  const typing = open && visible < lore.introText.length;

  useEffect(() => {
    if (!open) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!firstView || reduced) {
      const frame = window.requestAnimationFrame(() => setVisible(lore.introText.length));
      return () => window.cancelAnimationFrame(frame);
    }
    const step = Math.max(2, Math.ceil(lore.introText.length / 120));
    const timer = window.setInterval(() => setVisible((current) => {
      if (current + step >= lore.introText.length) { window.clearInterval(timer); return lore.introText.length; }
      return current + step;
    }), 22);
    return () => window.clearInterval(timer);
  }, [firstView, lore.introText, open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (visible < lore.introText.length) setVisible(lore.introText.length);
      else onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); };
  }, [lore.introText.length, onClose, open, visible]);

  if (!open) return null;
  return <div className="transmission-overlay" data-testid="campaign-transmission">
    <section aria-labelledby="transmission-title" aria-modal="true" className="campaign-transmission" role="dialog">
      <header><span><i /> TRANSMISSÃO RECEBIDA</span><code>{lore.transmissionId}</code></header>
      <div className="transmission-content">
        <small>REMETENTE · {lore.sender}</small>
        <h2 id="transmission-title">{lore.loreTitle}</h2>
        <strong>{lore.loreSubtitle}</strong>
        <p data-testid="transmission-text">{lore.introText.slice(0, visible)}{typing ? <i className="transmission-cursor" aria-hidden="true" /> : null}</p>
        <footer><span>{lore.signature}</span>{typing ? <button className="transmission-skip" onClick={() => setVisible(lore.introText.length)} type="button">MOSTRAR TUDO</button> : <button className="button" data-testid="transmission-close" onClick={onClose} type="button">{firstView ? "INICIAR JORNADA" : "VOLTAR AO MAPA"} →</button>}</footer>
      </div>
    </section>
  </div>;
}
