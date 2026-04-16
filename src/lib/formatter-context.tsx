"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { createFormatters, type Formatters } from "@/lib/format";

const FormatterContext = createContext<Formatters | null>(null);

export function FormatterProvider({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  const fmt = useMemo(() => createFormatters(locale), [locale]);
  return (
    <FormatterContext.Provider value={fmt}>
      {children}
    </FormatterContext.Provider>
  );
}

export function useFormatter(): Formatters {
  const ctx = useContext(FormatterContext);
  if (!ctx) {
    throw new Error("useFormatter must be used within a FormatterProvider");
  }
  return ctx;
}
