"use client";

import { useEffect, useState } from "react";
import type { BattleAction } from "./battle-card";

export function useMissionDraft(slug: string, initialValue: string, legacyInitialValue?: string) {
  const key = `devdex:mission:${slug}:draft:v1`;
  const [value, setValue] = useState(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const saved = localStorage.getItem(key);
      setValue(saved === legacyInitialValue ? initialValue : saved ?? initialValue);
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [initialValue, key, legacyInitialValue]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => localStorage.setItem(key, value), 250);
    return () => window.clearTimeout(timer);
  }, [key, ready, value]);

  function reset() {
    localStorage.removeItem(key);
    setValue(initialValue);
  }

  return { value, setValue, reset };
}

export function useBattleShortcuts(onAction: (action: BattleAction) => void, disabled: boolean) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (disabled || !(event.ctrlKey || event.metaKey) || event.key !== "Enter") return;
      event.preventDefault();
      onAction(event.shiftKey ? "test" : "run");
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [disabled, onAction]);
}
