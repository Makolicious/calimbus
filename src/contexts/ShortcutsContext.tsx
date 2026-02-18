"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

export interface ShortcutDef {
  id: string;
  description: string;
  defaultKey: string;
  key: string;
  category: "navigation" | "actions";
  fixed?: boolean; // non-editable (e.g. Esc)
}

const DEFAULT_SHORTCUTS: ShortcutDef[] = [
  { id: "newTask",      description: "Create new task",         defaultKey: "n", key: "n", category: "actions" },
  { id: "newEvent",     description: "Create new event",        defaultKey: "e", key: "e", category: "actions" },
  { id: "today",        description: "Jump to today",           defaultKey: "t", key: "t", category: "navigation" },
  { id: "toggleView",   description: "Toggle Day / Week view",  defaultKey: "w", key: "w", category: "navigation" },
  { id: "prevDay",      description: "Go to previous day",      defaultKey: "a", key: "a", category: "navigation" },
  { id: "nextDay",      description: "Go to next day",          defaultKey: "d", key: "d", category: "navigation" },
  { id: "search",       description: "Focus search bar",        defaultKey: "/", key: "/", category: "navigation" },
  { id: "refresh",      description: "Refresh board",           defaultKey: "r", key: "r", category: "actions" },
  { id: "help",         description: "Show shortcuts help",     defaultKey: "?", key: "?", category: "actions" },
  { id: "escape",       description: "Close modal or sidebar",  defaultKey: "Escape", key: "Escape", category: "navigation", fixed: true },
];

const STORAGE_KEY = "calimbus_shortcuts";

interface ShortcutsContextType {
  shortcuts: ShortcutDef[];
  updateShortcut: (id: string, newKey: string) => void;
  resetShortcuts: () => void;
  getKey: (id: string) => string;
}

const ShortcutsContext = createContext<ShortcutsContextType | null>(null);

export function ShortcutsProvider({ children }: { children: ReactNode }) {
  const [shortcuts, setShortcuts] = useState<ShortcutDef[]>(DEFAULT_SHORTCUTS);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const savedMap: Record<string, string> = JSON.parse(saved);
        setShortcuts(DEFAULT_SHORTCUTS.map(s => ({
          ...s,
          key: savedMap[s.id] ?? s.defaultKey,
        })));
      }
    } catch {
      // ignore
    }
  }, []);

  const updateShortcut = useCallback((id: string, newKey: string) => {
    setShortcuts(prev => {
      const next = prev.map(s => s.id === id ? { ...s, key: newKey } : s);
      // Persist
      const map: Record<string, string> = {};
      next.forEach(s => { map[s.id] = s.key; });
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const resetShortcuts = useCallback(() => {
    setShortcuts(DEFAULT_SHORTCUTS);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const getKey = useCallback((id: string) => {
    return shortcuts.find(s => s.id === id)?.key ?? "";
  }, [shortcuts]);

  return (
    <ShortcutsContext.Provider value={{ shortcuts, updateShortcut, resetShortcuts, getKey }}>
      {children}
    </ShortcutsContext.Provider>
  );
}

export function useShortcuts() {
  const ctx = useContext(ShortcutsContext);
  if (!ctx) throw new Error("useShortcuts must be used within ShortcutsProvider");
  return ctx;
}
