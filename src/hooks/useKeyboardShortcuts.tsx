"use client";

import { useEffect, useCallback, useState } from "react";

interface KeyboardShortcutsOptions {
  onNewTask?: () => void;
  onNewEvent?: () => void;
  onToday?: () => void;
  onPreviousDay?: () => void;
  onNextDay?: () => void;
  onToggleTheme?: () => void;
  onFocusSearch?: () => void;
  onRefresh?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onNewTask,
  onNewEvent,
  onToday,
  onPreviousDay,
  onNextDay,
  onToggleTheme,
  onFocusSearch,
  onRefresh,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Only allow Escape to work in inputs
        if (event.key === "Escape") {
          (target as HTMLInputElement).blur();
        }
        return;
      }

      // Handle shortcuts
      switch (event.key.toLowerCase()) {
        case "n":
          event.preventDefault();
          onNewTask?.();
          break;
        case "e":
          event.preventDefault();
          onNewEvent?.();
          break;
        case "t":
          event.preventDefault();
          onToday?.();
          break;
        case "arrowleft":
          event.preventDefault();
          onPreviousDay?.();
          break;
        case "arrowright":
          event.preventDefault();
          onNextDay?.();
          break;
        case "d":
          event.preventDefault();
          onToggleTheme?.();
          break;
        case "/":
          event.preventDefault();
          onFocusSearch?.();
          break;
        case "r":
          if (!event.metaKey && !event.ctrlKey) {
            event.preventDefault();
            onRefresh?.();
          }
          break;
        // ? is handled by Header.tsx for the full HelpModal
        // case "?":
        //   event.preventDefault();
        //   setShowHelp((prev) => !prev);
        //   break;
        case "escape":
          setShowHelp(false);
          break;
      }
    },
    [onNewTask, onNewEvent, onToday, onPreviousDay, onNextDay, onToggleTheme, onFocusSearch, onRefresh]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);

  return { showHelp, setShowHelp };
}

// Keyboard shortcuts help modal component
export function KeyboardShortcutsHelp({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "N", description: "New Task" },
    { key: "E", description: "New Event" },
    { key: "T", description: "Jump to Today" },
    { key: "←", description: "Previous Day" },
    { key: "→", description: "Next Day" },
    { key: "D", description: "Toggle Dark Mode" },
    { key: "/", description: "Focus Search" },
    { key: "R", description: "Refresh Board" },
    { key: "?", description: "Show/Hide This Help" },
    { key: "Esc", description: "Close Modal/Sidebar" },
  ];

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
              <div key={shortcut.key} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">{shortcut.description}</span>
                <kbd className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 shadow-sm">
                  {shortcut.key}
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
