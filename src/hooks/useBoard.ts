"use client";

import { useState, useEffect, useCallback } from "react";
import { Column, BoardItem, CardCategory, Task, CalendarEvent } from "@/types";

interface TrashedItem {
  item_id: string;
  item_type: string;
  previous_column_id: string;
  trashed_at: string;
}

// Helper to get date string in YYYY-MM-DD format (using local timezone)
function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper to check if an item falls on a specific date
function isItemOnDate(item: BoardItem, dateString: string): boolean {
  if (item.type === "event") {
    const eventDate = item.start.split("T")[0];
    return eventDate === dateString;
  } else {
    // For tasks, check due date
    if (!item.due) return true; // Tasks without due date show on all days
    const taskDate = item.due.split("T")[0];
    return taskDate === dateString;
  }
}

export function useBoard() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [cardCategories, setCardCategories] = useState<Map<string, string>>(
    new Map()
  );
  const [trashedItems, setTrashedItems] = useState<Map<string, TrashedItem>>(
    new Map()
  );
  // Track where completed tasks came from (for undo)
  const [completedTasksPreviousColumn, setCompletedTasksPreviousColumn] = useState<Map<string, string>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getDateString(new Date()));
  const [searchQuery, setSearchQuery] = useState<string>("");

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
        // Fetch columns, events, tasks, card categories, and trashed items in parallel
        const [columnsRes, eventsRes, tasksRes, categoriesRes, trashedRes] =
          await Promise.all([
            fetch("/api/columns"),
            fetch("/api/calendar"),
            fetch("/api/tasks"),
            fetch("/api/card-categories"),
            fetch("/api/trash"),
          ]);

        if (!columnsRes.ok) throw new Error("Failed to fetch columns");
        if (!eventsRes.ok) throw new Error("Failed to fetch calendar events");
        if (!tasksRes.ok) throw new Error("Failed to fetch tasks");
        if (!categoriesRes.ok)
          throw new Error("Failed to fetch card categories");
        if (!trashedRes.ok)
          throw new Error("Failed to fetch trashed items");

        const [columnsData, eventsData, tasksData, categoriesData, trashedData] =
          await Promise.all([
            columnsRes.json(),
            eventsRes.json(),
            tasksRes.json(),
            categoriesRes.json(),
            trashedRes.json(),
          ]);

        setColumns(columnsData);
        setItems([...eventsData, ...tasksData]);

        // Build card categories map
        const categoryMap = new Map<string, string>();
        categoriesData.forEach((cat: CardCategory) => {
          categoryMap.set(cat.item_id, cat.column_id);
        });

        // Build trashed items map
        const trashedMap = new Map<string, TrashedItem>();
        trashedData.forEach((trashed: TrashedItem) => {
          trashedMap.set(trashed.item_id, trashed);
        });
        setTrashedItems(trashedMap);

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

  // Helper to get item's date/time for sorting
  const getItemDateTime = (item: BoardItem): number => {
    if (item.type === "event") {
      return new Date(item.start).getTime();
    } else {
      // For tasks, use due date or a far future date if no due date
      return item.due ? new Date(item.due).getTime() : Number.MAX_SAFE_INTEGER;
    }
  };

  // Helper to check if an item matches the search query
  const itemMatchesSearch = useCallback((item: BoardItem, query: string): boolean => {
    if (!query.trim()) return true;

    const searchLower = query.toLowerCase().trim();
    const title = item.title?.toLowerCase() || "";

    // Search in title
    if (title.includes(searchLower)) return true;

    // Search in notes (for tasks)
    if (item.type === "task") {
      const task = item as Task;
      if (task.notes?.toLowerCase().includes(searchLower)) return true;
    }

    // Search in description (for events)
    if (item.type === "event") {
      const event = item as BoardItem & { description?: string };
      if (event.description?.toLowerCase().includes(searchLower)) return true;
    }

    return false;
  }, []);

  // Get items for a specific column, filtered by selected date and search query
  const getItemsForColumn = useCallback(
    (columnId: string) => {
      // Find special columns
      const eventsColumn = columns.find((c) => c.name.toLowerCase() === "events");
      const tasksColumn = columns.find((c) => c.name.toLowerCase() === "tasks");
      const trashColumn = columns.find((c) => c.name.toLowerCase() === "trash");
      const firstColumn = columns[0];

      const isEventsColumn = eventsColumn?.id === columnId;
      const isTasksColumn = tasksColumn?.id === columnId;
      const isTrashColumn = trashColumn?.id === columnId;

      const filteredItems = items.filter((item) => {
        const assignedColumn = cardCategories.get(item.id);

        // If item has an assigned column, use that
        if (assignedColumn) {
          if (assignedColumn !== columnId) return false;
        } else {
          // Auto-assign based on item type if no column assigned
          if (isEventsColumn) {
            // Events column gets unassigned events
            if (item.type !== "event") return false;
          } else if (isTasksColumn) {
            // Tasks column gets unassigned tasks
            if (item.type !== "task") return false;
          } else if (eventsColumn && item.type === "event") {
            // If there's an Events column but this isn't it, don't show unassigned events
            return false;
          } else if (tasksColumn && item.type === "task") {
            // If there's a Tasks column but this isn't it, don't show unassigned tasks
            return false;
          } else {
            // Fall back to first column for unassigned items if no Events/Tasks columns
            if (firstColumn && columnId !== firstColumn.id) return false;
          }
        }

        // Filter by selected date (including Trash column)
        if (!isItemOnDate(item, selectedDate)) return false;

        // Filter by search query
        if (!itemMatchesSearch(item, searchQuery)) return false;

        return true;
      });

      // Sort by date/time - earliest first
      return filteredItems.sort((a, b) => getItemDateTime(a) - getItemDateTime(b));
    },
    [items, cardCategories, columns, selectedDate, searchQuery, itemMatchesSearch]
  );

  // Move item to a different column
  const moveItem = useCallback(
    async (itemId: string, newColumnId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      // Find target column to check if it's "Done", "Trash", or "Roll Over"
      const targetColumn = columns.find((c) => c.id === newColumnId);
      const isDoneColumn = targetColumn?.name.toLowerCase() === "done";
      const isTrashColumn = targetColumn?.name.toLowerCase() === "trash";
      const isRollOverColumn = targetColumn?.name.toLowerCase() === "roll over";

      // Get the previous column to check if moving FROM done or trash
      const previousColumnId = cardCategories.get(itemId);
      const previousColumn = previousColumnId
        ? columns.find((c) => c.id === previousColumnId)
        : columns[0]; // Default to first column if not assigned
      const wasInDone = previousColumn?.name.toLowerCase() === "done";
      const wasInTrash = previousColumn?.name.toLowerCase() === "trash";

      console.log("Move item:", {
        itemId,
        itemType: item.type,
        targetColumn: targetColumn?.name,
        isDoneColumn,
        isTrashColumn,
        isRollOverColumn,
        previousColumn: previousColumn?.name,
        wasInDone,
        wasInTrash,
      });

      // Handle moving TO Trash - delete from Google Tasks and save for restore
      if (isTrashColumn && !wasInTrash && previousColumn) {
        try {
          // Save item data for potential restore
          await fetch("/api/trash", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              item_id: itemId,
              item_type: item.type,
              previous_column_id: previousColumn.id,
              // Save full item data for restore
              item_data: JSON.stringify(item),
            }),
          });

          // If it's a task, delete from Google Tasks
          if (item.type === "task") {
            const task = item as Task;
            try {
              await fetch(`/api/tasks/delete?taskId=${task.id}&taskListId=${task.taskListId}`, {
                method: "DELETE",
              });
              console.log("Deleted task from Google Tasks:", task.id);
            } catch (err) {
              console.error("Failed to delete task from Google:", err);
            }
          }

          // If it's an event, delete from Google Calendar
          if (item.type === "event") {
            const event = item as CalendarEvent;
            try {
              await fetch(`/api/calendar/delete?eventId=${event.id}&calendarId=${event.calendarId}`, {
                method: "DELETE",
              });
              console.log("Deleted event from Google Calendar:", event.id);
            } catch (err) {
              console.error("Failed to delete event from Google:", err);
            }
          }

          setTrashedItems((prev) => {
            const newMap = new Map(prev);
            newMap.set(itemId, {
              item_id: itemId,
              item_type: item.type,
              previous_column_id: previousColumn.id,
              trashed_at: new Date().toISOString(),
            });
            return newMap;
          });
        } catch (err) {
          console.error("Failed to record trash:", err);
        }
      }

      // Handle moving FROM Trash - restore item by recreating in Google
      if (wasInTrash && !isTrashColumn) {
        console.log("Dragging out of Trash - restoring item to:", targetColumn?.name);

        // Get the trashed item data from database
        const trashedItem = trashedItems.get(itemId);

        try {
          // Get full item data from trash API
          const response = await fetch(`/api/trash?item_id=${itemId}`, {
            method: "DELETE", // This removes from trash and returns item_data
          });

          if (!response.ok) {
            console.error("Failed to get trashed item data");
            return;
          }

          const restoreResponse = await response.json();
          const itemData = restoreResponse.item_data;

          if (!itemData) {
            console.error("No item data available for restore");
            return;
          }

          // Recreate the item in Google based on type
          if (item.type === "task") {
            const taskData = itemData;
            const dueDate = taskData.due ? taskData.due.split("T")[0] : undefined;

            const recreatedTask = await fetch("/api/tasks/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: taskData.title,
                due: dueDate,
                notes: taskData.notes,
              }),
            });

            if (recreatedTask.ok) {
              const newTask = await recreatedTask.json();
              console.log("Recreated task in Google Tasks:", newTask.id);

              // Update local state with new task
              setItems((prev) => {
                const filtered = prev.filter((i) => i.id !== itemId);
                return [...filtered, newTask];
              });

              // Set card category to the target column (user's choice)
              setCardCategories((prev) => {
                const newMap = new Map(prev);
                newMap.delete(itemId);
                newMap.set(newTask.id, newColumnId);
                return newMap;
              });

              // Persist to database
              await fetch("/api/card-categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  item_id: newTask.id,
                  item_type: "task",
                  column_id: newColumnId,
                }),
              });
            }
          } else if (item.type === "event") {
            const eventData = itemData;
            const isAllDay = !eventData.start?.includes("T");
            const dateStr = isAllDay ? eventData.start : eventData.start?.split("T")[0];
            const startTime = !isAllDay ? eventData.start?.split("T")[1]?.substring(0, 5) : undefined;
            const endTime = !isAllDay ? eventData.end?.split("T")[1]?.substring(0, 5) : undefined;

            const recreatedEvent = await fetch("/api/calendar/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: eventData.title,
                date: dateStr,
                allDay: isAllDay,
                startTime,
                endTime,
                location: eventData.location,
                description: eventData.description,
              }),
            });

            if (recreatedEvent.ok) {
              const newEvent = await recreatedEvent.json();
              console.log("Recreated event in Google Calendar:", newEvent.id);

              // Update local state with new event
              setItems((prev) => {
                const filtered = prev.filter((i) => i.id !== itemId);
                return [...filtered, newEvent];
              });

              // Set card category to the target column (user's choice)
              setCardCategories((prev) => {
                const newMap = new Map(prev);
                newMap.delete(itemId);
                newMap.set(newEvent.id, newColumnId);
                return newMap;
              });

              // Persist to database
              await fetch("/api/card-categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  item_id: newEvent.id,
                  item_type: "event",
                  column_id: newColumnId,
                }),
              });
            }
          }

          // Remove from trashed items
          setTrashedItems((prev) => {
            const newMap = new Map(prev);
            newMap.delete(itemId);
            return newMap;
          });

        } catch (err) {
          console.error("Failed to restore item from trash:", err);
        }

        return; // Don't continue with normal move logic
      }

      // Handle moving to Roll Over column - update due date to next day
      if (isRollOverColumn && item.type === "task") {
        const task = item as Task;

        // Calculate next day based on current selected date
        const currentDate = new Date(selectedDate + "T00:00:00");
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split("T")[0];

        console.log("Rolling over task to next day:", {
          taskId: task.id,
          from: selectedDate,
          to: nextDayStr,
        });

        // Optimistic update - change the task's due date
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId && i.type === "task"
              ? { ...i, due: nextDayStr + "T00:00:00.000Z" } as Task
              : i
          )
        );

        // Update in Google Tasks
        try {
          const response = await fetch("/api/tasks/update-due", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskId: task.id,
              taskListId: task.taskListId,
              due: nextDayStr + "T00:00:00.000Z",
            }),
          });

          if (!response.ok) {
            console.error("Failed to update task due date");
            // Revert on error
            setItems((prev) =>
              prev.map((i) =>
                i.id === itemId && i.type === "task"
                  ? { ...i, due: task.due } as Task
                  : i
              )
            );
          } else {
            // Success - clear the card category so task appears in Tasks column on new day
            setCardCategories((prev) => {
              const newMap = new Map(prev);
              newMap.delete(itemId);
              return newMap;
            });

            // Also clear from database
            await fetch("/api/card-categories", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ item_id: itemId }),
            });
          }
        } catch (err) {
          console.error("Failed to roll over task:", err);
        }

        // Task will now appear on the next day in the Tasks column
        return;
      }

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

        // Track previous column when moving TO Done (for undo)
        if (isDoneColumn && previousColumn) {
          setCompletedTasksPreviousColumn((prev) => {
            const newMap = new Map(prev);
            newMap.set(itemId, previousColumn.id);
            return newMap;
          });
        }

        // Clear tracking when moving FROM Done
        if (wasInDone) {
          setCompletedTasksPreviousColumn((prev) => {
            const newMap = new Map(prev);
            newMap.delete(itemId);
            return newMap;
          });
        }

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
    [items, columns, cardCategories, selectedDate]
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

  // Refresh data and detect deleted items
  const refresh = useCallback(async () => {
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

        const newItems = [...eventsData, ...tasksData];
        const newItemIds = new Set(newItems.map((item: BoardItem) => item.id));

        // Find Trash column
        const trashColumn = columns.find((c) => c.name.toLowerCase() === "trash");

        // Detect items that were deleted from Google (exist in current items but not in new items)
        // Only check items that are NOT already in trash
        const deletedItems = items.filter((item) => {
          const isAlreadyTrashed = trashedItems.has(item.id);
          const stillExists = newItemIds.has(item.id);
          return !isAlreadyTrashed && !stillExists;
        });

        // Move deleted items to Trash
        if (trashColumn && deletedItems.length > 0) {
          console.log("Detected items deleted from Google:", deletedItems.map(i => i.title || i.id));

          for (const item of deletedItems) {
            // Get current column for this item
            const currentColumnId = cardCategories.get(item.id) || columns[0]?.id;

            // Save to trash in database
            try {
              await fetch("/api/trash", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  item_id: item.id,
                  item_type: item.type,
                  previous_column_id: currentColumnId,
                  item_data: JSON.stringify(item),
                }),
              });

              // Update card category to Trash
              await fetch("/api/card-categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  item_id: item.id,
                  item_type: item.type,
                  column_id: trashColumn.id,
                }),
              });
            } catch (err) {
              console.error("Failed to move deleted item to trash:", err);
            }
          }

          // Update local trashed items state
          setTrashedItems((prev) => {
            const newMap = new Map(prev);
            deletedItems.forEach((item) => {
              const currentColumnId = cardCategories.get(item.id) || columns[0]?.id;
              newMap.set(item.id, {
                item_id: item.id,
                item_type: item.type,
                previous_column_id: currentColumnId || "",
                trashed_at: new Date().toISOString(),
              });
            });
            return newMap;
          });

          // Update card categories to move items to Trash
          setCardCategories((prev) => {
            const newMap = new Map(prev);
            deletedItems.forEach((item) => {
              newMap.set(item.id, trashColumn.id);
            });
            return newMap;
          });
        }

        // Keep ALL trashed items in state (both newly detected and previously trashed)
        // This ensures items dragged to Trash don't disappear on refresh
        const allTrashedItemIds = new Set([
          ...deletedItems.map((i) => i.id),
          ...Array.from(trashedItems.keys()),
        ]);
        const trashedItemsToKeep = items.filter((i) => allTrashedItemIds.has(i.id));

        // Merge: keep trashed items + add new items from Google (excluding any that are in trash)
        const newItemsFiltered = newItems.filter((item: BoardItem) => !allTrashedItemIds.has(item.id));
        setItems([...trashedItemsToKeep, ...newItemsFiltered]);
      }
    } catch (err) {
      console.error("Failed to refresh:", err);
    }
  }, [items, columns, cardCategories, trashedItems]);

  // Delete a task permanently
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

  // Move item to Trash column (soft delete - also deletes from Google Tasks)
  const trashItem = useCallback(async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    // Find Trash column
    const trashColumn = columns.find((c) => c.name.toLowerCase() === "trash");
    if (!trashColumn) {
      console.error("No Trash column found");
      return;
    }

    // Get current column - fall back to appropriate default based on item type
    const tasksColumn = columns.find((c) => c.name.toLowerCase() === "tasks");
    const eventsColumn = columns.find((c) => c.name.toLowerCase() === "events");
    const defaultColumn = item.type === "task" ? tasksColumn?.id : eventsColumn?.id;
    const currentColumnId = cardCategories.get(itemId) || defaultColumn || columns[0]?.id;
    if (!currentColumnId) return;

    // Save item data and previous column for restore
    try {
      await fetch("/api/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: itemId,
          item_type: item.type,
          previous_column_id: currentColumnId,
          item_data: JSON.stringify(item), // Save full item for restore
        }),
      });
    } catch (err) {
      console.error("Failed to record trash:", err);
      return;
    }

    // If it's a task, delete from Google Tasks
    if (item.type === "task") {
      const task = item as Task;
      try {
        await fetch(`/api/tasks/delete?taskId=${task.id}&taskListId=${task.taskListId}`, {
          method: "DELETE",
        });
        console.log("Deleted task from Google Tasks:", task.id);
      } catch (err) {
        console.error("Failed to delete task from Google:", err);
      }
    }

    // If it's an event, delete from Google Calendar
    if (item.type === "event") {
      const event = item as CalendarEvent;
      try {
        await fetch(`/api/calendar/delete?eventId=${event.id}&calendarId=${event.calendarId}`, {
          method: "DELETE",
        });
        console.log("Deleted event from Google Calendar:", event.id);
      } catch (err) {
        console.error("Failed to delete event from Google:", err);
      }
    }

    // Move to trash column
    setCardCategories((prev) => {
      const newMap = new Map(prev);
      newMap.set(itemId, trashColumn.id);
      return newMap;
    });

    setTrashedItems((prev) => {
      const newMap = new Map(prev);
      newMap.set(itemId, {
        item_id: itemId,
        item_type: item.type,
        previous_column_id: currentColumnId,
        trashed_at: new Date().toISOString(),
      });
      return newMap;
    });

    // Persist card category
    await fetch("/api/card-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: itemId,
        item_type: item.type,
        column_id: trashColumn.id,
      }),
    });
  }, [items, columns, cardCategories]);

  // Restore item from Trash to its previous column
  const restoreItem = useCallback(async (itemId: string) => {
    const trashedItem = trashedItems.get(itemId);
    if (!trashedItem) {
      console.error("Item not found in trash");
      return;
    }

    // Try to find item in local state, but we'll use item_data from DB if needed
    const item = items.find((i) => i.id === itemId);

    // Restore from trash API - this returns the item_data for recreating in Google
    let restoreResponse;
    try {
      const response = await fetch(`/api/trash?item_id=${itemId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to restore from trash");
      restoreResponse = await response.json();
    } catch (err) {
      console.error("Failed to restore from trash:", err);
      return;
    }

    // Use item_data from database (more reliable) or fall back to local item
    const itemData = restoreResponse.item_data;
    const itemType = itemData?.type || item?.type || trashedItem.item_type;

    if (!itemData && !item) {
      console.error("No item data available for restore");
      return;
    }

    // If it's a task, recreate it in Google Tasks
    if (itemType === "task" && itemData) {
      try {
        const taskData = itemData;
        // Extract just the date part (YYYY-MM-DD) from due date
        const dueDate = taskData.due ? taskData.due.split("T")[0] : undefined;
        const recreatedTask = await fetch("/api/tasks/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: taskData.title,
            due: dueDate,
            notes: taskData.notes,
          }),
        });

        if (recreatedTask.ok) {
          const newTask = await recreatedTask.json();
          console.log("Recreated task in Google Tasks:", newTask.id);

          // Remove old item and add new one with new Google ID
          setItems((prev) => {
            const filtered = prev.filter((i) => i.id !== itemId);
            return [...filtered, newTask];
          });

          // Determine correct column: use previous_column_id, but default to Tasks column for tasks
          let targetColumnId = trashedItem.previous_column_id;
          const tasksColumn = columns.find((c) => c.name.toLowerCase() === "tasks");
          const eventsColumn = columns.find((c) => c.name.toLowerCase() === "events");

          // If previous column was Events but item is a task, fix it to Tasks
          if (targetColumnId === eventsColumn?.id && itemType === "task" && tasksColumn) {
            targetColumnId = tasksColumn.id;
          }

          // Update card categories with new ID and correct column
          setCardCategories((prev) => {
            const newMap = new Map(prev);
            newMap.delete(itemId);
            newMap.set(newTask.id, targetColumnId);
            return newMap;
          });

          // Persist card category with new ID
          await fetch("/api/card-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              item_id: newTask.id,
              item_type: "task",
              column_id: previousColumnId,
            }),
          });
        }
      } catch (err) {
        console.error("Failed to recreate task in Google:", err);
      }
    } else if (itemType === "event" && itemData) {
      // Recreate event in Google Calendar
      try {
        const eventData = itemData;

        // Determine if it's an all-day event or timed event
        const isAllDay = !eventData.start?.includes("T");
        const dateStr = isAllDay ? eventData.start : eventData.start?.split("T")[0];
        const startTime = !isAllDay ? eventData.start?.split("T")[1]?.substring(0, 5) : undefined;
        const endTime = !isAllDay ? eventData.end?.split("T")[1]?.substring(0, 5) : undefined;

        const recreatedEvent = await fetch("/api/calendar/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: eventData.title,
            date: dateStr,
            startTime,
            endTime,
            allDay: isAllDay,
            location: eventData.location,
            description: eventData.description,
          }),
        });

        if (recreatedEvent.ok) {
          const newEvent = await recreatedEvent.json();
          console.log("Recreated event in Google Calendar:", newEvent.id);

          // Remove old item and add new one with new Google ID
          setItems((prev) => {
            const filtered = prev.filter((i) => i.id !== itemId);
            return [...filtered, newEvent];
          });

          // Determine correct column: use previous_column_id, but default to Events column for events
          let targetColumnId = trashedItem.previous_column_id;
          const tasksColumn = columns.find((c) => c.name.toLowerCase() === "tasks");
          const eventsColumn = columns.find((c) => c.name.toLowerCase() === "events");

          // If previous column was Tasks but item is an event, fix it to Events
          if (targetColumnId === tasksColumn?.id && itemType === "event" && eventsColumn) {
            targetColumnId = eventsColumn.id;
          }

          // Update card categories with new ID and correct column
          setCardCategories((prev) => {
            const newMap = new Map(prev);
            newMap.delete(itemId);
            newMap.set(newEvent.id, targetColumnId);
            return newMap;
          });

          // Persist card category with new ID
          await fetch("/api/card-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              item_id: newEvent.id,
              item_type: "event",
              column_id: targetColumnId,
            }),
          });
        }
      } catch (err) {
        console.error("Failed to recreate event in Google:", err);
      }
    } else {
      // Fallback: just move back to previous column (shouldn't happen often)
      console.warn("No item_data available, falling back to category update only");
      const previousColumnId = trashedItem.previous_column_id;

      setCardCategories((prev) => {
        const newMap = new Map(prev);
        newMap.set(itemId, previousColumnId);
        return newMap;
      });

      // Persist card category
      await fetch("/api/card-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: itemId,
          item_type: itemType,
          column_id: previousColumnId,
        }),
      });
    }

    setTrashedItems((prev) => {
      const newMap = new Map(prev);
      newMap.delete(itemId);
      return newMap;
    });
  }, [items, trashedItems, columns]);

  // Permanently delete item from trash (no restore possible)
  const permanentlyDeleteItem = useCallback(async (itemId: string) => {
    const trashedItem = trashedItems.get(itemId);
    if (!trashedItem) {
      console.error("Item not found in trash for permanent deletion");
      return;
    }

    try {
      // Remove from trashed_items table in database
      await fetch(`/api/trash?item_id=${itemId}`, {
        method: "DELETE",
      });

      // Also clean up any card categories
      await fetch(`/api/card-categories?item_id=${itemId}`, {
        method: "DELETE",
      });

      // Remove from local state
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setTrashedItems((prev) => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
      setCardCategories((prev) => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });

      console.log("Permanently deleted item:", itemId);
    } catch (err) {
      console.error("Failed to permanently delete item:", err);
    }
  }, [trashedItems]);

  // Check if item is in trash
  const isItemTrashed = useCallback((itemId: string) => {
    return trashedItems.has(itemId);
  }, [trashedItems]);

  // Get previous column for trashed item
  const getTrashedItemPreviousColumn = useCallback((itemId: string) => {
    const trashedItem = trashedItems.get(itemId);
    if (!trashedItem) return null;
    return columns.find((c) => c.id === trashedItem.previous_column_id);
  }, [trashedItems, columns]);

  // Create a new task (syncs to Google Tasks)
  const createTask = useCallback(async (title: string, dueDate?: string, notes?: string) => {
    try {
      const response = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          due: dueDate || selectedDate,
          notes,
        }),
      });

      if (!response.ok) throw new Error("Failed to create task");

      const newTask = await response.json();

      // Add to local state
      setItems((prev) => [...prev, newTask]);

      return newTask;
    } catch (err) {
      console.error("Failed to create task:", err);
      throw err;
    }
  }, [selectedDate]);

  // Create a new event (syncs to Google Calendar, stores extras in Supabase)
  const createEvent = useCallback(async (
    title: string,
    date?: string,
    startTime?: string,
    endTime?: string,
    allDay: boolean = true,
    location?: string,
    description?: string
  ) => {
    try {
      const response = await fetch("/api/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date: date || selectedDate,
          startTime,
          endTime,
          allDay,
          location,
          description,
        }),
      });

      if (!response.ok) throw new Error("Failed to create event");

      const newEvent = await response.json();

      // Add to local state
      setItems((prev) => [...prev, newEvent]);

      return newEvent;
    } catch (err) {
      console.error("Failed to create event:", err);
      throw err;
    }
  }, [selectedDate]);

  // Undo roll over - move item's due date back one day
  const undoRollOver = useCallback(async (itemId: string, itemType: "task" | "event") => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    // Get current due date and calculate previous day
    const currentDue = itemType === "task" ? (item as Task).due : (item as CalendarEvent).start;
    if (!currentDue) return;

    const currentDate = new Date(currentDue.split("T")[0] + "T12:00:00");
    const previousDay = new Date(currentDate);
    previousDay.setDate(previousDay.getDate() - 1);
    const previousDayStr = `${previousDay.getFullYear()}-${String(previousDay.getMonth() + 1).padStart(2, "0")}-${String(previousDay.getDate()).padStart(2, "0")}`;

    console.log("Undo roll over:", {
      itemId,
      itemType,
      from: currentDue.split("T")[0],
      to: previousDayStr,
    });

    if (itemType === "task") {
      const task = item as Task;

      // Optimistic update
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId && i.type === "task"
            ? { ...i, due: previousDayStr + "T00:00:00.000Z" } as Task
            : i
        )
      );

      // Update in Google Tasks
      try {
        const response = await fetch("/api/tasks/update-due", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: task.id,
            taskListId: task.taskListId,
            due: previousDayStr + "T00:00:00.000Z",
          }),
        });

        if (!response.ok) {
          // Revert on error
          setItems((prev) =>
            prev.map((i) =>
              i.id === itemId && i.type === "task"
                ? { ...i, due: currentDue } as Task
                : i
            )
          );
          throw new Error("Failed to update task due date");
        }
      } catch (err) {
        console.error("Failed to undo roll over:", err);
        throw err;
      }
    } else {
      // For events, we need to delete and recreate with new date
      const event = item as CalendarEvent;

      // Optimistic update
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId && i.type === "event"
            ? { ...i, start: previousDayStr } as CalendarEvent
            : i
        )
      );

      try {
        // Delete the current event
        await fetch(`/api/calendar/delete?eventId=${event.id}&calendarId=${event.calendarId}`, {
          method: "DELETE",
        });

        // Recreate with previous day
        const recreatedEvent = await fetch("/api/calendar/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: event.title,
            date: previousDayStr,
            allDay: !event.start?.includes("T") || event.start?.includes("T00:00:00"),
            location: event.location,
            description: event.description,
          }),
        });

        if (recreatedEvent.ok) {
          const newEvent = await recreatedEvent.json();
          // Update local state with new event ID
          setItems((prev) =>
            prev.map((i) => (i.id === itemId ? { ...newEvent } : i))
          );
        }
      } catch (err) {
        console.error("Failed to undo roll over for event:", err);
        throw err;
      }
    }
  }, [items]);

  // Uncomplete a task - move it back to its previous column
  const uncompleteTask = useCallback(async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item || item.type !== "task") return;

    // Get the previous column (where task was before Done)
    const previousColumnId = completedTasksPreviousColumn.get(itemId);
    const tasksColumn = columns.find((c) => c.name.toLowerCase() === "tasks");
    const targetColumnId = previousColumnId || tasksColumn?.id || columns[0]?.id;

    if (!targetColumnId) {
      console.error("No column to move task to");
      return;
    }

    // Use moveItem to handle the sync with Google
    await moveItem(itemId, targetColumnId);
  }, [items, columns, completedTasksPreviousColumn, moveItem]);

  // Get the previous column for a completed task (for undo button display)
  const getCompletedTaskPreviousColumn = useCallback((itemId: string) => {
    const previousColumnId = completedTasksPreviousColumn.get(itemId);
    if (!previousColumnId) return null;
    return columns.find((c) => c.id === previousColumnId);
  }, [completedTasksPreviousColumn, columns]);

  // Reschedule item to a new date (for week view drag-to-reschedule)
  const rescheduleItem = useCallback(async (itemId: string, newDate: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    try {
      if (item.type === "task") {
        const task = item as Task;
        const newDueDate = newDate + "T00:00:00.000Z";

        // Optimistic update
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId && i.type === "task"
              ? { ...i, due: newDueDate } as Task
              : i
          )
        );

        // Update task due date via API (PATCH method, correct params)
        const response = await fetch("/api/tasks/update-due", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: task.id,
            taskListId: task.taskListId,
            due: newDueDate,
          }),
        });

        if (!response.ok) {
          console.error("Failed to update task due date");
          // Revert on error
          setItems((prev) =>
            prev.map((i) =>
              i.id === itemId && i.type === "task"
                ? { ...i, due: task.due } as Task
                : i
            )
          );
        }
      } else if (item.type === "event") {
        const event = item as CalendarEvent;

        // Optimistic update
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, start: newDate } : i
          )
        );

        // Delete old event and create new one on new date
        await fetch(`/api/calendar/delete?eventId=${event.id}&calendarId=${event.calendarId}`, {
          method: "DELETE",
        });

        const isAllDay = !event.start?.includes("T") || event.start?.includes("T00:00:00");
        const recreatedEvent = await fetch("/api/calendar/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: event.title,
            date: newDate,
            allDay: isAllDay,
            location: event.location,
            description: event.description,
          }),
        });

        if (recreatedEvent.ok) {
          const newEvent = await recreatedEvent.json();
          setItems((prev) =>
            prev.map((i) => (i.id === itemId ? { ...newEvent } : i))
          );
        }
      }
    } catch (err) {
      console.error("Failed to reschedule item:", err);
    }
  }, [items]);

  return {
    columns,
    items,
    cardCategories,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    searchQuery,
    setSearchQuery,
    getItemsForColumn,
    moveItem,
    rescheduleItem,
    addColumn,
    updateColumn,
    deleteColumn,
    deleteTask,
    createTask,
    createEvent,
    trashItem,
    restoreItem,
    permanentlyDeleteItem,
    undoRollOver,
    uncompleteTask,
    isItemTrashed,
    getTrashedItemPreviousColumn,
    getCompletedTaskPreviousColumn,
    refresh,
  };
}
