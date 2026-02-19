"use client";

import { useUndo } from "@/contexts/UndoContext";

export function UndoToast() {
  const { currentToast, performUndo, dismissToast } = useUndo();

  if (!currentToast) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] animate-slideUp">
      <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-2xl overflow-hidden min-w-[300px]">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium">{currentToast.description}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={performUndo}
              className="px-3 py-1.5 text-sm font-semibold text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-md transition-colors"
            >
              Undo
            </button>
            <button
              onClick={dismissToast}
              className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        {/* Progress bar — pure CSS animation, no JS interval */}
        <div className="h-1 bg-gray-700">
          <div
            key={currentToast.timestamp}
            className="h-full bg-orange-500 undo-progress-bar"
          />
        </div>
      </div>
    </div>
  );
}
