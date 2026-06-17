import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Soc2ExportButton } from "../Soc2ExportButton";
import { describe, it, expect, vi, Mock } from "vitest";
import * as complianceApi from "@/lib/api/compliance";

vi.mock("@/lib/api/compliance", () => ({
  triggerSoc2Export: vi.fn(),
}));

describe("Soc2ExportButton Component", () => {
  it("starts in idle state", () => {
    render(<Soc2ExportButton />);
    expect(screen.getByText("Export SOC2 Evidence")).toBeInTheDocument();
  });

  it("transitions to loading state on click", async () => {
    (complianceApi.triggerSoc2Export as Mock).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    
    render(<Soc2ExportButton />);
    fireEvent.click(screen.getByText("Export SOC2 Evidence"));
    
    expect(screen.getByText("Generating ZIP...")).toBeInTheDocument();
  });

  it("transitions to success state on success", async () => {
    (complianceApi.triggerSoc2Export as Mock).mockResolvedValueOnce(undefined);
    
    render(<Soc2ExportButton />);
    fireEvent.click(screen.getByText("Export SOC2 Evidence"));
    
    await waitFor(() => expect(screen.getByText("Exported")).toBeInTheDocument());
  });

  it("transitions to error state on failure", async () => {
    (complianceApi.triggerSoc2Export as Mock).mockRejectedValueOnce(new Error("Export failed"));
    
    render(<Soc2ExportButton />);
    fireEvent.click(screen.getByText("Export SOC2 Evidence"));
    
    await waitFor(() => expect(screen.getByText("Retry Export")).toBeInTheDocument());
  });
});
