import { useCallback, useEffect, useState } from 'react';

export type StatLevel = 'Good' | 'Chopped';

type Presets<T, L extends string> = Record<L, T[]>;

/**
 * Keeps the stat sets (Good / Chopped, plus any extra levels) in localStorage so whatever is set up on
 * the page survives a reload (and a redeploy) instead of living only in React
 * state. `defaults` seed the presets the first time the page is opened.
 */
export function useStatPresets<T, L extends string = StatLevel>(storageKey: string, defaults: Presets<T, L>) {
  const levels = Object.keys(defaults) as L[];
  const [level, setLevel] = useState<L>(levels[0]);
  const [presets, setPresets] = useState<Presets<T, L>>(defaults);
  const [items, setItems] = useState<T[]>(defaults[levels[0]]);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Restore saved presets once, on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const stored = JSON.parse(raw) as Partial<Presets<T, L>>;
      const merged = { ...defaults };
      levels.forEach(l => { merged[l] = stored[l] ?? defaults[l]; });
      setPresets(merged);
      setItems(merged[levels[0]]);
    } catch {
      // Corrupt or unavailable storage: fall back to the built-in defaults.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const selectLevel = useCallback((next: L) => {
    setLevel(next);
    setItems(presets[next]);
  }, [presets]);

  /** Store what is currently on the page as the active level's preset. */
  const saveCurrent = useCallback(() => {
    const next = { ...presets, [level]: items };
    setPresets(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setSavedAt(Date.now());
    } catch {
      // Storage can be unavailable (private window); the in-memory preset still updates.
    }
  }, [presets, level, items, storageKey]);

  /** Drop the saved presets and go back to the built-in ones. */
  const resetPresets = useCallback(() => {
    setPresets(defaults);
    setItems(defaults[level]);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Nothing to clear.
    }
    setSavedAt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaults, level, storageKey]);

  return { level, selectLevel, items, setItems, saveCurrent, resetPresets, savedAt };
}
