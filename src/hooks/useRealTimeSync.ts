"use client";

import { useEffect, useRef, useState } from "react";

interface RealTimeSyncOptions {
  onCalendarUpdate: () => void;
  onTaskUpdate: () => void;
  enabled?: boolean;
  pollingInterval?: number;
}

export function useRealTimeSync({
  onCalendarUpdate,
  onTaskUpdate,
  enabled = true,
  pollingInterval = 10000,
}: RealTimeSyncOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const onCalendarUpdateRef = useRef(onCalendarUpdate);
  const onTaskUpdateRef = useRef(onTaskUpdate);

  useEffect(() => {
    onCalendarUpdateRef.current = onCalendarUpdate;
    onTaskUpdateRef.current = onTaskUpdate;
  }, [onCalendarUpdate, onTaskUpdate]);

  // Simple polling
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      onCalendarUpdateRef.current();
      onTaskUpdateRef.current();
      setLastUpdate(new Date());
    }, pollingInterval);

    return () => clearInterval(intervalId);
  }, [enabled, pollingInterval]);

  // Refresh on window focus
  useEffect(() => {
    if (!enabled) return;

    const handleFocus = () => {
      onCalendarUpdateRef.current();
      onTaskUpdateRef.current();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [enabled]);

  // SSE connection for real-time updates
  useEffect(() => {
    if (!enabled) return;

    let eventSource: EventSource | null = null;

    const connect = () => {
      eventSource = new EventSource("/api/webhooks/events");

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "calendar_update") {
            setLastUpdate(new Date());
            onCalendarUpdateRef.current();
          } else if (data.type === "task_update") {
            setLastUpdate(new Date());
            onTaskUpdateRef.current();
          }
        } catch {
          // Silently ignore parse errors
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
    };
  }, [enabled]);

  return {
    isConnected,
    lastUpdate,
  };
}
