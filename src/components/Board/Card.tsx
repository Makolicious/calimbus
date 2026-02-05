"use client";

import { Draggable } from "@hello-pangea/dnd";
import { BoardItem, CalendarEvent, Task } from "@/types";

interface CardProps {
  item: BoardItem;
  index: number;
  onClick: (item: BoardItem) => void;
}

function formatDate(dateString: string): string {
  if (!dateString) return "";
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

export function Card({ item, index, onClick }: CardProps) {
  const isEvent = item.type === "event";
  const event = isEvent ? (item as CalendarEvent) : null;
  const task = !isEvent ? (item as Task) : null;

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger if not dragging
    if (!(e.target as HTMLElement).closest('[data-rbd-drag-handle-draggable-id]')?.getAttribute('data-rbd-drag-handle-draggable-id')) {
      onClick(item);
    }
  };

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={!snapshot.isDragging ? handleClick : undefined}
          className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2 cursor-pointer hover:border-orange-300 transition-all ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-orange-300 cursor-grabbing" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1">
              {item.title}
            </h4>
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

          {event && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1 text-xs text-gray-500">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{formatDate(event.start)}</span>
                <span className="text-gray-400">|</span>
                <span>{formatTime(event.start)}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
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
                <div className="flex items-center gap-1 text-xs text-gray-500">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Due: {formatDate(task.due)}</span>
                </div>
              )}
              {task.status === "completed" && (
                <div className="flex items-center gap-1 text-xs text-green-600">
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
