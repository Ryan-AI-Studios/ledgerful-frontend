import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsPage from "../page";
import { getGithubIntegrationStatus } from "@/lib/api/github";
import { vi, describe, beforeEach, it, expect } from "vitest";

vi.mock("@/lib/api/github", () => ({
  getGithubIntegrationStatus: vi.fn(),
  connectGithub: vi.fn(),
  disconnectGithub: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock("@/lib/sync-data", () => ({
  fetchSyncStatus: vi.fn().mockResolvedValue({
    data: {
      deviceId: "dev-1",
      lastExtractAt: null,
      lastApplyAt: null,
      lastRunAt: null,
    },
    source: "live",
  }),
}));

vi.mock("@/components/PageLayout", () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-layout">{children}</div>
  ),
}));

vi.mock("@/components/DataSourceBadge", () => ({
  DataSourceBadge: ({ source }: { source: string }) => (
    <span data-testid="badge">{source}</span>
  ),
}));

vi.mock("@/lib/ProjectContext", () => ({
  useProject: () => ({ project: { id: "proj-1" } }),
}));

import { apiGet } from "@/lib/api";

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getGithubIntegrationStatus as import("vitest").Mock).mockResolvedValue({
      data: { status: "DISCONNECTED" },
      source: "planned",
    });
    (apiGet as import("vitest").Mock).mockResolvedValue({
      project: "test",
      repo_path: "/repo",
      ledger_path: "/ledger",
      graph_path: "/graph",
      signing_key: "configured",
      llm_backend: "none",
      polling_interval: "30s",
      telemetry: "disabled",
      version: "1.0",
    });
  });

  it("renders Daemon Config tab by default with signing_key", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("Daemon Config")).toBeInTheDocument();
    });
    expect(screen.getByText("Configuration resolved")).toBeInTheDocument();
    expect(screen.getByText("configured")).toBeInTheDocument();
  });

  it("switches to Integrations tab and shows Planned for GitHub", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("Integrations")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Integrations"));

    expect(screen.getByText("GitHub Integration")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "GitHub connect planned" })).toBeDisabled();
    expect(screen.getAllByText(/Planned/).length).toBeGreaterThan(0);
  });

  it("shows disabled CLI-owned telemetry switch (no placebo toggle)", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("Privacy & Telemetry")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Privacy & Telemetry"));

    expect(screen.getByText("Anonymous Usage Metrics")).toBeInTheDocument();
    expect(screen.getByText(/Managed by CLI/)).toBeInTheDocument();

    const toggle = screen.getByRole("switch", {
      name: "Anonymous usage metrics (managed by CLI)",
    });
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAttribute("aria-checked", "false");
    // Click must not flip (disabled placebo removed)
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });
});
