"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useConfig } from "@/contexts/config-context";
import type { PagerDutyTeam } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const { config, updateConfig } = useConfig();

  const [apiToken, setApiToken] = useState(config.apiToken);
  const [teamId, setTeamId] = useState(config.teamId);
  const [teamName, setTeamName] = useState(config.teamName);
  const [ngrokUrl, setNgrokUrl] = useState(config.ngrokUrl);
  const [pollInterval, setPollInterval] = useState(
    String(config.pollInterval)
  );

  const [teams, setTeams] = useState<PagerDutyTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  // Sync form state when config changes (e.g. on mount)
  useEffect(() => {
    setApiToken(config.apiToken);
    setTeamId(config.teamId);
    setTeamName(config.teamName);
    setNgrokUrl(config.ngrokUrl);
    setPollInterval(String(config.pollInterval));
  }, [config]);

  const fetchTeams = async () => {
    if (!apiToken) return;
    setLoadingTeams(true);
    setTeamError(null);
    try {
      const params = new URLSearchParams({ apiToken });
      const res = await fetch(`/api/teams?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setTeams(data.teams);
    } catch (err) {
      setTeamError(
        err instanceof Error ? err.message : "Failed to fetch teams"
      );
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    const oldNgrokUrl = config.ngrokUrl;
    const oldSubscriptionId = config.webhookSubscriptionId;
    let webhookSubscriptionId = config.webhookSubscriptionId;
    let webhookSigningSecret = config.webhookSigningSecret;

    // Manage webhook subscription if ngrok URL changed
    if (ngrokUrl !== oldNgrokUrl || (!ngrokUrl && oldSubscriptionId)) {
      try {
        const res = await fetch("/api/settings/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiToken,
            ngrokUrl: ngrokUrl || null,
            teamId,
            oldSubscriptionId: oldSubscriptionId || null,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.deleted) {
            webhookSubscriptionId = "";
            webhookSigningSecret = "";
          } else {
            webhookSubscriptionId = data.id;
            webhookSigningSecret = data.secret;
          }
        }
      } catch {
        // Continue saving other settings even if webhook management fails
      }
    }

    const selectedTeam = teams.find((t) => t.id === teamId);

    updateConfig({
      apiToken,
      teamId,
      teamName: selectedTeam?.name || teamName,
      ngrokUrl,
      pollInterval: Math.max(10, Number(pollInterval) || 30),
      webhookSubscriptionId,
      webhookSigningSecret,
    });

    setSaving(false);
    router.push("/");
  };

  const handleRemoveWebhook = async () => {
    if (!config.webhookSubscriptionId) return;
    setSaving(true);

    try {
      await fetch("/api/settings/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiToken: config.apiToken,
          ngrokUrl: null,
          teamId: config.teamId,
          oldSubscriptionId: config.webhookSubscriptionId,
        }),
      });
    } catch {
      // Best effort
    }

    updateConfig({
      ngrokUrl: "",
      webhookSubscriptionId: "",
      webhookSigningSecret: "",
    });
    setNgrokUrl("");
    setSaving(false);
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>PagerDuty API</CardTitle>
          <CardDescription>
            Configure your PagerDuty API token and team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiToken">API Token</Label>
            <Input
              id="apiToken"
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Enter your PagerDuty API token"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="team">Team</Label>
              <Button
                variant="link"
                size="sm"
                onClick={fetchTeams}
                disabled={!apiToken || loadingTeams}
                className="h-auto p-0"
              >
                {loadingTeams ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                Fetch teams
              </Button>
            </div>
            {teamError && (
              <p className="text-sm text-destructive">{teamError}</p>
            )}
            {teams.length > 0 ? (
              <Select
                value={teamId}
                onValueChange={(value) => {
                  if (value) {
                    setTeamId(value);
                    const team = teams.find((t) => t.id === value);
                    if (team) setTeamName(team.name);
                  }
                }}
              >
                <SelectTrigger id="team">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="team"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder="Team ID (or fetch teams above)"
              />
            )}
            {teamName && teams.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Current team: {teamName}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Polling Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Polling</CardTitle>
          <CardDescription>
            Configure the refresh interval for incident data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pollInterval">
              Poll Interval (seconds, min 10)
            </Label>
            <Input
              id="pollInterval"
              type="number"
              min="10"
              value={pollInterval}
              onChange={(e) => setPollInterval(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks (Optional)</CardTitle>
          <CardDescription>
            Provide an ngrok URL to enable real-time webhook updates. When
            configured, webhooks take priority over polling.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ngrokUrl">ngrok URL</Label>
            <Input
              id="ngrokUrl"
              type="url"
              value={ngrokUrl}
              onChange={(e) => setNgrokUrl(e.target.value)}
              placeholder="https://your-subdomain.ngrok.io"
            />
          </div>
          {config.webhookSubscriptionId && (
            <div className="flex items-center justify-between rounded-md border bg-muted/50 p-3">
              <div className="text-sm">
                <p className="font-medium text-green-700 dark:text-green-400">
                  Webhook subscription active
                </p>
                <p className="text-muted-foreground">
                  ID: {config.webhookSubscriptionId}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveWebhook}
                disabled={saving}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Remove
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/")}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
