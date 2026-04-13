"use client";

import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationBanner() {
  const { permission, requestPermission, isSupported } = useNotifications();

  if (!isSupported || permission === "granted") return null;

  if (permission === "denied") {
    return (
      <div className="border-b bg-muted px-4 py-2">
        <div className="container mx-auto flex items-center gap-2 text-sm text-muted-foreground">
          <BellOff className="h-4 w-4" />
          <span>
            Browser notifications are blocked. Enable them in your browser
            settings to receive incident alerts.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-muted px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Bell className="h-4 w-4" />
          <span>
            Enable notifications to receive alerts when new incidents appear.
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={requestPermission}>
          Enable Notifications
        </Button>
      </div>
    </div>
  );
}
