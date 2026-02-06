"use client";

import { useState } from "react";

interface AddColumnButtonProps {
  onAddColumn: (name: string, color: string) => void;
}

const COLORS = [
  "#6b7280", // gray
  "#f97316", // orange
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#22c55e", // green
  "#ef4444", // red
  "#f59e0b", // amber
  "#06b6d4", // cyan
];

export function AddColumnButton({ onAddColumn }: AddColumnButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const handleSubmit = () => {
    if (name.trim()) {
      onAddColumn(name.trim(), color);
      setName("");
      setColor(COLORS[0]);
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl w-72 flex-shrink-0 h-32 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-all hover:shadow-md border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500"
      >
        <svg
          className="w-6 h-6 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Add Column
      </button>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-xl w-72 flex-shrink-0 p-3 animate-scaleIn shadow-sm">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Column name"
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm mb-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-theme"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") setIsAdding(false);
        }}
      />

      <div className="flex gap-2 mb-3">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
              color === c ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 dark:ring-offset-gray-800 scale-110" : ""
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          className="flex-1 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors btn-hover"
        >
          Add
        </button>
        <button
          onClick={() => setIsAdding(false)}
          className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
