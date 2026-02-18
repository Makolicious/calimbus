"use client";

import { useEffect, useCallback, useState } from "react";
import { useShortcuts } from "@/contexts/ShortcutsContext";

interface KeyboardShortcutsOptions {
  onNewTask?: () => void;
  onNewEvent?: () => void;
  onToday?: () => void;
  onPreviousDay?: () => void;
  onNextDay?: () => void;
  onFocusSearch?: () => void;
  onRefresh?: () => void;
  onToggleView?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onNewTask,
  onNewEvent,
  onToday,
  onPreviousDay,
  onNextDay,
  onFocusSearch,
  onRefresh,
  onToggleView,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const [showHelp, setShowHelp] = useState(false);
  const { getKey } = useShortcuts();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        if (event.key === "Escape") {
          (target as HTMLInputElement).blur();
        }
        return;
      }

      const key = event.key.toLowerCase();

      if (event.key === "Escape") {
        setShowHelp(false);
        return;
      }

      // Help is handled exclusively by the Header via capture listener — skip here

      if (key === getKey("newTask").toLowerCase()) { event.preventDefault(); onNewTask?.(); return; }
      if (key === getKey("newEvent").toLowerCase()) { event.preventDefault(); onNewEvent?.(); return; }
      if (key === getKey("today").toLowerCase()) { event.preventDefault(); onToday?.(); return; }
      if (key === getKey("toggleView").toLowerCase()) { event.preventDefault(); onToggleView?.(); return; }
      if (key === getKey("prevDay").toLowerCase() || event.key === "ArrowLeft") { event.preventDefault(); onPreviousDay?.(); return; }
      if (key === getKey("nextDay").toLowerCase() || event.key === "ArrowRight") { event.preventDefault(); onNextDay?.(); return; }
      if (event.key === getKey("search")) { event.preventDefault(); onFocusSearch?.(); return; }
      if (key === getKey("refresh").toLowerCase()) {
        if (!event.metaKey && !event.ctrlKey) { event.preventDefault(); onRefresh?.(); }
        return;
      }
    },
    [onNewTask, onNewEvent, onToday, onPreviousDay, onNextDay, onFocusSearch, onRefresh, onToggleView, getKey]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);

  return { showHelp, setShowHelp };
}

// Keyboard shortcuts help modal component (lightweight, used in KanbanBoard)
export function KeyboardShortcutsHelp({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { shortcuts } = useShortcuts();
  if (!isOpen) return null;

  const displayKey = (id: string) => {
    const s = shortcuts.find(sh => sh.id === id);
    if (!s) return "";
    if (id === "prevDay") return `${s.key.toUpperCase()} or ←`;
    if (id === "nextDay") return `${s.key.toUpperCase()} or →`;
    return s.key === " " ? "Space" : s.key.length === 1 ? s.key.toUpperCase() : s.key;
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[100] animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-500 to-orange-600">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Keyboard Shortcuts
          </h2>
        </div>

        <div className="p-6">
          <div className="grid gap-3">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.id} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">{shortcut.description}</span>
                <kbd className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 shadow-sm">
                  {displayKey(shortcut.id)}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
