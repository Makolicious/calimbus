"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { HelpModal } from "./HelpModal";

export function Header() {
  const { data: session } = useSession();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
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
    <header className="header-gradient text-white px-4 py-3 shadow-lg transition-theme">
      <div className="flex items-center justify-between max-w-full">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <h1 className="text-xl font-bold tracking-tight">
              <span className="inline-block" style={{ transform: 'rotate(-20deg) translateX(-2px)' }}>C</span>alimbus
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Bug Report button */}
          <button
            onClick={() => setShowBugModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-red-500/80 hover:bg-red-500 rounded-md text-xs font-medium transition-colors"
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
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs font-medium transition-colors"
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

      {/* Bug Report Modal */}
      {showBugModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowBugModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
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
        </div>
      )}
    </header>
  );
}
