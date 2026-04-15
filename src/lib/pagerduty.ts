import "server-only";
import type {
  PagerDutyIncident,
  PagerDutyAlert,
  PagerDutyTeam,
  PaginatedResponse,
} from "./types";

const PD_BASE_URL = "https://api.pagerduty.com";

function headers(apiToken: string): HeadersInit {
  return {
    Authorization: `Token token=${apiToken}`,
    Accept: "application/vnd.pagerduty+json;version=2",
    "Content-Type": "application/json",
  };
}

async function pdFetch(
  path: string,
  apiToken: string,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(`${PD_BASE_URL}${path}`, {
    ...init,
    headers: { ...headers(apiToken), ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new PagerDutyError(res.status, body);
  }

  return res;
}

export class PagerDutyError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`PagerDuty API error ${status}: ${body}`);
    this.name = "PagerDutyError";
  }
}

export async function listIncidents(
  apiToken: string,
  params: {
    teamIds?: string[];
    statuses?: string[];
    limit?: number;
    offset?: number;
  }
): Promise<PaginatedResponse<PagerDutyIncident>> {
  const searchParams = new URLSearchParams();

  if (params.teamIds?.length) {
    params.teamIds.forEach((id) => searchParams.append("team_ids[]", id));
  }
  if (params.statuses?.length) {
    params.statuses.forEach((s) => searchParams.append("statuses[]", s));
  }
  searchParams.set("limit", String(params.limit ?? 30));
  searchParams.set("offset", String(params.offset ?? 0));
  searchParams.set("sort_by", "created_at:desc");
  searchParams.append("include[]", "assignments");
  searchParams.append("include[]", "last_status_change_by");

  const res = await pdFetch(
    `/incidents?${searchParams.toString()}`,
    apiToken
  );
  const json = await res.json();
  const incidents = (json.incidents ?? []).map(
    (incident: PagerDutyIncident & {
      assignments?: Array<{
        assignee?: {
          id: string;
          summary: string;
        };
      }>;
      last_status_change_by?: {
        id: string;
        summary: string;
      };
      resolved_by_user?: {
        id: string;
        summary: string;
      };
    }) => {
      const assignees =
        incident.assignees && incident.assignees.length > 0
          ? incident.assignees
          : (incident.assignments ?? [])
              .map((assignment) => assignment.assignee)
              .filter((assignee): assignee is { id: string; summary: string } =>
                Boolean(assignee)
              );

      const resolvedBy =
        incident.resolved_by_user ??
        (incident.status === "resolved"
          ? incident.last_status_change_by
          : undefined);

      return {
        ...incident,
        assignees,
        resolved_by: resolvedBy,
      };
    }
  );

  return {
    data: incidents,
    limit: json.limit ?? 30,
    offset: json.offset ?? 0,
    total: json.total ?? 0,
    more: json.more ?? false,
  };
}

export async function listAlerts(
  apiToken: string,
  incidentId: string
): Promise<PagerDutyAlert[]> {
  const res = await pdFetch(`/incidents/${incidentId}/alerts`, apiToken);
  const json = await res.json();
  return json.alerts ?? [];
}

export async function listTeams(
  apiToken: string
): Promise<PagerDutyTeam[]> {
  const allTeams: PagerDutyTeam[] = [];
  let offset = 0;
  let more = true;

  while (more) {
    const res = await pdFetch(
      `/teams?limit=100&offset=${offset}`,
      apiToken
    );
    const json = await res.json();
    allTeams.push(...(json.teams ?? []));
    more = json.more ?? false;
    offset += 100;
  }

  return allTeams;
}

export async function createWebhookSubscription(
  apiToken: string,
  config: {
    deliveryUrl: string;
    teamId: string;
  }
): Promise<{ id: string; secret: string }> {
  const res = await pdFetch("/webhook_subscriptions", apiToken, {
    method: "POST",
    body: JSON.stringify({
      webhook_subscription: {
        delivery_method: {
          type: "http_delivery_method",
          url: config.deliveryUrl,
        },
        description: "PagerDuty Dashboard webhook",
        filter: {
          id: config.teamId,
          type: "team_reference",
        },
        events: [
          "incident.triggered",
          "incident.acknowledged",
          "incident.resolved",
        ],
        type: "webhook_subscription",
      },
    }),
  });

  const json = await res.json();
  return {
    id: json.webhook_subscription.id,
    secret: json.webhook_subscription.delivery_method.secret,
  };
}

export async function deleteWebhookSubscription(
  apiToken: string,
  subscriptionId: string
): Promise<void> {
  await pdFetch(`/webhook_subscriptions/${subscriptionId}`, apiToken, {
    method: "DELETE",
  });
}
