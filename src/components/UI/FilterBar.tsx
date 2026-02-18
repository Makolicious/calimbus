"use client";

import { FilterType, Label } from "@/types";

interface FilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  labels: Label[];
  selectedLabelIds: string[];
  onLabelFilterChange: (labelId: string) => void;
  taskCount: number;
  eventCount: number;
  overdueCount: number;
}

export function FilterBar({
  activeFilter,
  onFilterChange,
  labels,
  selectedLabelIds,
  onLabelFilterChange,
  taskCount,
  eventCount,
  overdueCount,
}: FilterBarProps) {
  const filters: { key: FilterType; label: string; count?: number; color?: string }[] = [
    { key: "all", label: "All" },
    { key: "tasks", label: "Tasks", count: taskCount, color: "green" },
    { key: "events", label: "Events", count: eventCount, color: "blue" },
    { key: "overdue", label: "Pending", count: overdueCount, color: "red" },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Type Filters */}
      <div className="flex items-center bg-gray-100/80 dark:bg-white/5 backdrop-blur-sm rounded-xl p-0.5 border border-gray-200/50 dark:border-white/10">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5
              ${activeFilter === filter.key
                ? "bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm backdrop-blur-sm border border-white/50 dark:border-white/10"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/5"
              }
            `}
          >
            {filter.label}
            {filter.count !== undefined && filter.count > 0 && (
              <span
                className={`
                  text-[10px] px-1.5 py-0.5 rounded-full border backdrop-blur-sm
                  ${filter.color === "green" ? "bg-green-100/80 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-500/30" : ""}
                  ${filter.color === "blue" ? "bg-blue-100/80 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30" : ""}
                  ${filter.color === "red" ? "bg-red-100/80 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30" : ""}
                `}
              >
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Label Filters */}
      {labels.length > 0 && (
        <>
          <div className="h-4 w-px bg-gray-300/50 dark:bg-white/10" />
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
                      ringColor: label.color,
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
        </>
      )}
    </div>
  );
}
