const DEFAULT_LOCALE = "en-US";

const formatDate = (formatter: Intl.DateTimeFormat, date: Date | string) =>
  formatter.format(typeof date === "string" ? new Date(date) : date);

export interface Formatters {
  asDateTime: (timestamp: Date | string) => string;
  asShortDate: (timestamp: Date | string) => string;
  asTime: (timestamp: Date | string) => string;
}

/**
 * Create locale-bound formatters.
 * On the server the locale comes from Accept-Language; on the client
 * the same value is reused via context so SSR and hydration match.
 */
export function createFormatters(locale: string): Formatters {
  const dt = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const sd = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return {
    asDateTime: (timestamp) => formatDate(dt, timestamp),
    asShortDate: (timestamp) => formatDate(sd, timestamp),
    asTime: (timestamp) => {
      if (!timestamp) return "";
      const d = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
      return d.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  };
}

/**
 * Parse an Accept-Language header and return the preferred locale.
 * Falls back to DEFAULT_LOCALE if the header is missing or empty.
 */
export function parseAcceptLanguage(header: string | null): string {
  if (!header) return DEFAULT_LOCALE;
  const first = header.split(",")[0];
  const locale = first.split(";")[0].trim();
  return locale || DEFAULT_LOCALE;
}
