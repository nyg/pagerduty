import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ConfigProvider } from "@/contexts/config-context";
import { IncidentProvider } from "@/contexts/incident-context";
import { Toaster } from "@/components/ui/sonner";
import { parseAcceptLanguage } from "@/lib/format";
import { FormatterProvider } from "@/lib/formatter-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PagerDuty Dashboard",
  description: "Monitor PagerDuty incidents for your team",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hdrs = await headers();
  const locale = parseAcceptLanguage(hdrs.get("accept-language"));

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <FormatterProvider locale={locale}>
            <ConfigProvider>
              <IncidentProvider>
                {children}
                <Toaster />
              </IncidentProvider>
            </ConfigProvider>
          </FormatterProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
