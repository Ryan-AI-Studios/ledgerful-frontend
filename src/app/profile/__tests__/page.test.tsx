import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProfilePage from "../page";

vi.mock("@/components/PageLayout", () => ({
  PageLayout: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="page-layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/components/DataSourceBadge", () => ({
  DataSourceBadge: ({ source }: { source: string }) => (
    <span data-testid="data-source-badge">{source}</span>
  ),
}));

const fetchSession = vi.fn();
vi.mock("@/lib/session-data", () => ({
  fetchSession: () => fetchSession(),
}));

describe("ProfilePage honesty (FE-H2)", () => {
  beforeEach(() => {
    fetchSession.mockReset();
  });

  it("renders session data with badge and never hardcodes Yuri/Verified/Administrator", async () => {
    fetchSession.mockResolvedValue({
      data: {
        id: "u1",
        name: "Alice",
        email: "alice@example.com",
        role: "admin",
      },
      source: "mock",
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    // Raw role string only — never title-case "Administrator"
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.queryByText("Yuri Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("yuri@ledgerful.com")).not.toBeInTheDocument();
    expect(screen.queryByText("Administrator")).not.toBeInTheDocument();
    expect(screen.queryByText("Verified")).not.toBeInTheDocument();
    expect(screen.getByTestId("data-source-badge")).toHaveTextContent("mock");
  });

  it("shows Planned when role is absent", async () => {
    fetchSession.mockResolvedValue({
      data: {
        id: "u2",
        name: "Bob",
        email: "bob@example.com",
      },
      source: "live",
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
    expect(screen.getByText("Role management: Planned.")).toBeInTheDocument();
  });

  it("shows error state when session fetch fails", async () => {
    fetchSession.mockRejectedValue(new Error("offline"));

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });
  });
});
