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
      document.addEventListener("mousedown", handleClickOutside);
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
    <div className="bg-gray-100 dark:bg-gray-800 rounded-xl w-72 flex-shrink-0 flex flex-col max-h-full shadow-sm transition-theme">
      {/* Column Header */}
      <div
        className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between rounded-t-xl"
        style={{ borderTopColor: column.color, borderTopWidth: "4px" }}
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
            className="font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-theme"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{column.name}</h3>
            <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
        )}

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
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
            <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-40 animate-scaleIn">
              {!selectionMode ? (
                <button
                  onClick={() => {
                    onEnableSelect?.();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Enable Select
                </button>
              ) : (
                <button
                  onClick={() => {
                    onCancelSelect?.();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel Select
                </button>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  onDeleteColumn(column.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Transfer Button - visible in selection mode when items are selected */}
      {selectionMode && selectedItems && selectedItems.size > 0 && (
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onBulkTransfer}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Bulk Transfer ({selectedItems.size})
          </button>
        </div>
      )}

      {/* Droppable Area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-2 min-h-32 rounded-b-xl transition-all duration-200 ${
              snapshot.isDraggingOver
                ? "drop-target"
                : ""
            }`}
          >
            {items.length === 0 && !snapshot.isDraggingOver ? (
              // Empty state
              <div className="flex flex-col items-center justify-center h-32 text-center empty-state-bg rounded-lg">
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
                {items.map((item, index) => (
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
              </>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
