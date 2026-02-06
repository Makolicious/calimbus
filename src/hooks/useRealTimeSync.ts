"use client";

import { useEffect, useRef, useState } from "react";

interface RealTimeSyncOptions {
  onCalendarUpdate: () => void;
  onTaskUpdate: () => void;
  enabled?: boolean;
  pollingInterval?: number; // Fallback polling interval in ms
}

export function useRealTimeSync({
  onCalendarUpdate,
  onTaskUpdate,
  enabled = true,
  pollingInterval = 10000, // Default: poll every 10 seconds
}: RealTimeSyncOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Use refs for callbacks to always have latest version
  const onCalendarUpdateRef = useRef(onCalendarUpdate);
  const onTaskUpdateRef = useRef(onTaskUpdate);

  // Keep refs updated
  useEffect(() => {
    onCalendarUpdateRef.current = onCalendarUpdate;
    onTaskUpdateRef.current = onTaskUpdate;
  }, [onCalendarUpdate, onTaskUpdate]);

  // Simple polling - runs independently
  useEffect(() => {
    if (!enabled) return;

    console.log(`Starting polling with interval: ${pollingInterval}ms`);

    const intervalId = setInterval(() => {
      console.log("Polling: refreshing data from Google");
      onCalendarUpdateRef.current();
      onTaskUpdateRef.current();
      setLastUpdate(new Date());
    }, pollingInterval);

    return () => {
      console.log("Stopping polling");
      clearInterval(intervalId);
    };
  }, [enabled, pollingInterval]);

  // Refresh on window focus
  useEffect(() => {
    if (!enabled) return;

    const handleFocus = () => {
      console.log("Window focused, checking for updates");
      onCalendarUpdateRef.current();
      onTaskUpdateRef.current();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [enabled]);

  // SSE connection for real-time updates (optional enhancement)
  useEffect(() => {
    if (!enabled) return;

    let eventSource: EventSource | null = null;

    const connect = () => {
      eventSource = new EventSource("/api/webhooks/events");

      eventSource.onopen = () => {
        console.log("SSE connection established");
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "calendar_update") {
            console.log("Calendar update received via SSE");
            setLastUpdate(new Date());
            onCalendarUpdateRef.current();
          } else if (data.type === "task_update") {
            console.log("Task update received via SSE");
            setLastUpdate(new Date());
            onTaskUpdateRef.current();
          }
        } catch (error) {
          console.error("SSE message parse error:", error);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
        // Reconnect after 5 seconds
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
