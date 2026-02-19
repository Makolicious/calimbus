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
  pollingInterval = 120000,
}: RealTimeSyncOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const onCalendarUpdateRef = useRef(onCalendarUpdate);
  const onTaskUpdateRef = useRef(onTaskUpdate);
  // Track when we last ran a full refresh so focus handler can throttle
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    onCalendarUpdateRef.current = onCalendarUpdate;
    onTaskUpdateRef.current = onTaskUpdate;
  }, [onCalendarUpdate, onTaskUpdate]);

  const doRefresh = () => {
    lastRefreshRef.current = Date.now();
    onCalendarUpdateRef.current();
    onTaskUpdateRef.current();
    setLastUpdate(new Date());
  };

  // Polling — pauses automatically when the tab is hidden (Page Visibility API)
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      // Skip the poll if the page is not visible (tab in background)
      if (document.visibilityState === "hidden") return;
      doRefresh();
    }, pollingInterval);

    return () => clearInterval(intervalId);
  }, [enabled, pollingInterval]);

  // Refresh on window focus — throttled so it won't double-fire within 30s of a poll
  useEffect(() => {
    if (!enabled) return;

    const handleFocus = () => {
      const msSinceLastRefresh = Date.now() - lastRefreshRef.current;
      // Only refresh on focus if we haven't refreshed in the last 2 minutes
      if (msSinceLastRefresh > 120_000) {
        doRefresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [enabled]);

  // SSE connection for real-time updates
  useEffect(() => {
    if (!enabled) return;

    let eventSource: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

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
        retryTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [enabled]);

  return {
    isConnected,
    lastUpdate,
  };
}
