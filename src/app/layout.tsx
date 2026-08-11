import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ProjectProvider } from "@/lib/ProjectContext";
import { DaemonStatusProvider } from "@/lib/DaemonStatusContext";

// Vendored SIL OFL variable fonts under src/fonts/ — build must not hit
// fonts.gstatic.com / fonts.googleapis.com (0177 offline embed reliability).
const inter = localFont({
  src: "../fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "../fonts/JetBrainsMono-Variable.woff2",
  variable: "--font-jetbrains-mono",
  display: "swap",
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
