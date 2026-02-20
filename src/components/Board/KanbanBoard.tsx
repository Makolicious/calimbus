"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useBoard } from "@/hooks/useBoard";
import { useRealTimeSync } from "@/hooks/useRealTimeSync";
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from "@/hooks/useKeyboardShortcuts";
import { useOnboarding, OnboardingOverlay } from "@/hooks/useOnboarding";
import { useShortcuts } from "@/contexts/ShortcutsContext";
import { Column } from "./Column";
import { AddColumnButton } from "./AddColumnButton";
import { ItemSidebar } from "./ItemSidebar";
import { WeekView } from "./WeekView";
import { FilterBar } from "@/components/UI/FilterBar";
import { LabelPicker } from "@/components/UI/LabelPicker";
import { HelpModal } from "@/components/UI/HelpModal";
import { ColumnOrderManager } from "@/components/UI/ColumnOrderManager";
import { PageSkeleton } from "@/components/UI/Skeleton";
import { useUndo } from "@/contexts/UndoContext";
import { BoardItem, FilterType } from "@/types";
import { createPortal } from "react-dom";

type ViewMode = "day" | "week";

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

  const shortDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (dateOnly.getTime() === today.getTime()) {
    return `Today · ${shortDate}`;
  } else if (dateOnly.getTime() === tomorrow.getTime()) {
    return `Tomorrow · ${shortDate}`;
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return `Yesterday · ${shortDate}`;
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
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

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
              ? "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/70"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50 w-72 animate-slideDown">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {monthNames[viewDate.month]} {viewDate.year}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((name) => (
          <div key={name} className="w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>

      {/* Quick actions */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <button
          onClick={() => {
            onSelectDate(todayStr);
            onClose();
          }}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-md transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
            onSelectDate(tomorrowStr);
            onClose();
          }}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          Tomorrow
        </button>
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const { data: session } = useSession();
  const { shortcuts, updateShortcut, resetShortcuts } = useShortcuts();
  const [showLogoMenu, setShowLogoMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedSettingsTab, setSelectedSettingsTab] = useState<string>("appearance");
  const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const logoMenuRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedItem, setSelectedItem] = useState<BoardItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskNotes, setNewTaskNotes] = useState("");
  const [newTaskLabels, setNewTaskLabels] = useState<string[]>([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventStartTime, setNewEventStartTime] = useState("09:00");
  const [newEventEndTime, setNewEventEndTime] = useState("10:00");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventAllDay, setNewEventAllDay] = useState(true);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [snoozeDeleteConfirm, setSnoozeDeleteConfirm] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkCalendar, setShowBulkCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const bulkCalendarRef = useRef<HTMLDivElement>(null);

  const {
    columns,
    items,
    cardCategories,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    labels,
    itemLabels,
    selectedLabelFilters,
    setSelectedLabelFilters,
    getItemsForColumn,
    moveItem,
    rescheduleItem,
    bulkTransferItems,
    addColumn,
    updateColumn,
    deleteColumn,
    deleteTask,
    createTask,
    createEvent,
    trashItem,
    restoreItem,
    permanentlyDeleteItem,
    uncompleteTask,
    isItemTrashed,
    getTrashedItemPreviousColumn,
    createLabel,
    toggleItemLabel,
    getLabelsForItem,
    refresh,
  } = useBoard();

  // Undo system
  const { addUndo } = useUndo();

  // Debounced search: local input value updates instantly (no lag in the field),
  // but setSearchQuery (which triggers getItemsForColumn recomputation) fires
  // only after 200ms of inactivity — prevents a full re-filter on every keystroke.
  const [searchInputValue, setSearchInputValue] = useState(searchQuery);
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInputValue), 200);
    return () => clearTimeout(t);
  }, [searchInputValue, setSearchQuery]);

  // Label filter toggle
  const handleLabelFilterToggle = useCallback((labelId: string) => {
    setSelectedLabelFilters(prev =>
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  }, [setSelectedLabelFilters]);

  // Memoize refresh callbacks to prevent infinite re-renders
  const handleCalendarUpdate = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleTaskUpdate = useCallback(() => {
    refresh();
  }, [refresh]);

  // Real-time sync - auto-refresh when Google Calendar/Tasks change
  useRealTimeSync({
    onCalendarUpdate: handleCalendarUpdate,
    onTaskUpdate: handleTaskUpdate,
    enabled: !loading,
    pollingInterval: 120000, // Poll every 2 minutes (SSE handles real-time updates)
  });

  // Onboarding tour
  const onboarding = useOnboarding();

  const [showSearchModal, setShowSearchModal] = useState(false);
  const searchModalInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  const { showHelp, setShowHelp } = useKeyboardShortcuts({
    onNewTask: () => setShowTaskModal(true),
    onNewEvent: () => setShowAddEvent(true),
    onToday: () => setSelectedDate(formatDateString(new Date())),
    onPreviousDay: () => {
      const date = new Date(selectedDate + "T12:00:00");
      date.setDate(date.getDate() - (viewMode === "week" ? 7 : 1));
      setSelectedDate(formatDateString(date));
    },
    onNextDay: () => {
      const date = new Date(selectedDate + "T12:00:00");
      date.setDate(date.getDate() + (viewMode === "week" ? 7 : 1));
      setSelectedDate(formatDateString(date));
    },
    onFocusSearch: () => setShowSearchModal(true),
    onRefresh: refresh,
    onToggleView: () => setViewMode((prev) => (prev === "day" ? "week" : "day")),
    enabled: !loading && !showTaskModal && !showAddEvent && !sidebarOpen && !showSearchModal,
  });

  // Format date string helper (moved before usage)
  const formatDateString = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  // Close logo menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (logoMenuRef.current && !logoMenuRef.current.contains(e.target as Node)) {
        setShowLogoMenu(false);
      }
    };
    if (showLogoMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLogoMenu]);

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

  // Close bulk calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bulkCalendarRef.current && !bulkCalendarRef.current.contains(event.target as Node)) {
        setShowBulkCalendar(false);
      }
    }

    if (showBulkCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showBulkCalendar]);

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

    // Check if dropping in week view (date-based droppable)
    if (destination.droppableId.startsWith("week-")) {
      const newDate = destination.droppableId.replace("week-", "");
      rescheduleItem(draggableId, newDate);
    } else {
      // Block dropping events into Tasks column and tasks into Events column
      const draggedItem = items.find((i) => i.id === draggableId);
      const destColumn = columns.find((c) => c.id === destination.droppableId);
      if (draggedItem && destColumn) {
        const destName = destColumn.name.toLowerCase();
        if (draggedItem.type === "task" && destName === "events") return;
        if (draggedItem.type === "event" && destName === "tasks") return;
      }

      // Regular column-based drop
      moveItem(draggableId, destination.droppableId);
    }
  };

  const handlePreviousDay = () => {
    const date = new Date(selectedDate + "T12:00:00");
    date.setDate(date.getDate() - 1);
    setSelectedDate(formatDateString(date));
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate + "T12:00:00");
    date.setDate(date.getDate() + 1);
    setSelectedDate(formatDateString(date));
  };

  const handleToday = () => {
    setSelectedDate(formatDateString(new Date()));
  };

  // Selection mode handlers
  const handleEnableSelect = () => {
    setSelectionMode(true);
    setSelectedItems(new Set());
  };

  const handleSelectAll = (columnItems: BoardItem[]) => {
    setSelectionMode(true);
    setSelectedItems(new Set(columnItems.filter((i) => i.type === "task").map((i) => i.id)));
  };

  const handleCancelSelect = () => {
    setSelectionMode(false);
    setSelectedItems(new Set());
    setShowBulkCalendar(false);
  };

  const handleToggleSelect = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleBulkTransfer = () => {
    if (selectedItems.size === 0) return;
    setShowBulkCalendar(true);
  };

  const handleBulkDateSelect = async (date: string) => {
    await bulkTransferItems(Array.from(selectedItems), date);
    setShowBulkCalendar(false);
    setSelectionMode(false);
    setSelectedItems(new Set());
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;

    setIsCreatingTask(true);
    try {
      const taskDate = newTaskDueDate || selectedDate;
      await createTask(newTaskTitle.trim(), taskDate, newTaskNotes.trim() || undefined, newTaskLabels);
      // Reset form
      setNewTaskTitle("");
      setNewTaskDueDate("");
      setNewTaskNotes("");
      setNewTaskLabels([]);
      setShowTaskModal(false);
      setShowAddTask(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setNewTaskTitle("");
    setNewTaskDueDate("");
    setNewTaskNotes("");
    setNewTaskLabels([]);
  };

  const handleCreateEvent = async () => {
    if (!newEventTitle.trim()) return;

    setIsCreatingEvent(true);
    try {
      const eventDate = newEventDate || selectedDate;
      await createEvent(
        newEventTitle.trim(),
        eventDate,
        newEventAllDay ? undefined : newEventStartTime,
        newEventAllDay ? undefined : newEventEndTime,
        newEventAllDay,
        newEventLocation.trim() || undefined,
        newEventDescription.trim() || undefined
      );
      // Reset form
      setNewEventTitle("");
      setNewEventDate("");
      setNewEventStartTime("09:00");
      setNewEventEndTime("10:00");
      setNewEventLocation("");
      setNewEventDescription("");
      setNewEventAllDay(true);
      setShowAddEvent(false);
    } catch (error) {
      console.error("Failed to create event:", error);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const closeEventModal = () => {
    setShowAddEvent(false);
    setNewEventTitle("");
    setNewEventDate("");
    setNewEventStartTime("09:00");
    setNewEventEndTime("10:00");
    setNewEventLocation("");
    setNewEventDescription("");
    setNewEventAllDay(true);
  };

  // Quick action handlers
  const handleQuickComplete = useCallback(async (itemId: string) => {
    // Find the Done column
    const doneColumn = columns.find((c) => c.name.toLowerCase() === "done");
    if (!doneColumn) {
      console.error("No Done column found");
      return;
    }

    // Move item to Done column (this handles Google sync automatically)
    await moveItem(itemId, doneColumn.id);
  }, [columns, moveItem]);

  const handleQuickTrash = useCallback(async (itemId: string) => {
    // Check if item is already in trash - if so, ask for permanent delete confirmation
    if (isItemTrashed(itemId)) {
      // Check if user snoozed the confirmation (stored in localStorage)
      const snoozeUntil = localStorage.getItem("deleteConfirmSnoozeUntil");
      if (snoozeUntil && new Date(snoozeUntil) > new Date()) {
        // Snoozed - delete without confirmation
        await permanentlyDeleteItem(itemId);
        return;
      }
      // Show confirmation modal
      setItemToDelete(itemId);
      setShowDeleteConfirm(true);
      return;
    }

    // Get item info for undo
    const item = items.find(i => i.id === itemId);
    const itemTitle = item?.title || "Item";

    await trashItem(itemId);

    // Add undo action
    addUndo({
      type: "trash",
      description: `Moved "${itemTitle}" to trash`,
      undo: async () => {
        await restoreItem(itemId);
      },
    });
  }, [trashItem, isItemTrashed, permanentlyDeleteItem, items, addUndo, restoreItem]);

  const handleConfirmPermanentDelete = useCallback(async () => {
    if (!itemToDelete) return;

    // If snooze is checked, set localStorage for 1 day
    if (snoozeDeleteConfirm) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      localStorage.setItem("deleteConfirmSnoozeUntil", tomorrow.toISOString());
    }

    await permanentlyDeleteItem(itemToDelete);
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    setSnoozeDeleteConfirm(false);
  }, [itemToDelete, snoozeDeleteConfirm, permanentlyDeleteItem]);

  const handleCancelPermanentDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    setSnoozeDeleteConfirm(false);
  }, []);

  if (loading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md animate-slideUp">
          <h3 className="text-red-800 dark:text-red-300 font-semibold mb-2">Error</h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors btn-hover"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="h-full flex flex-col transition-theme" style={{background: "linear-gradient(135deg, #d4a017 0%, #8b6914 30%, #2d5a1b 65%, #0f2d0a 100%)"}}>
      {/* Toolbar */}
      <div className="glass-toolbar px-4 py-2 flex items-center justify-between gap-2 transition-theme">
        {/* Left: all controls */}
        <div className="flex items-center gap-3 flex-wrap">

          <button
            onClick={handlePreviousDay}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg border border-gray-200 dark:border-white/10 transition-all backdrop-blur-sm"
            title="Previous day (←)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/20 rounded-lg border border-orange-200 dark:border-orange-500/30 transition-all backdrop-blur-sm hover:shadow-lg hover:shadow-orange-500/10"
              title="Jump to today (T)"
            >
              Today
            </button>
            <div className="relative" ref={calendarRef}>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {formatDisplayDate(selectedDate)}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showCalendar ? "rotate-180" : ""}`}
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
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg border border-gray-200 dark:border-white/10 transition-all backdrop-blur-sm"
            title="Next day (→)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Add Task + Add Event */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTaskModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-orange-500/90 rounded-lg hover:bg-orange-500 transition-all btn-hover backdrop-blur-sm border border-orange-400/30 hover:shadow-lg hover:shadow-orange-500/20"
              title="New task (N)"
            >
              Task
            </button>

            <button
              onClick={() => setShowAddEvent(true)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500/90 rounded-lg hover:bg-blue-500 transition-all btn-hover backdrop-blur-sm border border-blue-400/30 hover:shadow-lg hover:shadow-blue-500/20"
              title="New event (E)"
            >
              Event
            </button>
          </div>

          {/* View Mode Toggle - Mobile only */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={() => setViewMode("day")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "day"
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
              title="Day view (W)"
            >
              D
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "week"
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
              title="Week view (W)"
            >
              W
            </button>
          </div>

          {/* Mobile Search Bar - visible only on small screens */}
          <div className="flex md:hidden items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 flex-1 max-w-xs">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 outline-none flex-1"
            />
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 dark:bg-white/20 ml-2 hidden sm:block" />

          {/* Filter by Tag */}
          <FilterBar
            labels={labels}
            selectedLabelIds={selectedLabelFilters}
            onLabelFilterChange={handleLabelFilterToggle}
          />

        </div>

        {/* Right: Logo + menu + User avatar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Logo + menu */}
          <div className="relative flex items-center gap-2" ref={logoMenuRef}>
            <button
              onClick={() => setShowLogoMenu((v) => !v)}
              className="w-8 h-8 bg-white/15 hover:bg-white/25 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg flex items-center justify-center border border-white/20 dark:border-white/15 shadow transition-all hover:scale-105"
              title="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="#f5a623" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
                <line x1="3" y1="9" x2="21" y2="9" strokeWidth={2} />
                <line x1="8" y1="2" x2="8" y2="5" strokeWidth={2} strokeLinecap="round" />
                <line x1="16" y1="2" x2="16" y2="5" strokeWidth={2} strokeLinecap="round" />
                <circle cx="8" cy="13.5" r="1" fill="#f5a623" stroke="none" />
                <circle cx="12" cy="13.5" r="1" fill="#f5a623" stroke="none" />
                <circle cx="16" cy="13.5" r="1" fill="#f5a623" stroke="none" />
                <circle cx="8" cy="17.5" r="1" fill="#f5a623" stroke="none" />
                <circle cx="12" cy="17.5" r="1" fill="#f5a623" stroke="none" />
                <circle cx="16" cy="17.5" r="1" fill="#f5a623" stroke="none" />
              </svg>
            </button>
            <h1 className="text-lg font-extrabold tracking-tight hidden sm:block" style={{ color: '#f5a623' }}>
              <span className="inline-block" style={{ transform: 'rotate(-20deg) translateX(-2px)' }}>C</span>alimbus
            </h1>

            {showLogoMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-xl shadow-2xl border border-white/10 overflow-hidden z-[9999] animate-slideDown"
                style={{ background: "linear-gradient(to bottom, #1a1a2e, #0f0f1f)" }}>
                <button
                  onClick={() => { setShowLogoMenu(false); setShowSettingsModal(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
                <button
                  onClick={() => { setShowLogoMenu(false); setShowHelpModal(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Help
                </button>
                <div className="border-t border-white/10" />
                <button
                  onClick={() => { setShowLogoMenu(false); signOut({ callbackUrl: "/" }); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log Out
                </button>
              </div>
            )}
          </div>

          {/* User avatar + name */}
          {session?.user && (
            <>
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={28}
                  height={28}
                  className="rounded-full ring-2 ring-white/30"
                />
              )}
              <span className="text-sm font-medium hidden sm:block text-gray-700 dark:text-gray-200 opacity-90">
                {session.user.name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        {viewMode === "day" ? (
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
                    onQuickComplete={handleQuickComplete}
                    onQuickTrash={handleQuickTrash}
                    selectionMode={selectionMode}
                    selectedItems={selectedItems}
                    onToggleSelect={handleToggleSelect}
                    onEnableSelect={handleEnableSelect}
                    onSelectAll={(items) => handleSelectAll(items)}
                    onCancelSelect={handleCancelSelect}
                    onBulkTransfer={handleBulkTransfer}
                    getLabelsForItem={getLabelsForItem}
                  />
                ))}
              <AddColumnButton onAddColumn={addColumn} />
            </div>
          </div>
        ) : (
          <WeekView
            columns={columns}
            items={items}
            cardCategories={cardCategories}
            selectedDate={selectedDate}
            onItemClick={handleItemClick}
            onQuickComplete={handleQuickComplete}
            onQuickTrash={handleQuickTrash}
            searchQuery={searchQuery}
            selectedLabelFilters={selectedLabelFilters}
            itemLabels={itemLabels}
          />
        )}
      </DragDropContext>

      {/* Selection Mode Floating Bar */}
      {selectionMode && (
        <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-lg z-40">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {selectedItems.size} task{selectedItems.size !== 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelSelect}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkTransfer}
              disabled={selectedItems.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Bulk Transfer ({selectedItems.size})
            </button>
          </div>
        </div>
      )}
    </div>

      {/* Item Sidebar */}
      <ItemSidebar
        item={selectedItem}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        onDeleteTask={deleteTask}
        onTrashItem={trashItem}
        onRestoreItem={restoreItem}
        onUncompleteTask={uncompleteTask}
        onQuickComplete={handleQuickComplete}
        isItemTrashed={isItemTrashed}
        getTrashedItemPreviousColumn={getTrashedItemPreviousColumn}
        labels={labels}
        itemLabelIds={selectedItem ? (getLabelsForItem(selectedItem.id).map(l => l.id)) : []}
        onToggleLabel={toggleItemLabel}
        onCreateLabel={createLabel}
      />

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-slideUp">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New Event</h2>
              <button
                onClick={closeEventModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Enter event title..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-theme"
                  autoFocus
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newEventDate || selectedDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-theme"
                />
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={newEventAllDay}
                  onChange={(e) => setNewEventAllDay(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="allDay" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  All day event
                </label>
              </div>

              {/* Time (only shown if not all-day) */}
              {!newEventAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newEventStartTime}
                      onChange={(e) => setNewEventStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-theme"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newEventEndTime}
                      onChange={(e) => setNewEventEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-theme"
                    />
                  </div>
                </div>
              )}

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder="Enter location..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-theme"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  placeholder="Enter description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-theme"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
              <button
                onClick={closeEventModal}
                disabled={isCreatingEvent}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={!newEventTitle.trim() || isCreatingEvent}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors btn-hover"
              >
                {isCreatingEvent ? "Creating..." : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Transfer Calendar Modal */}
      {showBulkCalendar && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 animate-fadeIn">
          <div ref={bulkCalendarRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 animate-slideUp">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Transfer {selectedItems.size} task{selectedItems.size !== 1 ? "s" : ""} to...
              </h2>
              <button
                onClick={() => setShowBulkCalendar(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 [&>div>div]:static [&>div>div]:shadow-none [&>div>div]:border-0 [&>div>div]:mt-0 [&>div>div]:w-full">
              <div className="relative">
                <CalendarDropdown
                  selectedDate={selectedDate}
                  onSelectDate={(date) => handleBulkDateSelect(date)}
                  onClose={() => setShowBulkCalendar(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-slideUp">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New Task</h2>
              <button
                onClick={closeTaskModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTaskTitle.trim()) handleCreateTask();
                    if (e.key === "Escape") closeTaskModal();
                  }}
                  placeholder="Enter task title..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-theme"
                  autoFocus
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTaskDueDate || selectedDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-theme"
                />
              </div>

              {/* Notes/Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  placeholder="Enter notes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-theme"
                />
              </div>

              {/* Labels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Labels
                </label>
                <LabelPicker
                  labels={labels}
                  selectedLabelIds={newTaskLabels}
                  onToggleLabel={(labelId) => {
                    setNewTaskLabels(prev =>
                      prev.includes(labelId)
                        ? prev.filter(id => id !== labelId)
                        : [...prev, labelId]
                    );
                  }}
                  onCreateLabel={createLabel}
                  compact={true}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
              <button
                onClick={closeTaskModal}
                disabled={isCreatingTask}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim() || isCreatingTask}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors btn-hover"
              >
                {isCreatingTask ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      {/* Floating Search Modal */}
      {showSearchModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-start justify-center z-[9998] pt-[20vh]"
          onClick={() => { setShowSearchModal(false); setSearchInputValue(""); setSearchQuery(""); }}
        >
          <div
            className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/10">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchModalInputRef}
                type="text"
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") { setShowSearchModal(false); setSearchInputValue(""); setSearchQuery(""); } }}
                placeholder="Search tasks and events..."
                className="flex-1 text-base bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
                autoFocus
              />
              {searchInputValue && (
                <button
                  onClick={() => { setSearchInputValue(""); setSearchQuery(""); }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {/* Results or hint */}
            <div className="px-4 py-3">
              {searchInputValue ? (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {items
                    .filter(item => item.title.toLowerCase().includes(searchInputValue.toLowerCase()))
                    .slice(0, 8)
                    .map(item => (
                      <button
                        key={item.id}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left"
                        onClick={() => {
                          setShowSearchModal(false);
                          // Keep search active on board so items are filtered
                        }}
                      >
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${item.type === "task" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"}`}>
                          {item.type === "task" ? "Task" : "Event"}
                        </span>
                        <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{item.title}</span>
                      </button>
                    ))}
                  {items.filter(item => item.title.toLowerCase().includes(searchInputValue.toLowerCase())).length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No results found</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">Type to search across all tasks and events</p>
              )}
            </div>
            <div className="px-4 py-2 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500">Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-white/10 rounded border border-gray-200 dark:border-white/10">Esc</kbd> to close</span>
              {searchInputValue && (
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                >
                  Filter board →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl w-full max-w-4xl mx-4 h-[80vh] flex overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            {/* Left Sidebar */}
            <div className="w-64 bg-gray-50 dark:bg-[#151525] border-r border-gray-200 dark:border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </h3>
              </div>
              <nav className="flex-1 overflow-y-auto p-2">
                {(["appearance","board","notifications","keyboard","data","about"] as const).map((tab) => (
                  <button key={tab} onClick={() => setSelectedSettingsTab(tab)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${selectedSettingsTab === tab ? "bg-orange-500 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"}`}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace("keyboard","Keyboard Shortcuts").replace("data","Data & Privacy")}
                  </button>
                ))}
              </nav>
            </div>
            {/* Right Content */}
            <div className="flex-1 flex flex-col bg-white dark:bg-[#1a1a2e]">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                  {selectedSettingsTab === "keyboard" ? "Keyboard Shortcuts" : selectedSettingsTab === "data" ? "Data & Privacy" : selectedSettingsTab === "about" ? "About Calimbus" : selectedSettingsTab === "board" ? "Board Preferences" : selectedSettingsTab.charAt(0).toUpperCase() + selectedSettingsTab.slice(1)}
                </h2>
                <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {selectedSettingsTab === "board" && (
                  <div className="space-y-6 max-w-2xl">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Column Order</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Drag to reorder your columns. The board will update automatically.</p>
                      <ColumnOrderManager />
                    </div>
                  </div>
                )}
                {selectedSettingsTab === "keyboard" && (
                  <div className="space-y-6 max-w-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Click a key to rebind it.</p>
                      </div>
                      <button onClick={() => { resetShortcuts(); setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1500); }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        Reset to defaults
                      </button>
                    </div>
                    {savedFlash && <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Shortcuts saved!</div>}
                    {["navigation","actions"].map(cat => (
                      <div key={cat}>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">{cat.charAt(0).toUpperCase()+cat.slice(1)}</h4>
                        <div className="space-y-1">
                          {shortcuts.filter(s => s.category === cat).map(shortcut => (
                            <div key={shortcut.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-[#1f1f35] border border-gray-200 dark:border-gray-700">
                              <span className="text-sm text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                              {shortcut.fixed ? (
                                <kbd className="px-2.5 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg cursor-not-allowed opacity-60">{shortcut.key}</kbd>
                              ) : editingShortcutId === shortcut.id ? (
                                <div className="px-2.5 py-1 text-xs font-semibold bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-400 rounded-lg text-orange-600 dark:text-orange-300 min-w-[60px] text-center cursor-pointer outline-none animate-pulse"
                                  tabIndex={0} autoFocus
                                  onKeyDown={(e) => { e.preventDefault(); e.stopPropagation(); if(e.key==="Escape"){setEditingShortcutId(null);return;} updateShortcut(shortcut.id,e.key===" "?"Space":e.key); setEditingShortcutId(null); setSavedFlash(true); setTimeout(()=>setSavedFlash(false),1500); }}
                                  onBlur={() => setEditingShortcutId(null)}>Press a key…</div>
                              ) : (
                                <kbd onClick={() => setEditingShortcutId(shortcut.id)}
                                  className="px-2.5 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-lg cursor-pointer hover:border-orange-400 hover:text-orange-500 transition-colors min-w-[40px] text-center" title="Click to rebind">
                                  {shortcut.key===" "?"Space":shortcut.key.length===1?shortcut.key.toUpperCase():shortcut.key}
                                </kbd>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {(selectedSettingsTab === "appearance" || selectedSettingsTab === "notifications") && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Coming Soon</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">This feature will be available in a future update.</p>
                  </div>
                )}
                {selectedSettingsTab === "data" && (
                  <div className="space-y-6 max-w-2xl">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Your Data</h3>
                      <div className="bg-gray-100 dark:bg-[#1f1f35] rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                        <div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center"><svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div><div><p className="text-sm font-medium text-gray-700 dark:text-gray-200">Google Calendar & Tasks</p><p className="text-xs text-gray-500 dark:text-gray-400">Accessed via Google APIs, never stored</p></div></div>
                        <div className="flex items-center gap-3"><div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center"><svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg></div><div><p className="text-sm font-medium text-gray-700 dark:text-gray-200">Notes, Columns & Labels</p><p className="text-xs text-gray-500 dark:text-gray-400">Stored securely in Supabase</p></div></div>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6"><h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Privacy Policy</h3><p className="text-sm text-gray-600 dark:text-gray-400">Calimbus only accesses your Google Calendar and Tasks data to display it on your board. We never store, share, or sell your calendar data.</p></div>
                  </div>
                )}
                {selectedSettingsTab === "about" && (
                  <div className="space-y-6 max-w-2xl">
                    <div><h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Version</h3><p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Calimbus v1.5.1</p><p className="text-sm text-gray-600 dark:text-gray-400">A Google Calendar + Kanban integration</p></div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6"><h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">What&apos;s New</h3><ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400"><li className="flex items-start gap-2"><span className="text-orange-500">•</span><span>Added Labels, Filters, and Undo functionality</span></li><li className="flex items-start gap-2"><span className="text-orange-500">•</span><span>Improved dark mode text visibility</span></li><li className="flex items-start gap-2"><span className="text-orange-500">•</span><span>Added comprehensive Settings menu</span></li></ul></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Onboarding Tour */}
      <OnboardingOverlay
        isActive={onboarding.isActive}
        step={onboarding.step}
        currentStep={onboarding.currentStep}
        totalSteps={onboarding.totalSteps}
        onNext={onboarding.nextStep}
        onPrev={onboarding.prevStep}
        onSkip={onboarding.skipOnboarding}
      />

      {/* Permanent Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={handleCancelPermanentDelete}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Permanently?</h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This item will be permanently deleted and cannot be recovered.
            </p>

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={snoozeDeleteConfirm}
                onChange={(e) => setSnoozeDeleteConfirm(e.target.checked)}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Don&apos;t ask again for 1 day</span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={handleCancelPermanentDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPermanentDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
