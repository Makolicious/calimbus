"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useBoard } from "@/hooks/useBoard";
import { useRealTimeSync } from "@/hooks/useRealTimeSync";
import { Column } from "./Column";
import { AddColumnButton } from "./AddColumnButton";
import { ItemSidebar } from "./ItemSidebar";
import { BoardItem } from "@/types";

// Helper to format date for display
function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) {
    return "Today";
  } else if (dateOnly.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Calendar dropdown component
function CalendarDropdown({
  selectedDate,
  onSelectDate,
  onClose,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onClose: () => void;
}) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.year, viewDate.month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const prevMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onSelectDate(dateStr);
    onClose();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const days = [];
  // Empty cells for days before the first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isSelected = dateStr === selectedDate;
    const isToday = dateStr === todayStr;

    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        className={`w-8 h-8 rounded-full text-sm font-medium transition-colors
          ${isSelected
            ? "bg-orange-500 text-white"
            : isToday
              ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
              : "text-gray-700 hover:bg-gray-100"
          }`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50 w-72">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {monthNames[viewDate.month]} {viewDate.year}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((name) => (
          <div key={name} className="w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-500">
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>

      {/* Quick actions */}
      <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
        <button
          onClick={() => {
            onSelectDate(todayStr);
            onClose();
          }}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            onSelectDate(tomorrow.toISOString().split("T")[0]);
            onClose();
          }}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          Tomorrow
        </button>
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const [selectedItem, setSelectedItem] = useState<BoardItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const {
    columns,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    getItemsForColumn,
    moveItem,
    addColumn,
    updateColumn,
    deleteColumn,
    deleteTask,
    createTask,
    trashItem,
    restoreItem,
    isItemTrashed,
    getTrashedItemPreviousColumn,
    refresh,
  } = useBoard();

  // Memoize refresh callbacks to prevent infinite re-renders
  const handleCalendarUpdate = useCallback(() => {
    console.log("Real-time: Calendar update detected");
    refresh();
  }, [refresh]);

  const handleTaskUpdate = useCallback(() => {
    console.log("Real-time: Task update detected");
    refresh();
  }, [refresh]);

  // Real-time sync - auto-refresh when Google Calendar/Tasks change
  const { isConnected } = useRealTimeSync({
    onCalendarUpdate: handleCalendarUpdate,
    onTaskUpdate: handleTaskUpdate,
    enabled: !loading,
    pollingInterval: 60000, // Poll every 60 seconds as fallback
  });

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }

    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showCalendar]);

  const handleItemClick = (item: BoardItem) => {
    setSelectedItem(item);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedItem(null);
  };

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;

    if (!destination) return;

    moveItem(draggableId, destination.droppableId);
  };

  const handlePreviousDay = () => {
    const date = new Date(selectedDate + "T00:00:00");
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate + "T00:00:00");
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;

    setIsCreatingTask(true);
    try {
      await createTask(newTaskTitle.trim(), selectedDate);
      setNewTaskTitle("");
      setShowAddTask(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsCreatingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="text-gray-600">Loading your calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        {/* Left side - Date navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousDay}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Previous day"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
            >
              Today
            </button>
            <div className="relative" ref={calendarRef}>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold text-gray-800">
                  {formatDisplayDate(selectedDate)}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${showCalendar ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCalendar && (
                <CalendarDropdown
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  onClose={() => setShowCalendar(false)}
                />
              )}
            </div>
          </div>

          <button
            onClick={handleNextDay}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Next day"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <span className="text-sm text-gray-500 ml-2">
            {columns.reduce(
              (acc, col) => acc + getItemsForColumn(col.id).length,
              0
            )}{" "}
            items
          </span>
        </div>

        {/* Right side - Add task and Refresh */}
        <div className="flex items-center gap-2">
          {showAddTask ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTask();
                  if (e.key === "Escape") {
                    setShowAddTask(false);
                    setNewTaskTitle("");
                  }
                }}
                placeholder="Task title..."
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-48"
                autoFocus
                disabled={isCreatingTask}
              />
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim() || isCreatingTask}
                className="px-3 py-1.5 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingTask ? "Adding..." : "Add"}
              </button>
              <button
                onClick={() => {
                  setShowAddTask(false);
                  setNewTaskTitle("");
                }}
                disabled={isCreatingTask}
                className="p-1.5 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddTask(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>
          )}

          {/* Sync status indicator */}
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
              isConnected
                ? "bg-green-50 text-green-600"
                : "bg-gray-100 text-gray-500"
            }`}
            title={isConnected ? "Real-time sync active" : "Using periodic sync"}
          >
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            {isConnected ? "Live" : "Sync"}
          </div>

          <button
            onClick={refresh}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Refresh"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="flex gap-4 h-full">
            {columns
              .sort((a, b) => a.position - b.position)
              .map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  items={getItemsForColumn(column.id)}
                  onEditColumn={updateColumn}
                  onDeleteColumn={deleteColumn}
                  onItemClick={handleItemClick}
                />
              ))}
            <AddColumnButton onAddColumn={addColumn} />
          </div>
        </div>
      </DragDropContext>
    </div>

      {/* Item Sidebar */}
      <ItemSidebar
        item={selectedItem}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        onDeleteTask={deleteTask}
        onTrashItem={trashItem}
        onRestoreItem={restoreItem}
        isItemTrashed={isItemTrashed}
        getTrashedItemPreviousColumn={getTrashedItemPreviousColumn}
      />
    </>
  );
}
