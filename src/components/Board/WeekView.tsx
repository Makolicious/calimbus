"use client";

import { useMemo } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { BoardItem, Column as ColumnType, CalendarEvent, Task } from "@/types";

interface WeekViewProps {
  columns: ColumnType[];
  items: BoardItem[];
  cardCategories: Map<string, string>;
  selectedDate: string;
  onItemClick: (item: BoardItem) => void;
  onQuickComplete?: (itemId: string) => void;
  onQuickTrash?: (itemId: string) => void;
  searchQuery: string;
}

// Helper to get week dates starting from the selected date's week (Sunday start)
function getWeekDates(selectedDate: string): string[] {
  const date = new Date(selectedDate + "T00:00:00");
  const dayOfWeek = date.getDay(); // 0 = Sunday
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - dayOfWeek);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
}

// Helper to format date for display
function formatDayHeader(dateString: string): { day: string; date: string; isToday: boolean } {
  const date = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  const isToday = dateOnly.getTime() === today.getTime();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return {
    day: dayNames[date.getDay()],
    date: String(date.getDate()),
    isToday,
  };
}

// Helper to check if an item falls on a specific date
function isItemOnDate(item: BoardItem, dateString: string): boolean {
  if (item.type === "event") {
    const eventDate = item.start.split("T")[0];
    return eventDate === dateString;
  } else {
    if (!item.due) return false; // Tasks without due date don't show in week view
    const taskDate = item.due.split("T")[0];
    return taskDate === dateString;
  }
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

// Mini card for week view
function WeekCard({
  item,
  index,
  onClick,
  onQuickComplete,
  onQuickTrash,
}: {
  item: BoardItem;
  index: number;
  onClick: (item: BoardItem) => void;
  onQuickComplete?: (itemId: string) => void;
  onQuickTrash?: (itemId: string) => void;
}) {
  const isEvent = item.type === "event";
  const event = isEvent ? (item as CalendarEvent) : null;
  const task = !isEvent ? (item as Task) : null;
  const isCompleted = task?.status === "completed";

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
          onClick={() => onClick(item)}
          className={`
            group relative rounded-lg shadow-sm border p-2 mb-1.5 cursor-pointer
            transition-all duration-150 text-xs
            ${isEvent ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800" : "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"}
            ${isCompleted ? "opacity-60" : ""}
            ${snapshot.isDragging ? "shadow-lg ring-2 ring-orange-400" : "hover:shadow-md"}
          `}
        >
          {/* Quick Actions */}
          <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
            {task && !isCompleted && onQuickComplete && (
              <button
                onClick={handleQuickComplete}
                className="p-1 bg-green-500 hover:bg-green-600 text-white rounded transition-all"
                title="Complete"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
            {onQuickTrash && (
              <button
                onClick={handleQuickTrash}
                className="p-1 bg-red-500 hover:bg-red-600 text-white rounded transition-all"
                title="Trash"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          <div className={`font-medium truncate pr-6 ${isCompleted ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"}`}>
            {item.title}
          </div>
          {event && (
            <div className="text-gray-500 dark:text-gray-400 mt-0.5">
              {formatTime(event.start)}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

export function WeekView({
  columns,
  items,
  cardCategories,
  selectedDate,
  onItemClick,
  onQuickComplete,
  onQuickTrash,
  searchQuery,
}: WeekViewProps) {
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  // Get items for a specific date (filtered by search and not in trash)
  const getItemsForDate = (dateString: string) => {
    const trashColumn = columns.find((c) => c.name.toLowerCase() === "trash");

    return items.filter((item) => {
      // Exclude trashed items
      const assignedColumn = cardCategories.get(item.id);
      if (assignedColumn === trashColumn?.id) return false;

      // Filter by date
      if (!isItemOnDate(item, dateString)) return false;

      // Filter by search
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        const title = item.title?.toLowerCase() || "";
        if (!title.includes(searchLower)) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort events by start time, tasks after events
      if (a.type === "event" && b.type === "task") return -1;
      if (a.type === "task" && b.type === "event") return 1;
      if (a.type === "event" && b.type === "event") {
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      }
      return 0;
    });
  };

  // Count items per date
  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    weekDates.forEach((date) => {
      counts[date] = getItemsForDate(date).length;
    });
    return counts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDates, items, cardCategories, searchQuery, columns]);

  return (
    <div className="flex-1 overflow-hidden p-4">
      <div className="grid grid-cols-7 gap-2 h-full">
        {weekDates.map((dateString) => {
          const { day, date, isToday } = formatDayHeader(dateString);
          const dayItems = getItemsForDate(dateString);

          return (
            <div
              key={dateString}
              className={`flex flex-col rounded-xl overflow-hidden border transition-all ${
                isToday
                  ? "border-orange-400 dark:border-orange-500 bg-orange-50/50 dark:bg-orange-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              }`}
            >
              {/* Day Header */}
              <div
                className={`px-3 py-2 text-center border-b ${
                  isToday
                    ? "bg-orange-500 text-white border-orange-400"
                    : "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="text-xs font-medium uppercase tracking-wide opacity-75">
                  {day}
                </div>
                <div className={`text-lg font-bold ${isToday ? "" : ""}`}>
                  {date}
                </div>
                {itemCounts[dateString] > 0 && (
                  <div className={`text-xs mt-0.5 ${isToday ? "text-orange-100" : "text-gray-500 dark:text-gray-400"}`}>
                    {itemCounts[dateString]} item{itemCounts[dateString] !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              {/* Day Content - Droppable */}
              <Droppable droppableId={`week-${dateString}`}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto p-2 min-h-[100px] transition-colors ${
                      snapshot.isDraggingOver ? "bg-orange-100/50 dark:bg-orange-900/30" : ""
                    }`}
                  >
                    {dayItems.length === 0 && !snapshot.isDraggingOver ? (
                      <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-xs">
                        No items
                      </div>
                    ) : (
                      dayItems.map((item, index) => (
                        <WeekCard
                          key={item.id}
                          item={item}
                          index={index}
                          onClick={onItemClick}
                          onQuickComplete={onQuickComplete}
                          onQuickTrash={onQuickTrash}
                        />
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </div>
  );
}
