import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { VerificationHealthCard } from "../VerificationHealthCard";

describe("VerificationHealthCard", () => {
  it("explains DEGRADED with no runs as missing data, not a failed run", () => {
    render(
      <VerificationHealthCard
        health={{
          status: "DEGRADED",
          lastRunAt: null,
          message: "No verification runs recorded",
        }}
      />,
    );

    expect(screen.getByText("No verification data yet")).toBeInTheDocument();
    expect(
      screen.getByText(/not because a run failed/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/ledgerful verify/i)).toBeInTheDocument();
    expect(screen.getByText(/None recorded yet/i)).toBeInTheDocument();
    expect(screen.getAllByText("DEGRADED").length).toBeGreaterThanOrEqual(1);
  });

  it("explains stale DEGRADED as out of date, not failing", () => {
    render(
      <VerificationHealthCard
        health={{
          status: "DEGRADED",
          lastRunAt: "2020-01-01T00:00:00Z",
          message: "Last verification run is stale (older than 7 days)",
        }}
      />,
    );

    expect(screen.getByText("Verification data is stale")).toBeInTheDocument();
    expect(screen.getByText(/out of date/i)).toBeInTheDocument();
  });

  it("labels HEALTHY as verification-specific", () => {
    render(
      <VerificationHealthCard
        health={{
          status: "HEALTHY",
          lastRunAt: "2026-07-26T12:00:00Z",
        }}
      />,
    );

    expect(screen.getByText("Verification healthy")).toBeInTheDocument();
    expect(screen.getByText(/not overall project status/i)).toBeInTheDocument();
  });
});
