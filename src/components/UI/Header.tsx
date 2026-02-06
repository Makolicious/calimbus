"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";
import { HelpModal } from "./HelpModal";

export function Header() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Export board data as JSON
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const [columnsRes, eventsRes, tasksRes, categoriesRes] = await Promise.all([
        fetch("/api/columns"),
        fetch("/api/calendar"),
        fetch("/api/tasks"),
        fetch("/api/card-categories"),
      ]);

      const data = {
        exportDate: new Date().toISOString(),
        version: "1.4.0",
        columns: await columnsRes.json(),
        events: await eventsRes.json(),
        tasks: await tasksRes.json(),
        cardCategories: await categoriesRes.json(),
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `calimbus-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  // Listen for ? key to open help modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        setShowHelpModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="header-gradient text-white px-4 py-3 shadow-lg transition-theme">
      <div className="flex items-center justify-between max-w-full">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Calimbus</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
            title="Export backup"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{isExporting ? "..." : "Export"}</span>
          </button>

          {/* Help button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs font-medium transition-colors"
            title="Help & Shortcuts (?)"
            data-tour="help"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Help</span>
            <kbd className="text-[10px] opacity-75">?</kbd>
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {session?.user && (
            <>
              <div className="flex items-center gap-2">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-white/30"
                  />
                )}
                <span className="text-sm font-medium hidden sm:block opacity-90">
                  {session.user.name}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </header>
  );
}
