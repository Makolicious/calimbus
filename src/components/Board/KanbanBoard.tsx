"use client";

import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useBoard } from "@/hooks/useBoard";
import { Column } from "./Column";
import { AddColumnButton } from "./AddColumnButton";
import { ItemSidebar } from "./ItemSidebar";
import { BoardItem } from "@/types";

export function KanbanBoard() {
  const [selectedItem, setSelectedItem] = useState<BoardItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    columns,
    loading,
    error,
    getItemsForColumn,
    moveItem,
    addColumn,
    updateColumn,
    deleteColumn,
    refresh,
  } = useBoard();

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
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {columns.reduce(
              (acc, col) => acc + getItemsForColumn(col.id).length,
              0
            )}{" "}
            items
          </span>
        </div>
        <button
          onClick={refresh}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
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
      />
    </>
  );
}
