"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Column as ColumnType, BoardItem } from "@/types";
import { Card } from "./Card";
import { useState, useEffect, useRef } from "react";

interface ColumnProps {
  column: ColumnType;
  items: BoardItem[];
  onEditColumn: (column: ColumnType) => void;
  onDeleteColumn: (columnId: string) => void;
  onItemClick: (item: BoardItem) => void;
}

export function Column({
  column,
  items,
  onEditColumn,
  onDeleteColumn,
  onItemClick,
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
    <div className="bg-gray-100 rounded-lg w-72 flex-shrink-0 flex flex-col max-h-full">
      {/* Column Header */}
      <div
        className="p-3 border-b border-gray-200 flex items-center justify-between"
        style={{ borderTopColor: column.color, borderTopWidth: "3px" }}
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
            className="font-semibold text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 text-sm w-full"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800">{column.name}</h3>
            <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
        )}

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 p-1"
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
            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-32">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  onDeleteColumn(column.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
            className={`flex-1 overflow-y-auto p-2 min-h-32 ${
              snapshot.isDraggingOver ? "bg-orange-50" : ""
            }`}
          >
            {items.map((item, index) => (
              <Card key={item.id} item={item} index={index} onClick={onItemClick} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
