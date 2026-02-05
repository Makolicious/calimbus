"use client";

import { useState, useEffect, useCallback } from "react";
import { Column, BoardItem, CardCategory } from "@/types";

export function useBoard() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [cardCategories, setCardCategories] = useState<Map<string, string>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch columns, events, tasks, and card categories in parallel
        const [columnsRes, eventsRes, tasksRes, categoriesRes] =
          await Promise.all([
            fetch("/api/columns"),
            fetch("/api/calendar"),
            fetch("/api/tasks"),
            fetch("/api/card-categories"),
          ]);

        if (!columnsRes.ok) throw new Error("Failed to fetch columns");
        if (!eventsRes.ok) throw new Error("Failed to fetch calendar events");
        if (!tasksRes.ok) throw new Error("Failed to fetch tasks");
        if (!categoriesRes.ok)
          throw new Error("Failed to fetch card categories");

        const [columnsData, eventsData, tasksData, categoriesData] =
          await Promise.all([
            columnsRes.json(),
            eventsRes.json(),
            tasksRes.json(),
            categoriesRes.json(),
          ]);

        setColumns(columnsData);
        setItems([...eventsData, ...tasksData]);

        // Build card categories map
        const categoryMap = new Map<string, string>();
        categoriesData.forEach((cat: CardCategory) => {
          categoryMap.set(cat.item_id, cat.column_id);
        });
        setCardCategories(categoryMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Get items for a specific column
  const getItemsForColumn = useCallback(
    (columnId: string) => {
      // Find the first column (inbox) to use as default
      const firstColumn = columns[0];

      return items.filter((item) => {
        const assignedColumn = cardCategories.get(item.id);
        if (assignedColumn) {
          return assignedColumn === columnId;
        }
        // If no category assigned, put in first column (inbox)
        return firstColumn && columnId === firstColumn.id;
      });
    },
    [items, cardCategories, columns]
  );

  // Move item to a different column
  const moveItem = useCallback(
    async (itemId: string, newColumnId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      // Optimistic update
      setCardCategories((prev) => {
        const newMap = new Map(prev);
        newMap.set(itemId, newColumnId);
        return newMap;
      });

      // Persist to server
      try {
        const response = await fetch("/api/card-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_id: itemId,
            item_type: item.type,
            column_id: newColumnId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update card category");
        }
      } catch (err) {
        // Revert on error
        setCardCategories((prev) => {
          const newMap = new Map(prev);
          newMap.delete(itemId);
          return newMap;
        });
        console.error("Failed to move item:", err);
      }
    },
    [items]
  );

  // Add a new column
  const addColumn = useCallback(async (name: string, color: string) => {
    try {
      const position =
        columns.length > 0
          ? Math.max(...columns.map((c) => c.position)) + 1
          : 0;

      const response = await fetch("/api/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, position, color }),
      });

      if (!response.ok) throw new Error("Failed to create column");

      const newColumn = await response.json();
      setColumns((prev) => [...prev, newColumn]);
    } catch (err) {
      console.error("Failed to add column:", err);
    }
  }, [columns]);

  // Update a column
  const updateColumn = useCallback(async (column: Column) => {
    try {
      const response = await fetch("/api/columns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(column),
      });

      if (!response.ok) throw new Error("Failed to update column");

      const updatedColumn = await response.json();
      setColumns((prev) =>
        prev.map((c) => (c.id === updatedColumn.id ? updatedColumn : c))
      );
    } catch (err) {
      console.error("Failed to update column:", err);
    }
  }, []);

  // Delete a column
  const deleteColumn = useCallback(async (columnId: string) => {
    try {
      const response = await fetch(`/api/columns?id=${columnId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete column");

      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      // Remove card categories for deleted column
      setCardCategories((prev) => {
        const newMap = new Map(prev);
        for (const [itemId, colId] of newMap.entries()) {
          if (colId === columnId) {
            newMap.delete(itemId);
          }
        }
        return newMap;
      });
    } catch (err) {
      console.error("Failed to delete column:", err);
    }
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, tasksRes] = await Promise.all([
        fetch("/api/calendar"),
        fetch("/api/tasks"),
      ]);

      if (eventsRes.ok && tasksRes.ok) {
        const [eventsData, tasksData] = await Promise.all([
          eventsRes.json(),
          tasksRes.json(),
        ]);
        setItems([...eventsData, ...tasksData]);
      }
    } catch (err) {
      console.error("Failed to refresh:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    columns,
    items,
    loading,
    error,
    getItemsForColumn,
    moveItem,
    addColumn,
    updateColumn,
    deleteColumn,
    refresh,
  };
}
