import { render, screen, waitFor } from "@testing-library/react";
import RootRedirect from "../page";
import { vi, describe, it, expect } from "vitest";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

describe("RootRedirect", () => {
  it("redirects to /dashboard on mount", async () => {
    render(<RootRedirect />);
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/dashboard");
    });
    expect(screen.getByText("Go to dashboard")).toBeInTheDocument();
  });
});
