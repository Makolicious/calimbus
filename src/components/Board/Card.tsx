"use client";

import { Draggable } from "@hello-pangea/dnd";
import { BoardItem, CalendarEvent, Task } from "@/types";

interface CardProps {
  item: BoardItem;
  index: number;
  onClick: (item: BoardItem) => void;
  onQuickComplete?: (itemId: string) => void;
  onQuickTrash?: (itemId: string) => void;
}

function formatDate(dateString: string): string {
  if (!dateString) return "";

  // Handle YYYY-MM-DD format (date only) - parse as local date to avoid timezone shift
  if (dateString.length === 10 || dateString.includes("T00:00:00")) {
    const datePart = dateString.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  // For datetime strings, use normal parsing
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  // Check if it's an all-day event (date only, no time component)
  if (dateString.length === 10) return "All day";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function Card({ item, index, onClick, onQuickComplete, onQuickTrash }: CardProps) {
  const isEvent = item.type === "event";
  const event = isEvent ? (item as CalendarEvent) : null;
  const task = !isEvent ? (item as Task) : null;
  const isCompleted = task?.status === "completed";

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger if not dragging
    if (!(e.target as HTMLElement).closest('[data-rbd-drag-handle-draggable-id]')?.getAttribute('data-rbd-drag-handle-draggable-id')) {
      onClick(item);
    }
  };

  const handleQuickComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickComplete?.(item.id);
  };

  const handleQuickTrash = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickTrash?.(item.id);
  };

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={!snapshot.isDragging ? handleClick : undefined}
          className={`
            card-hover group relative rounded-lg shadow-sm border p-3 mb-2 cursor-pointer
            transition-all duration-200 animate-cardEntrance card-stagger
            ${isEvent ? "card-event" : "card-task"}
            ${isCompleted ? "card-completed" : ""}
            ${snapshot.isDragging
              ? "dragging shadow-xl ring-2 ring-orange-400 dark:ring-orange-500"
              : "hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500"
            }
            dark:border-gray-700
          `}
        >
          {/* Quick Actions - appear on hover */}
          <div className="quick-actions absolute top-2 right-2 flex gap-1">
            {task && !isCompleted && onQuickComplete && (
              <button
                onClick={handleQuickComplete}
                className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-sm transition-all hover:scale-110"
                title="Complete task"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
            {onQuickTrash && (
              <button
                onClick={handleQuickTrash}
                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-sm transition-all hover:scale-110"
                title="Move to trash"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-start justify-between gap-2 pr-16 group-hover:pr-0 transition-all">
            <h4 className={`card-title font-medium text-sm leading-tight flex-1 dark:text-gray-100 ${isCompleted ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-900"}`}>
              {item.title}
            </h4>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 transition-opacity group-hover:opacity-0 ${
                isEvent
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                  : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
              }`}
            >
              {isEvent ? "Event" : "Task"}
            </span>
          </div>

          {event && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <svg
                  className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400"
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
                <span>{formatDate(event.start)}</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span>{formatTime(event.start)}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400"
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
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </div>
          )}

          {task && (
            <div className="mt-2 space-y-1">
              {task.due && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-3.5 h-3.5 text-green-500 dark:text-green-400"
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
                  <span>Due: {formatDate(task.due)}</span>
                </div>
              )}
              {isCompleted && (
                <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      className="animate-checkmark"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Completed</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
