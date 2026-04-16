"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { PagerDutyIncident } from "@/lib/types";

interface IncidentState {
  incidents: PagerDutyIncident[];
  loading: boolean;
  error: string | null;
  total: number;
  offset: number;
  page: number;
  pageSize: number;
}

interface IncidentContextValue extends IncidentState {
  setIncidents: (
    incidents: PagerDutyIncident[],
    total: number,
    offset: number
  ) => void;
  upsertIncident: (incident: PagerDutyIncident) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  getNewIncidentIds: (incidents: PagerDutyIncident[]) => string[];
  markNotified: (ids: string[]) => void;
}

const IncidentContext = createContext<IncidentContextValue | null>(null);

export function IncidentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<IncidentState>({
    incidents: [],
    loading: false,
    error: null,
    total: 0,
    offset: 0,
    page: 0,
    pageSize: 30,
  });

  const notifiedRef = useRef<Set<string>>(new Set());
  const knownRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  const setIncidents = useCallback(
    (incidents: PagerDutyIncident[], total: number, offset: number) => {
      // Track known IDs for notification dedup
      if (!initialLoadDoneRef.current) {
        incidents.forEach((i) => {
          knownRef.current.add(i.id);
          notifiedRef.current.add(i.id);
        });
        initialLoadDoneRef.current = true;
      } else {
        incidents.forEach((i) => knownRef.current.add(i.id));
      }

      setState((prev) => ({
        ...prev,
        incidents,
        total,
        offset,
        loading: false,
        error: null,
      }));
    },
    []
  );

  const upsertIncident = useCallback((incident: PagerDutyIncident) => {
    knownRef.current.add(incident.id);
    setState((prev) => {
      const idx = prev.incidents.findIndex((i) => i.id === incident.id);
      if (idx >= 0) {
        const updated = [...prev.incidents];
        updated[idx] = incident;
        return { ...prev, incidents: updated };
      }
      return {
        ...prev,
        incidents: [incident, ...prev.incidents],
        total: prev.total + 1,
      };
    });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, loading: false }));
  }, []);

  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setState((prev) => ({ ...prev, pageSize, page: 0 }));
  }, []);

  const getNewIncidentIds = useCallback(
    (incidents: PagerDutyIncident[]) => {
      return incidents
        .filter((i) => !notifiedRef.current.has(i.id))
        .map((i) => i.id);
    },
    []
  );

  const markNotified = useCallback((ids: string[]) => {
    ids.forEach((id) => notifiedRef.current.add(id));
  }, []);

  return (
    <IncidentContext.Provider
      value={{
        ...state,
        setIncidents,
        upsertIncident,
        setLoading,
        setError,
        setPage,
        setPageSize,
        getNewIncidentIds,
        markNotified,
      }}
    >
      {children}
    </IncidentContext.Provider>
  );
}

export function useIncidents() {
  const ctx = useContext(IncidentContext);
  if (!ctx)
    throw new Error("useIncidents must be used within IncidentProvider");
  return ctx;
}
