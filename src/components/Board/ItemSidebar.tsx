"use client";

import { useState, useEffect } from "react";
import { BoardItem, CalendarEvent, Task, Column, Label } from "@/types";
import { LabelPicker } from "@/components/UI/LabelPicker";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  position: number;
}

interface ItemSidebarProps {
  item: BoardItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleteTask?: (taskId: string, taskListId: string) => Promise<void>;
  onTrashItem?: (itemId: string) => Promise<void>;
  onRestoreItem?: (itemId: string) => Promise<void>;
  onUncompleteTask?: (itemId: string) => Promise<void>;
  onQuickComplete?: (itemId: string) => Promise<void>;
  isItemTrashed?: (itemId: string) => boolean;
  getTrashedItemPreviousColumn?: (itemId: string) => Column | null | undefined;
  labels?: Label[];
  itemLabelIds?: string[];
  onToggleLabel?: (itemId: string, labelId: string) => Promise<void>;
  onCreateLabel?: (name: string, color: string) => Promise<Label>;
}

function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateString: string): string {
  if (!dateString) return "";
  if (dateString.length === 10) return "All day";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// Track skip confirmations in module scope so it persists across sidebar opens
let skipDeleteConfirmCount = 0;

export function ItemSidebar({
  item,
  isOpen,
  onClose,
  onDeleteTask,
  onTrashItem,
  onRestoreItem,
  onUncompleteTask,
  onQuickComplete,
  isItemTrashed,
  getTrashedItemPreviousColumn,
  labels = [],
  itemLabelIds = [],
  onToggleLabel,
  onCreateLabel,
}: ItemSidebarProps) {
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [skipNextConfirms, setSkipNextConfirms] = useState(false);
  const [isTrashing, setIsTrashing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isUncompleting, setIsUncompleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const isEvent = item?.type === "event";
  const event = isEvent ? (item as CalendarEvent) : null;
  const task = !isEvent ? (item as Task) : null;
  const isTrashed = item && isItemTrashed ? isItemTrashed(item.id) : false;
  const previousColumn = item && getTrashedItemPreviousColumn ? getTrashedItemPreviousColumn(item.id) : null;

  // Fetch notes and checklist when item changes
  useEffect(() => {
    if (item) {
      fetchNotes();
      fetchChecklist();
    } else {
      setNotes("");
      setLastSaved(null);
      setChecklistItems([]);
    }
  }, [item?.id]);

  const fetchNotes = async () => {
    if (!item) return;

    try {
      const response = await fetch(`/api/notes?item_id=${item.id}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || "");
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    }
  };

  const saveNotes = async () => {
    if (!item) return;

    setIsSaving(true);
    const startTime = Date.now();

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: item.id,
          item_type: item.type,
          notes,
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error("Failed to save notes:", error);
    } finally {
      // Ensure "Saving..." shows for at least 800ms so user can see it
      const elapsed = Date.now() - startTime;
      const minDisplayTime = 800;
      if (elapsed < minDisplayTime) {
        setTimeout(() => setIsSaving(false), minDisplayTime - elapsed);
      } else {
        setIsSaving(false);
      }
    }
  };

  // Auto-save after typing stops
  useEffect(() => {
    if (!item) return;

    const timeoutId = setTimeout(() => {
      if (notes !== undefined) {
        saveNotes();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [notes]);

  // Checklist functions
  const fetchChecklist = async () => {
    if (!item) return;

    try {
      const response = await fetch(`/api/checklist?item_id=${item.id}`);
      if (response.ok) {
        const data = await response.json();
        setChecklistItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch checklist:", error);
    }
  };

  const addChecklistItem = async () => {
    if (!item || !newChecklistText.trim()) return;

    try {
      const response = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: item.id,
          item_type: item.type,
          text: newChecklistText.trim(),
        }),
      });

      if (response.ok) {
        const newItem = await response.json();
        setChecklistItems((prev) => [...prev, newItem]);
        setNewChecklistText("");
      }
    } catch (error) {
      console.error("Failed to add checklist item:", error);
    }
  };

  // Check if task is completed (checklist items can't be unchecked when task is done)
  const isTaskCompleted = task?.status === "completed";

  const toggleChecklistItem = async (checklistItem: ChecklistItem) => {
    // Don't allow unchecking if task is completed
    if (isTaskCompleted && checklistItem.checked) {
      return;
    }

    // Optimistic update
    setChecklistItems((prev) =>
      prev.map((ci) =>
        ci.id === checklistItem.id ? { ...ci, checked: !ci.checked } : ci
      )
    );

    try {
      const response = await fetch("/api/checklist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: checklistItem.id,
          checked: !checklistItem.checked,
        }),
      });

      if (!response.ok) {
        // Revert on error
        setChecklistItems((prev) =>
          prev.map((ci) =>
            ci.id === checklistItem.id ? { ...ci, checked: checklistItem.checked } : ci
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle checklist item:", error);
      // Revert on error
      setChecklistItems((prev) =>
        prev.map((ci) =>
          ci.id === checklistItem.id ? { ...ci, checked: checklistItem.checked } : ci
        )
      );
    }
  };

  const deleteChecklistItem = async (id: string) => {
    // Optimistic update
    const previousItems = checklistItems;
    setChecklistItems((prev) => prev.filter((ci) => ci.id !== id));

    try {
      const response = await fetch(`/api/checklist?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // Revert on error
        setChecklistItems(previousItems);
      }
    } catch (error) {
      console.error("Failed to delete checklist item:", error);
      setChecklistItems(previousItems);
    }
  };

  const handleDeleteTask = async (skipConfirmation = false) => {
    if (!task || !onDeleteTask) return;

    // If skipping confirmations, decrement counter
    if (skipConfirmation && skipDeleteConfirmCount > 0) {
      skipDeleteConfirmCount--;
    }

    // If checkbox was checked, set skip counter for next 5 deletes
    if (skipNextConfirms) {
      skipDeleteConfirmCount = 5;
      setSkipNextConfirms(false);
    }

    setIsDeleting(true);
    try {
      await onDeleteTask(task.id, task.taskListId);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error("Failed to delete task:", error);
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = () => {
    // If we have skip confirmations remaining, delete immediately
    if (skipDeleteConfirmCount > 0) {
      handleDeleteTask(true);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleTrashItem = async () => {
    if (!item || !onTrashItem) return;

    setIsTrashing(true);
    try {
      await onTrashItem(item.id);
      onClose();
    } catch (error) {
      console.error("Failed to trash item:", error);
    } finally {
      setIsTrashing(false);
    }
  };

  const handleRestoreItem = async () => {
    if (!item || !onRestoreItem) return;

    setIsRestoring(true);
    try {
      await onRestoreItem(item.id);
      onClose();
    } catch (error) {
      console.error("Failed to restore item:", error);
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <>
      {/* Backdrop - glass blur effect */}
      <div
        className="glass-backdrop fixed inset-0 z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white/95 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl shadow-black/20 z-50 flex flex-col animate-slideInRight transition-theme border-l border-white/20 dark:border-white/10">
        {/* Header */}
        <div className="p-4 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between bg-gray-50/80 dark:bg-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border backdrop-blur-sm ${
                isEvent
                  ? "bg-blue-100/80 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-500/30"
                  : "bg-green-100/80 text-green-700 dark:bg-green-500/20 dark:text-green-300 border-green-200 dark:border-green-500/30"
              }`}
            >
              {isEvent ? "Event" : "Task"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-all"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Trashed item banner */}
          {isTrashed && (
            <div className="mb-4 p-3 bg-yellow-100/80 dark:bg-yellow-500/15 border border-yellow-200 dark:border-yellow-500/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">This item is in Trash</span>
              </div>
              {previousColumn && (
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-3">
                  Was in: <span className="font-medium">{previousColumn.name}</span>
                </p>
              )}
              <button
                onClick={handleRestoreItem}
                disabled={isRestoring}
                className="w-full px-3 py-2.5 bg-yellow-500/90 text-white text-sm rounded-xl hover:bg-yellow-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50"
              >
                {isRestoring ? (
                  "Restoring..."
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Restore to {previousColumn?.name || "previous column"}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Title with trash button */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {item.title}
            </h2>
            {/* Show trash button for all items (tasks and events) when not already trashed */}
            {!isTrashed && onTrashItem && (
              <button
                onClick={handleTrashItem}
                disabled={isTrashing}
                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 flex-shrink-0 disabled:opacity-50"
                title="Move to Trash"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Labels */}
          {!isTrashed && onToggleLabel && onCreateLabel && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Labels</h4>
              <LabelPicker
                labels={labels}
                selectedLabelIds={itemLabelIds}
                onToggleLabel={(labelId) => onToggleLabel(item.id, labelId)}
                onCreateLabel={onCreateLabel}
                compact
              />
            </div>
          )}

          {/* Complete button - show for non-completed tasks */}
          {!isTrashed && task && !isTaskCompleted && onQuickComplete && (
            <button
              onClick={async () => {
                setIsCompleting(true);
                try {
                  await onQuickComplete(item!.id);
                  onClose();
                } catch (err) {
                  console.error("Failed to complete task:", err);
                } finally {
                  setIsCompleting(false);
                }
              }}
              disabled={isCompleting}
              className="w-full mb-4 px-3 py-2.5 bg-green-500/90 text-white text-sm rounded-xl hover:bg-green-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
            >
              {isCompleting ? (
                "Completing..."
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  Complete Task
                </>
              )}
            </button>
          )}

          {/* Undo Complete button - show for completed tasks */}
          {!isTrashed && isTaskCompleted && onUncompleteTask && (
            <button
              onClick={async () => {
                setIsUncompleting(true);
                try {
                  await onUncompleteTask(item!.id);
                  onClose();
                } catch (err) {
                  console.error("Failed to uncomplete task:", err);
                } finally {
                  setIsUncompleting(false);
                }
              }}
              disabled={isUncompleting}
              className="w-full mb-4 px-3 py-2.5 bg-yellow-100/80 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 text-sm rounded-xl hover:bg-yellow-200/80 dark:hover:bg-yellow-500/25 border border-yellow-200 dark:border-yellow-500/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-all backdrop-blur-sm"
            >
              {isUncompleting ? (
                "Reverting..."
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Undo Complete (Back to Tasks)
                </>
              )}
            </button>
          )}

          {/* Event details */}
          {event && (
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-gray-400 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(event.start)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTime(event.start)}
                    {event.end && ` - ${formatTime(event.end)}`}
                  </p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-gray-400 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p className="text-sm text-gray-700">{event.location}</p>
                </div>
              )}

              {event.description && (
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-gray-400 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Task details */}
          {task && (
            <div className="space-y-3 mb-6">
              {task.due && (
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-gray-400 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Due: {formatDate(task.due)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <svg
                  className={`w-5 h-5 ${
                    task.status === "completed"
                      ? "text-green-500"
                      : "text-gray-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p
                  className={`text-sm ${
                    task.status === "completed"
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {task.status === "completed" ? "Completed" : "Not completed"}
                </p>
              </div>

              {task.notes && (
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-gray-400 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                    {task.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-200/50 dark:border-white/10 my-4" />

          {/* Notes section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                My Notes
              </label>
              {isSaving && (
                <span className="text-xs text-red-500 font-medium animate-pulse">Saving... please wait</span>
              )}
              {!isSaving && lastSaved && (
                <span className="text-xs text-green-600">✓ Saved</span>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes here..."
              className="w-full h-48 p-3 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white bg-white/80 dark:bg-white/5 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 backdrop-blur-sm transition-all"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Notes are saved automatically and stored only in Calimbus.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200/50 dark:border-white/10 my-4" />

          {/* Checklist section */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Checklist
            </label>

            {/* Existing checklist items */}
            <div className="space-y-2 mb-3">
              {checklistItems.map((checklistItem) => {
                // Can't uncheck items when task is completed
                const isLocked = isTaskCompleted && checklistItem.checked;

                return (
                  <div
                    key={checklistItem.id}
                    className="flex items-center gap-2 group"
                  >
                    <button
                      onClick={() => toggleChecklistItem(checklistItem)}
                      disabled={isLocked}
                      title={isLocked ? "Move task out of Done to uncheck items" : undefined}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        checklistItem.checked
                          ? isLocked
                            ? "bg-gray-400 border-gray-400 text-white cursor-not-allowed"
                            : "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30"
                          : "border-gray-300 dark:border-white/20 hover:border-orange-400 bg-white/50 dark:bg-white/5"
                      }`}
                    >
                      {checklistItem.checked && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        checklistItem.checked
                          ? "text-gray-400 dark:text-gray-500 line-through"
                          : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {checklistItem.text}
                    </span>
                    <button
                      onClick={() => deleteChecklistItem(checklistItem.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add new checklist item */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addChecklistItem();
                }}
                placeholder="Add a checklist item..."
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-white/5 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 backdrop-blur-sm transition-all"
              />
              <button
                onClick={addChecklistItem}
                disabled={!newChecklistText.trim()}
                className="px-4 py-2 bg-orange-500/90 text-white rounded-xl text-sm font-medium hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Checklist items are stored only in Calimbus.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
