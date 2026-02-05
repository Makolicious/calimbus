"use client";

import { useEffect, useRef, useCallback, useState } from "react";

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
  pollingInterval = 60000, // Default: poll every 60 seconds as fallback
}: RealTimeSyncOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Subscribe to Google Calendar webhooks
  const subscribeToWebhooks = useCallback(async () => {
    try {
      const response = await fetch("/api/webhooks/subscribe", {
        method: "POST",
      });

      if (response.ok) {
        console.log("Subscribed to calendar webhooks");
        return true;
      } else {
        console.warn("Failed to subscribe to webhooks, will use polling");
        return false;
      }
    } catch (error) {
      console.warn("Webhook subscription error:", error);
      return false;
    }
  }, []);

  // Connect to SSE endpoint for real-time updates
  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource("/api/webhooks/events");

    eventSource.onopen = () => {
      console.log("SSE connection established");
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          console.log("SSE connected");
        } else if (data.type === "heartbeat") {
          // Just keep-alive, no action needed
        } else if (data.type === "calendar_update") {
          console.log("Calendar update received via SSE");
          setLastUpdate(new Date());
          onCalendarUpdate();
        } else if (data.type === "task_update") {
          console.log("Task update received via SSE");
          setLastUpdate(new Date());
          onTaskUpdate();
        }
      } catch (error) {
        console.error("SSE message parse error:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      setIsConnected(false);

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (enabled) {
          connectSSE();
        }
      }, 5000);
    };

    eventSourceRef.current = eventSource;
  }, [enabled, onCalendarUpdate, onTaskUpdate]);

  // Fallback polling for when webhooks/SSE aren't available
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(() => {
      // Check for pending updates
      fetch("/api/webhooks/check-updates")
        .then((res) => res.json())
        .then((data) => {
          if (data.hasCalendarUpdate) {
            onCalendarUpdate();
          }
          if (data.hasTaskUpdate) {
            onTaskUpdate();
          }
        })
        .catch((error) => {
          console.warn("Polling check error:", error);
        });
    }, pollingInterval);
  }, [pollingInterval, onCalendarUpdate, onTaskUpdate]);

  // Initialize real-time sync
  useEffect(() => {
    if (!enabled) return;

    // Try to set up webhooks and SSE
    const initSync = async () => {
      // Subscribe to webhooks (for server-side notifications)
      await subscribeToWebhooks();

      // Connect to SSE (for client-side real-time updates)
      connectSSE();

      // Also start polling as a fallback
      startPolling();
    };

    initSync();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [enabled, subscribeToWebhooks, connectSSE, startPolling]);

  // Refresh on window focus
  useEffect(() => {
    if (!enabled) return;

    const handleFocus = () => {
      console.log("Window focused, checking for updates");
      onCalendarUpdate();
      onTaskUpdate();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [enabled, onCalendarUpdate, onTaskUpdate]);

  return {
    isConnected,
    lastUpdate,
  };
}
