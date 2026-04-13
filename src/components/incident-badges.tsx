"use client";

import { Badge } from "@/components/ui/badge";
import type { PagerDutyIncident } from "@/lib/types";

const STATUS_STYLES = {
  triggered:
    "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200",
  acknowledged:
    "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200",
  resolved:
    "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200",
} as const;

const URGENCY_STYLES = {
  high: "bg-red-50 text-red-700 hover:bg-red-50 dark:bg-red-950 dark:text-red-300",
  low: "bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-300",
} as const;

export function StatusBadge({ status }: { status: PagerDutyIncident["status"] }) {
  return (
    <Badge variant="secondary" className={STATUS_STYLES[status]}>
      {status}
    </Badge>
  );
}

export function UrgencyBadge({ urgency }: { urgency: PagerDutyIncident["urgency"] }) {
  return (
    <Badge variant="secondary" className={URGENCY_STYLES[urgency]}>
      {urgency}
    </Badge>
  );
}
