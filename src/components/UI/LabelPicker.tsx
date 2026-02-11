"use client";

import { useState } from "react";
import { Label } from "@/types";

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#6b7280", // gray
];

interface LabelPickerProps {
  labels: Label[];
  selectedLabelIds: string[];
  onToggleLabel: (labelId: string) => void;
  onCreateLabel: (name: string, color: string) => Promise<Label | void>;
  onDeleteLabel?: (labelId: string) => Promise<void>;
  compact?: boolean;
}

export function LabelPicker({
  labels,
  selectedLabelIds,
  onToggleLabel,
  onCreateLabel,
  onDeleteLabel,
  compact = false,
}: LabelPickerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newLabelName.trim()) return;
    setIsCreating(true);
    try {
      await onCreateLabel(newLabelName.trim(), newLabelColor);
      setNewLabelName("");
      setShowCreate(false);
    } catch (error) {
      console.error("Failed to create label:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={`${compact ? "space-y-2" : "space-y-3"}`}>
      {/* Existing Labels */}
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => {
          const isSelected = selectedLabelIds.includes(label.id);
          return (
            <button
              key={label.id}
              onClick={() => onToggleLabel(label.id)}
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                ${isSelected
                  ? "ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500"
                  : "opacity-60 hover:opacity-100"
                }
              `}
              style={{
                backgroundColor: `${label.color}20`,
                color: label.color,
                borderColor: label.color,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              {label.name}
              {isSelected && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
        {labels.length === 0 && !showCreate && (
          <span className="text-xs text-gray-400 dark:text-gray-500">No labels yet</span>
        )}
      </div>

      {/* Create New Label */}
      {showCreate ? (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-3">
          <input
            type="text"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            placeholder="Label name..."
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setShowCreate(false);
            }}
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setNewLabelColor(color)}
                className={`w-6 h-6 rounded-full transition-all ${
                  newLabelColor === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newLabelName.trim() || isCreating}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              {isCreating ? "..." : "Create"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Label
        </button>
      )}
    </div>
  );
}

// Display labels on a card (compact version)
export function LabelBadges({ labels, maxDisplay = 3 }: { labels: Label[]; maxDisplay?: number }) {
  if (labels.length === 0) return null;

  const displayLabels = labels.slice(0, maxDisplay);
  const remaining = labels.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {displayLabels.map((label) => (
        <span
          key={label.id}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{
            backgroundColor: `${label.color}20`,
            color: label.color,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: label.color }}
          />
          {label.name}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          +{remaining}
        </span>
      )}
    </div>
  );
}
