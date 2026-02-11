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
    { key: "overdue", label: "Overdue", count: overdueCount, color: "red" },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Type Filters */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`
              px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5
              ${activeFilter === filter.key
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }
            `}
          >
            {filter.label}
            {filter.count !== undefined && filter.count > 0 && (
              <span
                className={`
                  text-[10px] px-1.5 py-0.5 rounded-full
                  ${filter.color === "green" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : ""}
                  ${filter.color === "blue" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : ""}
                  ${filter.color === "red" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : ""}
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
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-1.5 flex-wrap">
            {labels.map((label) => {
              const isSelected = selectedLabelIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  onClick={() => onLabelFilterChange(label.id)}
                  className={`
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all
                    ${isSelected
                      ? "ring-1 ring-offset-1 dark:ring-offset-gray-800"
                      : "opacity-50 hover:opacity-100"
                    }
                  `}
                  style={{
                    backgroundColor: `${label.color}20`,
                    color: label.color,
                    ...(isSelected && { ringColor: label.color }),
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
