"use client";

import Link from "next/link";
import { Settings, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useConfig } from "@/contexts/config-context";

export function Header() {
  const { isWebhookMode } = useConfig();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Siren className="h-5 w-5 text-destructive" />
          <h1 className="text-lg font-semibold">PagerDuty Dashboard</h1>
          {isWebhookMode && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label="Settings"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 w-9"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
