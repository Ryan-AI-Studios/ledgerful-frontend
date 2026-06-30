import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsPage from "../page";
import { getGithubIntegrationStatus } from "@/lib/api/github";
import { vi, describe, beforeEach, it, expect } from "vitest";

vi.mock("@/lib/api/github", () => ({
  getGithubIntegrationStatus: vi.fn(),
  connectGithub: vi.fn(),
  disconnectGithub: vi.fn(),
}));

vi.mock("@/components/PageLayout", () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="page-layout">{children}</div>
}));

vi.mock("@/lib/ProjectContext", () => ({
  useProject: () => ({ project: { id: "proj-1" } })
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getGithubIntegrationStatus as import("vitest").Mock).mockResolvedValue({ data: { status: "DISCONNECTED" }, source: "live" });
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          project: "test",
          version: "1.0",
          telemetry: "disabled",
        }),
      })
    ) as import("vitest").Mock;
  });

  it("renders Daemon Config tab by default", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("Daemon Config")).toBeInTheDocument();
    });
    expect(screen.getByText("Configuration resolved")).toBeInTheDocument();
  });

  it("switches to Integrations tab", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("Integrations")).toBeInTheDocument();
    });
    const integrationsTab = screen.getByText("Integrations");
    fireEvent.click(integrationsTab);

    expect(screen.getByText("GitHub Integration")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect to GitHub" })).toBeInTheDocument();
  });

  it("switches to Privacy & Telemetry tab and toggles telemetry", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("Privacy & Telemetry")).toBeInTheDocument();
    });
    const privacyTab = screen.getByText("Privacy & Telemetry");
    fireEvent.click(privacyTab);

    expect(screen.getByText("Anonymous Usage Metrics")).toBeInTheDocument();
    
    const toggleButton = screen.getByRole("switch", { name: "Toggle anonymous usage metrics" });
    expect(toggleButton).toHaveAttribute("aria-checked", "false");
    
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-checked", "true");
  });
});
