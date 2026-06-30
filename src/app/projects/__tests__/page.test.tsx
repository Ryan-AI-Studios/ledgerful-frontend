import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import type ProjectsPage from "../page";

vi.mock("@/lib/ProjectContext", () => ({
  useProject: () => ({
    project: {
      id: "proj-1",
      name: "Proj 1",
      path: "C:\\proj-1",
      status: "healthy",
      lastScanAt: "2d ago",
      healthScore: 90,
      validationWarnings: [],
    },
    setProject: vi.fn(),
  }),
}));

describe("ProjectsPage validation warnings", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("renders validation warnings when present", async () => {
    vi.doMock("@/lib/projects", () => ({
      projects: [
        {
          id: "proj-1",
          name: "Proj 1",
          path: "C:\\proj-1",
          status: "warning",
          lastScanAt: "2d ago",
          healthScore: 61,
          validationWarnings: ["No lockfile pinned", "Outdated scan"],
        },
      ],
    }));

    const { default: Page } = await import("../page") as { default: typeof ProjectsPage };
    render(<Page />);

    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByText("No lockfile pinned")).toBeInTheDocument();
    expect(screen.getByText("Outdated scan")).toBeInTheDocument();
  });

  it("renders no warning section when validation warnings are empty", async () => {
    vi.doMock("@/lib/projects", () => ({
      projects: [
        {
          id: "proj-1",
          name: "Proj 1",
          path: "C:\\proj-1",
          status: "healthy",
          lastScanAt: "2d ago",
          healthScore: 90,
          validationWarnings: [],
        },
      ],
    }));

    const { default: Page } = await import("../page") as { default: typeof ProjectsPage };
    render(<Page />);

    expect(screen.queryByText("Needs attention")).not.toBeInTheDocument();
  });
});
