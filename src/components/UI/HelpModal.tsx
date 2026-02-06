"use client";

import { useState } from "react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "learn" | "shortcuts" | "about";

const BUILD_INFO = {
  version: "1.4.3",
  lastUpdated: "February 6, 2025",
  updates: [
    {
      version: "1.4.3",
      date: "February 6, 2025",
      changes: [
        "🧹 Removed Export - Streamlined interface by removing backup feature",
      ],
    },
    {
      version: "1.4.2",
      date: "February 5, 2025",
      changes: [
        "🖱️ Improved Cursor - Grab cursor for drag, pointer for buttons",
        "📐 Bigger Cards - Larger padding and text for easier interaction",
        "🎯 Better Quick Actions - Larger buttons, easier to click",
      ],
    },
    {
      version: "1.4.1",
      date: "February 5, 2025",
      changes: [
        "🐛 Bug Report - Submit feedback with screenshots directly from the app",
        "🎨 Unified UI - Permanent dark theme for consistent Calimbus look",
      ],
    },
    {
      version: "1.4.0",
      date: "February 5, 2025",
      changes: [
        "📅 Week View - See 7 days at once with W key toggle",
        "🔀 Drag to Reschedule - Move items between days in week view",
        "🎨 Calendar Colors - Cards colored by Google Calendar color (11 colors!)",
        "📊 Stats Widget - Events, tasks completed, and progress bar",
        "🎓 Onboarding Tour - Welcome walkthrough for new users",
        "📱 PWA Support - Install as an app on your device",
      ],
    },
    {
      version: "1.3.0",
      date: "February 5, 2025",
      changes: [
        "❓ Help Center - Learn How, Shortcuts & About tabs",
        "📚 Learn How Guide - Step-by-step feature tutorials",
        "📋 Changelog - Track all latest updates in-app",
      ],
    },
    {
      version: "1.2.0",
      date: "February 5, 2025",
      changes: [
        "🌙 Dark Mode - Toggle between light and dark themes",
        "⌨️ Keyboard Shortcuts - Navigate faster with hotkeys",
        "⚡ Quick Actions - Complete/trash items on hover",
        "✨ Visual Refresh - Colored card borders and gradients",
        "🎬 Smooth Animations - Polished transitions throughout",
        "📱 Mobile Polish - Better responsive layouts",
      ],
    },
    {
      version: "1.1.0",
      date: "February 4, 2025",
      changes: [
        "🔄 Roll Over Feature - Move items to next day",
        "↩️ Undo Roll Over - Reverse rolled over items",
        "🗑️ Event Deletion - Events sync with Google Calendar",
        "♻️ Event Restoration - Recreate deleted events",
        "📝 Task Modal - Create tasks with notes and due dates",
      ],
    },
    {
      version: "1.0.0",
      date: "February 3, 2025",
      changes: [
        "🚀 Initial Release",
        "📅 Google Calendar Sync",
        "✅ Google Tasks Sync",
        "📊 Kanban Board Layout",
        "🏷️ Custom Columns",
        "📝 Notes & Checklists",
        "🗑️ Trash Column",
        "🔍 Search Functionality",
      ],
    },
  ],
  features: [
    "Bug Report",
    "Week View",
    "Drag to Reschedule",
    "Calendar Colors",
    "Stats Widget",
    "Onboarding Tour",
    "PWA Installable",
    "Help Center",
    "Keyboard Shortcuts",
    "Quick Actions",
    "Google Calendar Sync",
    "Google Tasks Sync",
    "Real-time Updates",
    "Drag & Drop Kanban",
    "Custom Columns",
    "Notes & Checklists",
    "Roll Over Tasks",
  ],
};

const KEYBOARD_SHORTCUTS = [
  { key: "N", description: "Create new task" },
  { key: "E", description: "Create new event" },
  { key: "T", description: "Jump to today" },
  { key: "W", description: "Toggle Day/Week view" },
  { key: "←", description: "Go to previous day" },
  { key: "→", description: "Go to next day" },
  { key: "/", description: "Focus search bar" },
  { key: "R", description: "Refresh board" },
  { key: "?", description: "Show shortcuts help" },
  { key: "Esc", description: "Close modal or sidebar" },
];

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[100] animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Calimbus Help</h2>
                <p className="text-sm text-white/80">Everything you need to know</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 bg-gray-50 dark:bg-gray-900">
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
            onClick={() => setActiveTab("shortcuts")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "shortcuts"
                ? "border-orange-500 text-orange-600 dark:text-orange-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            ⌨️ Shortcuts
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "about"
                ? "border-orange-500 text-orange-600 dark:text-orange-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            ℹ️ About
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Learn How Tab */}
          {activeTab === "learn" && (
            <div className="space-y-6">
              {LEARN_SECTIONS.map((section) => (
                <div key={section.title} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
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

          {/* Shortcuts Tab */}
          {activeTab === "shortcuts" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Use these keyboard shortcuts to navigate Calimbus faster. Shortcuts are disabled when typing in text fields.
              </p>
              <div className="grid gap-3">
                {KEYBOARD_SHORTCUTS.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-3"
                  >
                    <span className="text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                    <kbd className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 shadow-sm min-w-[40px] text-center">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  <strong>Pro tip:</strong> Press <kbd className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/50 rounded text-xs font-mono">?</kbd> anywhere to quickly view all shortcuts!
                </p>
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === "about" && (
            <div className="space-y-6">
              {/* App Info */}
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calimbus</h3>
                <p className="text-gray-500 dark:text-gray-400">Organize your day, your way</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full">
                    v{BUILD_INFO.version}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {BUILD_INFO.lastUpdated}
                  </span>
                </div>
              </div>

              {/* Latest Updates - Changelog Style */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Latest Updates
                </h4>
                {BUILD_INFO.updates.map((update, idx) => (
                  <div key={update.version} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        idx === 0
                          ? "bg-orange-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}>
                        v{update.version}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{update.date}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {update.changes.map((change, i) => (
                        <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Integrations */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Integrations</h4>
                <div className="flex items-center gap-4 justify-center">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google Calendar
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                    Google Tasks
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
                Made with ❤️ for productivity enthusiasts
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
