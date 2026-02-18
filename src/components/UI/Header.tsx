"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { HelpModal } from "./HelpModal";
import { ColumnOrderManager } from "./ColumnOrderManager";

export function Header() {
  const { data: session } = useSession();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedSettingsTab, setSelectedSettingsTab] = useState<string>("appearance");
  const [bugMessage, setBugMessage] = useState("");
  const [bugImage, setBugImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBugImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit bug report
  const handleSubmitBug = async () => {
    if (!bugMessage.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: bugMessage,
          imageBase64: bugImage,
        }),
      });
      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setShowBugModal(false);
          setBugMessage("");
          setBugImage(null);
          setSubmitSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to submit:", err);
    } finally {
      setIsSubmitting(false);
    }
  };


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
    <header className="text-white px-4 py-3 shadow-lg transition-theme" style={{background: "linear-gradient(to right, #0c0c14 0%, #1a1a2e 50%, #0f0f1f 100%)"}}>
      <div className="flex items-center justify-between max-w-full">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 mt-[5px]">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {/* Calendar body */}
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
                {/* Top bar */}
                <line x1="3" y1="9" x2="21" y2="9" strokeWidth={2} />
                {/* Binding rings */}
                <line x1="8" y1="2" x2="8" y2="5" strokeWidth={2} strokeLinecap="round" />
                <line x1="16" y1="2" x2="16" y2="5" strokeWidth={2} strokeLinecap="round" />
                {/* Date grid dots */}
                <circle cx="8" cy="13" r="1" fill="currentColor" stroke="none" />
                <circle cx="12" cy="13" r="1" fill="currentColor" stroke="none" />
                <circle cx="16" cy="13" r="1" fill="currentColor" stroke="none" />
                <circle cx="8" cy="17" r="1" fill="currentColor" stroke="none" />
                <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
                <circle cx="16" cy="17" r="1" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="inline-block" style={{ transform: 'rotate(-20deg) translateX(-2px)' }}>C</span>alimbus
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Settings button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-all backdrop-blur-sm border border-white/10 hover:border-white/20 hover:shadow-lg"
            title="Settings"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>

          {/* Bug Report button */}
          <button
            onClick={() => setShowBugModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/70 hover:bg-red-500/90 rounded-lg text-xs font-medium transition-all backdrop-blur-sm border border-red-400/30 hover:border-red-400/50 hover:shadow-lg"
            title="Report a bug"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Bug</span>
          </button>

          {/* Help button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-all backdrop-blur-sm border border-white/10 hover:border-white/20 hover:shadow-lg"
            title="Help & Shortcuts (?)"
            data-tour="help"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Help</span>
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
                className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 backdrop-blur-md border border-white/20 hover:border-white/30 hover:shadow-lg"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      {/* Settings Modal - using Portal to render outside header stacking context */}
      {showSettingsModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl w-full max-w-4xl mx-4 h-[80vh] flex overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            {/* Left Sidebar Navigation */}
            <div className="w-64 bg-gray-50 dark:bg-[#151525] border-r border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </h3>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto p-2">
                <button
                  onClick={() => setSelectedSettingsTab("appearance")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                    selectedSettingsTab === "appearance"
                      ? "bg-orange-500 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Appearance
                </button>

                <button
                  onClick={() => setSelectedSettingsTab("board")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                    selectedSettingsTab === "board"
                      ? "bg-orange-500 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  Board
                </button>

                <button
                  onClick={() => setSelectedSettingsTab("notifications")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                    selectedSettingsTab === "notifications"
                      ? "bg-orange-500 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Notifications
                </button>

                <button
                  onClick={() => setSelectedSettingsTab("keyboard")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                    selectedSettingsTab === "keyboard"
                      ? "bg-orange-500 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Keyboard Shortcuts
                </button>

                <button
                  onClick={() => setSelectedSettingsTab("data")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                    selectedSettingsTab === "data"
                      ? "bg-orange-500 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Data & Privacy
                </button>

                <button
                  onClick={() => setSelectedSettingsTab("about")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                    selectedSettingsTab === "about"
                      ? "bg-orange-500 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About
                </button>
              </nav>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-[#1a1a2e]">
              {/* Content Header with Close Button */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-[#1a1a2e]">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedSettingsTab === "appearance" && "Appearance"}
                  {selectedSettingsTab === "board" && "Board Preferences"}
                  {selectedSettingsTab === "notifications" && "Notifications"}
                  {selectedSettingsTab === "keyboard" && "Keyboard Shortcuts"}
                  {selectedSettingsTab === "data" && "Data & Privacy"}
                  {selectedSettingsTab === "about" && "About Calimbus"}
                </h2>
                <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#1a1a2e]">
                {/* Appearance Settings */}
                {selectedSettingsTab === "appearance" && (
                  <div className="space-y-6 max-w-2xl">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Coming Soon</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                        Theme customization options including light/dark mode and accent colors will be available in a future update.
                      </p>
                    </div>
                  </div>
                )}

                {/* Board Settings */}
                {selectedSettingsTab === "board" && (
                  <div className="space-y-6 max-w-2xl">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Column Order</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Drag to reorder your columns. The board will update automatically.
                      </p>
                      <ColumnOrderManager />
                    </div>
                  </div>
                )}

                {/* Notifications Settings */}
                {selectedSettingsTab === "notifications" && (
                  <div className="space-y-6 max-w-2xl">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Coming Soon</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                        Desktop notifications for task reminders and calendar events will be available in a future update.
                      </p>
                    </div>
                  </div>
                )}

                {/* Keyboard Shortcuts Settings */}
                {selectedSettingsTab === "keyboard" && (
                  <div className="space-y-6 max-w-2xl">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Navigation</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Show Help Modal</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">?</kbd>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Navigate to Trash</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">T</kbd>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Previous Column</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">A</kbd>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Next Column</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">D</kbd>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Undo Last Action</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Ctrl+Z</kbd>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Refresh Board</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">R</kbd>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Keyboard shortcuts customization coming soon!
                      </p>
                    </div>
                  </div>
                )}

                {/* Data & Privacy Settings */}
                {selectedSettingsTab === "data" && (
                  <div className="space-y-6 max-w-2xl">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Your Data</h3>
                      <div className="bg-gray-100 dark:bg-[#1f1f35] rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Google Calendar & Tasks</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Accessed via Google APIs, never stored</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Notes, Columns & Labels</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Stored securely in Supabase</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Privacy Policy</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Calimbus only accesses your Google Calendar and Tasks data to display it on your board.
                        We never store, share, or sell your calendar data. Your notes and labels are stored securely
                        and only accessible by you.
                      </p>
                    </div>
                  </div>
                )}

                {/* About Settings */}
                {selectedSettingsTab === "about" && (
                  <div className="space-y-6 max-w-2xl">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Version</h3>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Calimbus v1.5.1</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        A Google Calendar + Kanban integration
                      </p>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">What's New</h3>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-2">
                          <span className="text-orange-500">•</span>
                          <span>Added Labels, Filters, and Undo functionality</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-500">•</span>
                          <span>Improved dark mode text visibility</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-500">•</span>
                          <span>Added comprehensive Settings menu</span>
                        </li>
                      </ul>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Resources</h3>
                      <div className="space-y-2">
                        <a href="#" className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 block">
                          View Documentation
                        </a>
                        <a href="#" className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 block">
                          Report an Issue
                        </a>
                        <a href="#" className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 block">
                          Request a Feature
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Bug Report Modal - using Portal to render outside header stacking context */}
      {showBugModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]" onClick={() => setShowBugModal(false)}>
          <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Thanks!</h3>
                <p className="text-gray-500 dark:text-gray-400">Your feedback has been submitted.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Report a Bug
                  </h3>
                  <button onClick={() => setShowBugModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <textarea
                  value={bugMessage}
                  onChange={(e) => setBugMessage(e.target.value)}
                  placeholder="Describe the bug or issue..."
                  className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  autoFocus
                />

                {/* Image upload */}
                <div className="mt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {bugImage ? (
                    <div className="relative">
                      <img src={bugImage} alt="Screenshot" className="w-full h-32 object-cover rounded-lg" />
                      <button
                        onClick={() => setBugImage(null)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-colors text-sm"
                    >
                      + Add screenshot (optional)
                    </button>
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowBugModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitBug}
                    disabled={!bugMessage.trim() || isSubmitting}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? "Sending..." : "Submit"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
