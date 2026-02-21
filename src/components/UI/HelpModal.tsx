"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "learn" | "security";

const SECURITY_AUDIT = {
  lastAudit: "February 6, 2025",
  status: "All Tests Passed",
  tests: [
    {
      name: "XSS Injection Protection",
      status: "passed",
      description: "Script tags in user inputs are properly escaped as text",
    },
    {
      name: "User ID Injection Defense",
      status: "passed",
      description: "API uses server-side session validation, ignoring client-provided user IDs",
    },
    {
      name: "API Authentication - Tasks",
      status: "passed",
      description: "/api/tasks returns 401 Unauthorized when not authenticated",
    },
    {
      name: "API Authentication - Calendar",
      status: "passed",
      description: "/api/calendar returns 401 Unauthorized when not authenticated",
    },
    {
      name: "API Authentication - Notes",
      status: "passed",
      description: "/api/notes returns 401 Unauthorized when not authenticated",
    },
    {
      name: "Dashboard Protection",
      status: "passed",
      description: "Unauthenticated users are redirected to login page",
    },
    {
      name: "X-Frame-Options Header",
      status: "passed",
      description: "Set to DENY - prevents clickjacking attacks",
    },
    {
      name: "X-Content-Type-Options Header",
      status: "passed",
      description: "Set to nosniff - prevents MIME type sniffing",
    },
    {
      name: "Referrer-Policy Header",
      status: "passed",
      description: "Set to origin-when-cross-origin for privacy protection",
    },
  ],
  practices: [
    "OAuth 2.0 with Google for secure authentication",
    "Server-side session management with NextAuth.js",
    "Parameterized queries prevent SQL injection",
    "React's built-in XSS protection via JSX escaping",
    "Environment variables for all sensitive credentials",
    "HTTPS enforced on all connections",
  ],
};

const LEARN_SECTIONS = [
  {
    title: "Getting Started",
    icon: "🚀",
    items: [
      "Sign in with your Google account to sync your Calendar and Tasks",
      "Your events and tasks for the selected day appear on the board",
      "Use the date picker or arrows to navigate between days",
    ],
  },
  {
    title: "Labels & Filtering",
    icon: "🏷️",
    items: [
      "Click any card to open its sidebar, then use 'New Label' to create labels",
      "Labels are color-coded (9 colors) and can be assigned to any task or event",
      "Use the filter bar in the toolbar to show only Tasks, Events, or Overdue items",
      "Filter by labels to focus on specific categories of work",
      "Undo accidental moves or trashes with the 10-second undo toast",
    ],
  },
  {
    title: "Week View",
    icon: "📅",
    items: [
      "Press W or click Week in the toolbar to see 7 days at once",
      "Drag items between days to reschedule them instantly",
      "Today is highlighted with an orange header",
      "Each day shows an item count for quick overview",
    ],
  },
  {
    title: "Managing Items",
    icon: "📋",
    items: [
      "Drag cards between columns to organize your workflow",
      "Click any card to open its details sidebar",
      "Add notes and checklists to any task or event",
      "Hover over cards to see quick action buttons (complete/trash)",
    ],
  },
  {
    title: "Creating Tasks & Events",
    icon: "➕",
    items: [
      "Click 'Add Task' or press N to create a new task",
      "Click 'Add Event' or press E to create a new event",
      "Tasks sync with Google Tasks, events sync with Google Calendar",
      "Set due dates, times, locations, and descriptions",
    ],
  },
  {
    title: "Columns & Organization",
    icon: "📊",
    items: [
      "Create custom columns with the '+ Add Column' button",
      "Click the ⋮ menu on any column to edit or delete it",
      "The 'Roll Over' column automatically moves items to the next day",
      "The 'Trash' column holds items before permanent deletion",
    ],
  },
  {
    title: "Roll Over Feature",
    icon: "🔄",
    items: [
      "Drag items to the 'Roll Over' column to move them to tomorrow",
      "Rolled over items will appear on the next day's board",
      "Use 'Undo Roll Over' in the sidebar to reverse this action",
    ],
  },
  {
    title: "Real-time Sync",
    icon: "⚡",
    items: [
      "Changes sync automatically with Google every 10 seconds",
      "The 'Live' indicator shows your sync status",
      "Press R or click the refresh button to manually sync",
    ],
  },
  {
    title: "Install as App",
    icon: "📱",
    items: [
      "Calimbus works as a Progressive Web App (PWA)",
      "On desktop: Look for the install icon in your browser's address bar",
      "On mobile: Use 'Add to Home Screen' in your browser menu",
      "The app works even with spotty internet connection",
    ],
  },
];

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("learn");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col animate-slideUp overflow-hidden border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-orange-500/95 to-orange-600/95 text-white rounded-t-2xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold"><span className="inline-block" style={{ transform: 'rotate(-20deg) translateX(-2px)' }}>C</span>alimbus Help</h2>
                <p className="text-sm text-white/80">Everything you need to know</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 bg-gray-50 dark:bg-[#151525]">
          <button
            onClick={() => setActiveTab("learn")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "learn"
                ? "border-orange-500 text-orange-600 dark:text-orange-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            📚 Learn How
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "security"
                ? "border-orange-500 text-orange-600 dark:text-orange-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            🔒 Security
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Learn How Tab */}
          {activeTab === "learn" && (
            <div className="space-y-6">
              {LEARN_SECTIONS.map((section) => (
                <div key={section.title} className="bg-gray-100 dark:bg-[#1f1f35] rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
                    <span>{section.icon}</span>
                    {section.title}
                  </h3>
                  <ul className="space-y-2">
                    {section.items.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Security Status */}
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Security Audit</h3>
                <p className="text-gray-500 dark:text-gray-400">Your data is protected</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                    {SECURITY_AUDIT.status}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {SECURITY_AUDIT.lastAudit}
                  </span>
                </div>
              </div>

              {/* Security Tests */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Penetration Test Results
                </h4>
                <div className="space-y-2">
                  {SECURITY_AUDIT.tests.map((test) => (
                    <div
                      key={test.name}
                      className="bg-gray-100 dark:bg-[#1f1f35] rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{test.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">{test.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Practices */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Security Practices
                </h4>
                <ul className="space-y-2">
                  {SECURITY_AUDIT.practices.map((practice, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {practice}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
                Security audited with ❤️ by Claude AI
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-orange-500/90 rounded-xl hover:bg-orange-500 transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
