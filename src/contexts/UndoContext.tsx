"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { UndoAction } from "@/types";

interface UndoContextType {
  undoStack: UndoAction[];
  addUndo: (action: Omit<UndoAction, 'id' | 'timestamp'>) => void;
  performUndo: () => Promise<void>;
  clearUndo: () => void;
  currentToast: UndoAction | null;
  dismissToast: () => void;
}

const UndoContext = createContext<UndoContextType | null>(null);

const UNDO_TIMEOUT = 10000; // 10 seconds

export function UndoProvider({ children }: { children: ReactNode }) {
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [currentToast, setCurrentToast] = useState<UndoAction | null>(null);
  const [toastTimeout, setToastTimeout] = useState<NodeJS.Timeout | null>(null);

  const addUndo = useCallback((action: Omit<UndoAction, 'id' | 'timestamp'>) => {
    const newAction: UndoAction = {
      ...action,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };

    setUndoStack((prev) => [...prev.slice(-9), newAction]); // Keep last 10 actions
    setCurrentToast(newAction);

    // Clear previous timeout
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    // Auto-dismiss after timeout
    const timeout = setTimeout(() => {
      setCurrentToast(null);
    }, UNDO_TIMEOUT);
    setToastTimeout(timeout);
  }, [toastTimeout]);

  const performUndo = useCallback(async () => {
    if (!currentToast) return;

    try {
      await currentToast.undo();
      setUndoStack((prev) => prev.filter((a) => a.id !== currentToast.id));
      setCurrentToast(null);
      if (toastTimeout) {
        clearTimeout(toastTimeout);
      }
    } catch (error) {
      console.error("Failed to undo:", error);
    }
  }, [currentToast, toastTimeout]);

  const clearUndo = useCallback(() => {
    setUndoStack([]);
    setCurrentToast(null);
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
  }, [toastTimeout]);

  const dismissToast = useCallback(() => {
    setCurrentToast(null);
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
  }, [toastTimeout]);

  return (
    <UndoContext.Provider
      value={{
        undoStack,
        addUndo,
        performUndo,
        clearUndo,
        currentToast,
        dismissToast,
      }}
    >
      {children}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error("useUndo must be used within an UndoProvider");
  }
  return context;
}
