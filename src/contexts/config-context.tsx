"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { type AppConfig, DEFAULT_CONFIG } from "@/lib/types";

const STORAGE_KEY = "pagerduty-config";

interface ServerConfig {
  hasServerToken: boolean;
  teamId: string;
}

interface ConfigContextValue {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
  isConfigured: boolean;
  isWebhookMode: boolean;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

function loadConfig(): AppConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch {
    // ignore parse errors
  }

  // Fallback to env vars
  return {
    ...DEFAULT_CONFIG,
    apiToken:
      process.env.NEXT_PUBLIC_PAGERDUTY_API_TOKEN ?? DEFAULT_CONFIG.apiToken,
    teamId:
      process.env.NEXT_PUBLIC_PAGERDUTY_TEAM_ID ?? DEFAULT_CONFIG.teamId,
    ngrokUrl:
      process.env.NEXT_PUBLIC_NGROK_URL ?? DEFAULT_CONFIG.ngrokUrl,
    pollInterval: Number(
      process.env.NEXT_PUBLIC_POLL_INTERVAL ?? DEFAULT_CONFIG.pollInterval
    ),
  };
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    hasServerToken: false,
    teamId: "",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loaded = loadConfig();

    fetch("/api/config")
      .then((res) => res.json())
      .then((data: ServerConfig) => {
        setServerConfig(data);
        // Apply server-side teamId if client doesn't have one
        if (data.teamId && !loaded.teamId) {
          loaded.teamId = data.teamId;
        }
        setConfig(loaded);
        setMounted(true);
      })
      .catch(() => {
        setConfig(loaded);
        setMounted(true);
      });
  }, []);

  const updateConfig = useCallback((updates: Partial<AppConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const isConfigured = !!(config.apiToken || serverConfig.hasServerToken) && !!config.teamId;
  const isWebhookMode = !!(
    config.ngrokUrl && config.webhookSubscriptionId
  );

  if (!mounted) return null;

  return (
    <ConfigContext.Provider
      value={{ config, updateConfig, isConfigured, isWebhookMode }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within ConfigProvider");
  return ctx;
}
