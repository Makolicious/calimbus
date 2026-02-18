"use client";

import { useState, useEffect } from "react";
import { Column } from "@/types";

interface ColumnOrderManagerProps {
  onOrderChange?: () => void;
}

export function ColumnOrderManager({ onOrderChange }: ColumnOrderManagerProps) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Fetch columns on mount
  useEffect(() => {
    fetchColumns();
  }, []);

  const fetchColumns = async () => {
    try {
      const res = await fetch("/api/columns");
      if (res.ok) {
        const data = await res.json();
        setColumns(data.sort((a: Column, b: Column) => a.position - b.position));
      }
    } catch (err) {
      console.error("Failed to fetch columns:", err);
    } finally {
      setLoading(false);
    }
  };

  const moveColumn = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, movedColumn);

    // Update positions
    const updatedColumns = newColumns.map((col, idx) => ({
      ...col,
      position: idx,
    }));

    setColumns(updatedColumns);
    setSaving(true);

    try {
      // Update all affected columns
      await Promise.all(
        updatedColumns.map((col) =>
          fetch("/api/columns", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: col.id,
              name: col.name,
              position: col.position,
              color: col.color,
            }),
          })
        )
      );
      onOrderChange?.();
    } catch (err) {
      console.error("Failed to update column order:", err);
      // Revert on error
      fetchColumns();
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveColumn(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {columns.map((column, index) => (
        <div
          key={column.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`flex items-center gap-3 px-3 py-2.5 bg-gray-100 dark:bg-[#1f1f35] rounded-lg border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing transition-all ${
            draggedIndex === index
              ? "opacity-50 scale-95"
              : "hover:bg-gray-200 dark:hover:bg-[#252545]"
          }`}
        >
          {/* Drag handle */}
          <div className="text-gray-400 dark:text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>

          {/* Color indicator */}
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: column.color || "#f97316" }}
          />

          {/* Column name */}
          <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">
            {column.name}
          </span>

          {/* Position badge */}
          <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
            {index + 1}
          </span>
        </div>
      ))}

      {saving && (
        <div className="flex items-center gap-2 text-sm text-orange-500 mt-2">
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Saving order...
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        Drag columns to reorder them. Changes are saved automatically.
      </p>
    </div>
  );
}
