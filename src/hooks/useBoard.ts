"use client";

import { useState, useEffect, useCallback } from "react";
import { Column, BoardItem, CardCategory, Task } from "@/types";

export function useBoard() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [cardCategories, setCardCategories] = useState<Map<string, string>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to sync completed tasks to Done column and mark checklist items
  const syncCompletedTasksToDone = useCallback(async (
    tasksData: Task[],
    columnsData: Column[],
    existingCategories: Map<string, string>
  ) => {
    const doneColumn = columnsData.find(c => c.name.toLowerCase() === "done");
    if (!doneColumn) return;

    // Find completed tasks that are NOT already in the Done column
    const completedTasksToMove = tasksData.filter(task => {
      if (task.status !== "completed") return false;
      const currentColumnId = existingCategories.get(task.id);
      // If already in Done column, skip
      if (currentColumnId === doneColumn.id) return false;
      return true;
    });

    console.log("Syncing completed tasks to Done column:", completedTasksToMove.length);

    // Move each completed task to Done column and mark checklist items
    for (const task of completedTasksToMove) {
      try {
        // Update card category to Done column
        await fetch("/api/card-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_id: task.id,
            item_type: "task",
            column_id: doneColumn.id,
          }),
        });

        // Mark all checklist items for this task as completed
        await fetch("/api/checklist/complete-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_id: task.id,
          }),
        });

        // Update local state
        existingCategories.set(task.id, doneColumn.id);
      } catch (err) {
        console.error("Failed to sync completed task:", task.id, err);
      }
    }

    return existingCategories;
  }, []);

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

        // Auto-sync completed tasks from Google to Done column
        await syncCompletedTasksToDone(tasksData, columnsData, categoryMap);

        setCardCategories(categoryMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [syncCompletedTasksToDone]);

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

      // Find target column to check if it's "Done"
      const targetColumn = columns.find((c) => c.id === newColumnId);
      const isDoneColumn = targetColumn?.name.toLowerCase() === "done";

      // Get the previous column to check if moving FROM done
      const previousColumnId = cardCategories.get(itemId);
      const previousColumn = previousColumnId
        ? columns.find((c) => c.id === previousColumnId)
        : columns[0]; // Default to first column if not assigned
      const wasInDone = previousColumn?.name.toLowerCase() === "done";

      console.log("Move item:", {
        itemId,
        itemType: item.type,
        targetColumn: targetColumn?.name,
        isDoneColumn,
        previousColumn: previousColumn?.name,
        wasInDone,
      });

      // Optimistic update for card categories
      setCardCategories((prev) => {
        const newMap = new Map(prev);
        newMap.set(itemId, newColumnId);
        return newMap;
      });

      // If it's a task and moving to/from Done, update task status optimistically
      if (item.type === "task" && (isDoneColumn || wasInDone)) {
        const task = item as Task;
        const newStatus = isDoneColumn ? "completed" : "needsAction";

        // Optimistic update for task status
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId && i.type === "task"
              ? { ...i, status: newStatus } as Task
              : i
          )
        );

        // Sync with Google Tasks
        console.log("Syncing task status to Google:", {
          taskId: task.id,
          taskListId: task.taskListId,
          completed: isDoneColumn,
        });
        try {
          const statusResponse = await fetch("/api/tasks/status", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskId: task.id,
              taskListId: task.taskListId,
              completed: isDoneColumn,
            }),
          });

          const responseData = await statusResponse.json();
          console.log("Task status sync response:", responseData);

          if (!statusResponse.ok) {
            console.error("Failed to sync task status with Google:", responseData);
            // Revert task status on error
            setItems((prev) =>
              prev.map((i) =>
                i.id === itemId && i.type === "task"
                  ? { ...i, status: wasInDone ? "completed" : "needsAction" } as Task
                  : i
              )
            );
          } else {
            // Sync checklist items - mark all as completed or uncompleted
            try {
              if (isDoneColumn) {
                // Moving to Done - mark all checklist items as completed
                await fetch("/api/checklist/complete-all", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ item_id: itemId }),
                });
              } else {
                // Moving out of Done - uncheck all checklist items
                await fetch("/api/checklist/uncomplete-all", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ item_id: itemId }),
                });
              }
            } catch (checklistErr) {
              console.error("Failed to sync checklist items:", checklistErr);
            }
          }
        } catch (err) {
          console.error("Failed to sync task status:", err);
          // Revert task status on error
          setItems((prev) =>
            prev.map((i) =>
              i.id === itemId && i.type === "task"
                ? { ...i, status: wasInDone ? "completed" : "needsAction" } as Task
                : i
            )
          );
        }
      }

      // Persist card category to server
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
    [items, columns, cardCategories]
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

  // Delete a task
  const deleteTask = useCallback(async (taskId: string, taskListId: string) => {
    try {
      const response = await fetch(`/api/tasks/delete?taskId=${taskId}&taskListId=${taskListId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete task");

      // Remove from local state
      setItems((prev) => prev.filter((i) => i.id !== taskId));
      setCardCategories((prev) => {
        const newMap = new Map(prev);
        newMap.delete(taskId);
        return newMap;
      });
    } catch (err) {
      console.error("Failed to delete task:", err);
      throw err;
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
    deleteTask,
    refresh,
  };
}
