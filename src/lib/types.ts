// Shared types for PagerDuty data models

export interface PagerDutyIncident {
  id: string;
  incident_number: number;
  title: string;
  status: "triggered" | "acknowledged" | "resolved";
  urgency: "high" | "low";
  created_at: string;
  updated_at: string;
  html_url: string;
  service: {
    id: string;
    summary: string;
  };
  assignees: Array<{
    id: string;
    summary: string;
  }>;
  teams: Array<{
    id: string;
    summary: string;
  }>;
}

export interface PagerDutyAlert {
  id: string;
  type: string;
  status: "triggered" | "resolved";
  created_at: string;
  severity: string;
  summary: string;
  body?: {
    type: string;
    details?: Record<string, unknown>;
    cef_details?: {
      source_origin: string;
      event_class: string;
      dedup_key: string;
      description: string;
    };
  };
  service: {
    id: string;
    summary: string;
  };
}

export interface PagerDutyTeam {
  id: string;
  name: string;
  summary: string;
  description: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  limit: number;
  offset: number;
  total: number;
  more: boolean;
}

export interface AppConfig {
  apiToken: string;
  teamId: string;
  teamName: string;
  ngrokUrl: string;
  pollInterval: number; // seconds
  webhookSubscriptionId: string;
  webhookSigningSecret: string;
}

export const DEFAULT_CONFIG: AppConfig = {
  apiToken: "",
  teamId: "",
  teamName: "",
  ngrokUrl: "",
  pollInterval: 30,
  webhookSubscriptionId: "",
  webhookSigningSecret: "",
};

export interface WebhookEvent {
  event: {
    id: string;
    event_type: string;
    resource_type: string;
    occurred_at: string;
    data: {
      id: string;
      type: string;
      self: string;
      html_url: string;
      number: number;
      title: string;
      status: string;
      urgency: string;
      service: {
        id: string;
        summary: string;
      };
      assignees: Array<{
        id: string;
        summary: string;
      }>;
      teams: Array<{
        id: string;
        summary: string;
      }>;
      created_at: string;
      updated_at: string;
    };
  };
}
