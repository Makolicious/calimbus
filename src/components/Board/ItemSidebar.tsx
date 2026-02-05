"use client";

import { useState, useEffect } from "react";
import { BoardItem, CalendarEvent, Task } from "@/types";

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

export function ItemSidebar({ item, isOpen, onClose }: ItemSidebarProps) {
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");

  const isEvent = item?.type === "event";
  const event = isEvent ? (item as CalendarEvent) : null;
  const task = !isEvent ? (item as Task) : null;

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

  const toggleChecklistItem = async (checklistItem: ChecklistItem) => {
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

  if (!isOpen || !item) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isEvent
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {isEvent ? "Event" : "Task"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
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
          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {item.title}
          </h2>

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
                    <p className="text-sm font-medium text-gray-900">
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
                      ? "text-green-600"
                      : "text-gray-700"
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
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {task.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-200 my-4" />

          {/* Notes section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
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
              className="w-full h-48 p-3 border border-gray-300 rounded-lg text-sm text-gray-900 resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-xs text-gray-400 mt-2">
              Notes are saved automatically and stored only in Calimbus.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-4" />

          {/* Checklist section */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Checklist
            </label>

            {/* Existing checklist items */}
            <div className="space-y-2 mb-3">
              {checklistItems.map((checklistItem) => (
                <div
                  key={checklistItem.id}
                  className="flex items-center gap-2 group"
                >
                  <button
                    onClick={() => toggleChecklistItem(checklistItem)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      checklistItem.checked
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "border-gray-300 hover:border-orange-400"
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
                        ? "text-gray-400 line-through"
                        : "text-gray-900"
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
              ))}
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <button
                onClick={addChecklistItem}
                disabled={!newChecklistText.trim()}
                className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Checklist items are stored only in Calimbus.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
