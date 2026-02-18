"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Column as ColumnType, BoardItem, Label } from "@/types";
import { Card } from "./Card";
import { useState, useEffect, useRef } from "react";

interface ColumnProps {
  column: ColumnType;
  items: BoardItem[];
  onEditColumn: (column: ColumnType) => void;
  onDeleteColumn: (columnId: string) => void;
  onItemClick: (item: BoardItem) => void;
  onQuickComplete?: (itemId: string) => void;
  onQuickTrash?: (itemId: string) => void;
  selectionMode?: boolean;
  selectedItems?: Set<string>;
  onToggleSelect?: (itemId: string) => void;
  onEnableSelect?: () => void;
  onSelectAll?: (items: BoardItem[]) => void;
  onCancelSelect?: () => void;
  onBulkTransfer?: () => void;
  getLabelsForItem?: (itemId: string) => Label[];
}

export function Column({
  column,
  items,
  onEditColumn,
  onDeleteColumn,
  onItemClick,
  onQuickComplete,
  onQuickTrash,
  selectionMode,
  selectedItems,
  onToggleSelect,
  onEnableSelect,
  onSelectAll,
  onCancelSelect,
  onBulkTransfer,
  getLabelsForItem,
}: ColumnProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      // Use setTimeout to avoid the menu closing immediately when opened
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== column.name) {
      onEditColumn({ ...column, name: editName.trim() });
    }
    setIsEditing(false);
  };

  return (
    <div className="glass-column rounded-2xl w-72 flex-shrink-0 flex flex-col shadow-lg transition-all hover:shadow-xl" style={{maxHeight: "calc(100vh - 140px)"}}>
      {/* Column Header */}
      <div
        className="p-3 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between rounded-t-2xl relative"
        style={{ borderTopColor: column.color, borderTopWidth: "8px" }}
      >
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit();
              if (e.key === "Escape") {
                setEditName(column.name);
                setIsEditing(false);
              }
            }}
            className="font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-2 py-1 text-sm w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all backdrop-blur-sm"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{column.name}</h3>
            <span className="bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full border border-transparent dark:border-white/10">
              {items.length}
            </span>
          </div>
        )}

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-1 z-10 min-w-40 animate-scaleIn border border-gray-200 dark:border-white/10">
              {!selectionMode ? (
                <>
                  <button
                    onClick={() => {
                      onEnableSelect?.();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Select
                  </button>
                  <button
                    onClick={() => {
                      onSelectAll?.(items);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Select All
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onCancelSelect?.();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel Select
                </button>
              )}
              <div className="border-t border-gray-200 dark:border-white/10 my-1" />
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  onDeleteColumn(column.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-all"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-2 min-h-32 rounded-b-xl transition-all duration-200 column-scroll ${
              snapshot.isDraggingOver
                ? "drop-target"
                : ""
            }`}
          >
            {items.length === 0 && !snapshot.isDraggingOver ? (
              // Empty state
              <div className="flex flex-col items-center justify-center py-10 mb-4 text-center empty-state-bg rounded-lg mx-1">
                <svg
                  className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Drop items here
                </p>
              </div>
            ) : (
              <>
                {(() => {
                  // Build grouped structure: unlabeled first, then by label
                  // We preserve original flat indices for DnD correctness,
                  // and insert non-draggable dividers between groups visually.
                  const unlabeled: { item: BoardItem; index: number }[] = [];
                  const labelGroups = new Map<string, { label: Label; items: { item: BoardItem; index: number }[] }>();

                  items.forEach((item, index) => {
                    const itemLabels = getLabelsForItem?.(item.id) ?? [];
                    if (itemLabels.length === 0) {
                      unlabeled.push({ item, index });
                    } else {
                      const firstLabel = itemLabels[0];
                      if (!labelGroups.has(firstLabel.id)) {
                        labelGroups.set(firstLabel.id, { label: firstLabel, items: [] });
                      }
                      labelGroups.get(firstLabel.id)!.items.push({ item, index });
                    }
                  });

                  // Reassign indices in grouped display order so DnD indices
                  // match the visual order (unlabeled first, then each label group).
                  let counter = 0;
                  const reindexed = {
                    unlabeled: unlabeled.map((entry) => ({ ...entry, index: counter++ })),
                    groups: Array.from(labelGroups.values()).map(({ label, items: groupItems }) => ({
                      label,
                      items: groupItems.map((entry) => ({ ...entry, index: counter++ })),
                    })),
                  };

                  return (
                    <>
                      {/* Unlabeled cards first */}
                      {reindexed.unlabeled.map(({ item, index }) => (
                        <Card
                          key={item.id}
                          item={item}
                          index={index}
                          onClick={onItemClick}
                          onQuickComplete={onQuickComplete}
                          onQuickTrash={onQuickTrash}
                          selectionMode={selectionMode}
                          isSelected={selectedItems?.has(item.id)}
                          onToggleSelect={onToggleSelect}
                          labels={getLabelsForItem?.(item.id)}
                        />
                      ))}

                      {/* Label groups */}
                      {reindexed.groups.map(({ label, items: groupItems }) => (
                        <div key={label.id} className="mt-2">
                          {/* Label divider — not a Draggable, purely visual */}
                          <div className="flex items-center gap-1.5 px-1 mb-1.5">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: label.color }}
                            />
                            <span
                              className="text-[10px] font-semibold uppercase tracking-wider truncate"
                              style={{ color: label.color }}
                            >
                              {label.name}
                            </span>
                            <div className="flex-1 h-px" style={{ backgroundColor: `${label.color}40` }} />
                            <span
                              className="text-[10px] font-medium"
                              style={{ color: `${label.color}99` }}
                            >
                              {groupItems.length}
                            </span>
                          </div>
                          {/* Cards in group */}
                          {groupItems.map(({ item, index }) => (
                            <Card
                              key={item.id}
                              item={item}
                              index={index}
                              onClick={onItemClick}
                              onQuickComplete={onQuickComplete}
                              onQuickTrash={onQuickTrash}
                              selectionMode={selectionMode}
                              isSelected={selectedItems?.has(item.id)}
                              onToggleSelect={onToggleSelect}
                              labels={getLabelsForItem?.(item.id)}
                            />
                          ))}
                        </div>
                      ))}
                    </>
                  );
                })()}
              </>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
