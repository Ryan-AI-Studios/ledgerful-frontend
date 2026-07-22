import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { fetchChanges } from "@/lib/api/changes";
import { apiGet } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  ApiError: class extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

describe("changes mapper honesty (FE-H8)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps missing/null risk to UNKNOWN — never invents LOW from status", async () => {
    (apiGet as Mock).mockResolvedValueOnce([
      {
        path: "src/a.ts",
        status: "modified",
        author: "alice",
        // risk omitted
      },
      {
        path: "src/b.ts",
        status: "deleted",
        author: "bob",
        risk: null,
      },
      {
        path: "src/c.ts",
        status: "added",
        author: "carol",
        risk: "",
      },
    ]);

    const data = await fetchChanges();
    expect(data).toHaveLength(3);
    expect(data[0].risk).toBe("UNKNOWN");
    expect(data[1].risk).toBe("UNKNOWN");
    expect(data[2].risk).toBe("UNKNOWN");
  });

  it("normalizes known wire risk levels", async () => {
    (apiGet as Mock).mockResolvedValueOnce([
      {
        path: "src/a.ts",
        author: "alice",
        risk: "high",
      },
      {
        path: "src/b.ts",
        author: "bob",
        risk: "MEDIUM",
      },
    ]);

    const data = await fetchChanges();
    expect(data[0].risk).toBe("HIGH");
    expect(data[1].risk).toBe("MEDIUM");
  });
});
