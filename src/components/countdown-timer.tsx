"use client";

import { Timer } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CountdownTimerProps {
  seconds: number;
  total: number;
  isPolling: boolean;
}

export function CountdownTimer({
  seconds,
  total,
  isPolling,
}: CountdownTimerProps) {
  if (!isPolling) return null;

  const percentage = total > 0 ? (seconds / total) * 100 : 0;

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="h-4 w-4" />
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-1000"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="tabular-nums">{seconds}s</span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>Next refresh in {seconds} seconds</TooltipContent>
    </Tooltip>
  );
}
