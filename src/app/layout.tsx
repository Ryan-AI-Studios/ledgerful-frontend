import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ProjectProvider } from "@/lib/ProjectContext";
import { DaemonStatusProvider } from "@/lib/DaemonStatusContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Ledgerful — the intent ledger for agentic engineering.",
  description: "Ledgerful — the intent ledger for agentic engineering.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-surface)] text-[var(--color-text-primary)]">
        {/*
          ProjectProvider must wrap DaemonStatusProvider: TokenPrompt replaces
          children until a Bearer token exists. SSE hard-stops on 401/403, so
          mounting the stream before auth permanently kills live updates for the
          session (token is in-memory only — every full load re-auths). Nested
          under ProjectProvider, the SSE client mounts only after sign-in and
          remounts cleanly after session-invalid → re-auth.
        */}
        <ProjectProvider>
          <DaemonStatusProvider>
            {children}
          </DaemonStatusProvider>
        </ProjectProvider>
      </body>
    </html>
  );
}
