"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PagerDutyIncident } from "@/lib/types";

type PermissionState = "default" | "granted" | "denied";

export function useNotifications() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission as PermissionState);
    }
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    if (mountedRef.current) {
      setPermission(result as PermissionState);
    }
  }, []);

  const notify = useCallback(
    (incident: PagerDutyIncident) => {
      if (permission !== "granted") return;
      try {
        const urgencyTag =
          incident.urgency === "high" ? "🔴 HIGH" : "🟡 LOW";
        new Notification(
          `${urgencyTag} — ${incident.title}`,
          {
            body: `Service: ${incident.service.summary}\nStatus: ${incident.status}`,
            tag: incident.id,
            icon: "/favicon.ico",
          }
        );
      } catch {
        // Notification may fail in some environments
      }
    },
    [permission]
  );

  return {
    permission,
    requestPermission,
    notify,
    isSupported: typeof Notification !== "undefined",
  };
}
