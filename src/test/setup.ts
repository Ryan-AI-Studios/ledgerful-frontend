import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock ProjectContext
vi.mock("@/lib/ProjectContext", () => ({
  useProject: vi.fn(() => ({
    project: {
      id: "test-project",
      name: "Test Project",
      path: "C:\\test",
      status: "healthy",
      lastScanAt: "2026-06-16T12:00:00Z",
      healthScore: 100,
    },
    setProject: vi.fn(),
  })),
  ProjectProvider: ({ children }: { children: React.ReactNode }) => children,
}));
