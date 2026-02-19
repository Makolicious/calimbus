"use client";

import { Label } from "@/types";

interface FilterBarProps {
  labels: Label[];
  selectedLabelIds: string[];
  onLabelFilterChange: (labelId: string) => void;
}

export function FilterBar({
  labels,
  selectedLabelIds,
  onLabelFilterChange,
}: FilterBarProps) {
  if (labels.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {labels.map((label) => {
        const isSelected = selectedLabelIds.includes(label.id);
        return (
          <button
            key={label.id}
            onClick={() => onLabelFilterChange(label.id)}
            className={`
              inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all backdrop-blur-sm border
              ${isSelected
                ? "ring-1 ring-offset-1 dark:ring-offset-transparent shadow-lg"
                : "opacity-60 hover:opacity-100"
              }
            `}
            style={{
              backgroundColor: `${label.color}15`,
              color: label.color,
              borderColor: `${label.color}30`,
              ...(isSelected && {
                boxShadow: `0 4px 14px ${label.color}30`
              }),
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: label.color }}
            />
            {label.name}
          </button>
        );
      })}
    </div>
  );
}
