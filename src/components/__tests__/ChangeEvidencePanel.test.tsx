import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BaselineCandidate, EvidenceKey, EvidencePacket } from "@/lib/api/change-evidence-decoder";
import type { EvidenceRequestState } from "@/lib/api/change-evidence";
import { SESSION_INVALID_EVENT } from "@/lib/events";
import type { ChangeEntry, Project } from "@/lib/types";
import { resetInMemoryToken, setAuthToken } from "@/lib/utils";
import { ChangeEvidencePanel } from "../ChangeEvidencePanel";

const mocks = vi.hoisted(() => ({
  fetchChangeEvidence: vi.fn(),
  fetchProjects: vi.fn(),
  useProject: vi.fn(),
  useDaemonStatusDetail: vi.fn(),
}));

vi.mock("@/lib/api/change-evidence", () => ({ fetchChangeEvidence: mocks.fetchChangeEvidence }));
vi.mock("@/lib/api/projects", () => ({ fetchProjects: mocks.fetchProjects }));
vi.mock("@/lib/ProjectContext", () => ({ useProject: mocks.useProject }));
vi.mock("@/lib/DaemonStatusContext", () => ({ useDaemonStatusDetail: mocks.useDaemonStatusDetail }));

const revisions = {
  repoScope: "0547cc28-569c-4587-a74e-a88a44c3b139",
  head: "1".repeat(40),
  base: "2".repeat(40),
};
const otherRevision = { ...revisions, head: "3".repeat(40) };
const primary: Project = {
  id: "primary", path: "C:/fixture/primary", name: "Primary repository",
  status: "healthy", healthScore: 100, lastScanAt: null, validationWarnings: [],
  changeEvidence: { status: "ready", repoScope: revisions.repoScope, displayName: "Primary repository" },
};
const sibling: Project = { ...primary, id: "sibling", path: "C:/fixture/sibling",
  name: "Sibling repository", changeEvidence: undefined };

function row(evidenceKey: EvidenceKey | undefined, summary = "Fixture change"): ChangeEntry {
  return {
    id: evidenceKey?.head.slice(0, 8) ?? "working-tree", filePath: "fixture row", summary,
    author: "Fixtures", timeAgo: "now", risk: "LOW", fileCount: 1,
    filesChanged: 1, additions: 0, deletions: 0, evidenceKey,
  };
}
function candidate(name: string): BaselineCandidate {
  return { name, base: revisions.base, payloadDigest: "blake3:" + name[0].repeat(64), observedAt: "2026-11-24T11:36:30Z" };
}

function response(key: EvidenceKey, file: string, items: BaselineCandidate[] = [], complete = true): EvidenceRequestState {
  const packet: EvidencePacket = {
    ...key,
    displayName: primary.name,
    baselineCandidates: { status: "ready", items, complete },
    verification: { status: "not-recorded", reasonCode: "revision-not-captured" },
    comparison: items.length > 0 ? { status: "selection-required" } : { status: "unavailable", reasonCode: "not-prepared" },
    git: { status: "ready", total: 1, omitted: 0, files: [{ kind: "added", path: file }] },
  };
  return { status: "ready", packet };
}

function deferred<T>() {
  let resolve!: (result: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

const defaultProps = { panelId: "fixture-evidence", onClose: vi.fn(), source: "live" as const };

beforeEach(() => {
  mocks.fetchProjects.mockReset().mockResolvedValue([primary, sibling]);
  mocks.fetchChangeEvidence.mockReset();
  mocks.useProject.mockReset().mockReturnValue({ project: primary, isLoaded: true });
  mocks.useDaemonStatusDetail.mockReset().mockReturnValue({ isDaemonOffline: false, sseState: "live" });
  setAuthToken("fixture-session");
});
afterEach(() => {
  cleanup();
  resetInMemoryToken();
});

describe("Change evidence selection lifecycle", () => {
  it("suppresses a late response after opening a different full revision", async () => {
    const first = deferred<EvidenceRequestState>();
    const second = deferred<EvidenceRequestState>();
    mocks.fetchChangeEvidence.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { rerender } = render(<ChangeEvidencePanel {...defaultProps} row={row(revisions, "First change")} />);
    await waitFor(() => expect(mocks.fetchChangeEvidence).toHaveBeenCalledTimes(1));
    const firstSignal = mocks.fetchChangeEvidence.mock.calls[0][2] as AbortSignal;
    rerender(<ChangeEvidencePanel {...defaultProps} row={row(otherRevision, "Second change")} />);
    await waitFor(() => expect(mocks.fetchChangeEvidence).toHaveBeenCalledTimes(2));
    expect(firstSignal.aborted).toBe(true);
    await act(async () => second.resolve(response(otherRevision, "src/Second.rs")));
    await act(async () => first.resolve(response(revisions, "src/First.rs")));
    expect(screen.getByText("src/Second.rs")).toBeVisible();
    expect(screen.queryByText("src/First.rs")).not.toBeInTheDocument();
  });

  it("requires explicit baseline selection for a partial singleton", async () => {
    mocks.fetchChangeEvidence.mockResolvedValue(response(revisions, "src/Pair.rs", [candidate("alpha")], false));
    render(<ChangeEvidencePanel {...defaultProps} row={row(revisions)} />);
    expect(await screen.findByRole("combobox", { name: "Baseline" })).toHaveValue("");
    expect(screen.getByText(/candidate list is partial/i)).toBeVisible();
    expect(mocks.fetchChangeEvidence).toHaveBeenCalledTimes(1);
  });

  it("cancels a prior baseline request and only shows the selected baseline", async () => {
    const alpha = candidate("alpha");
    const beta = candidate("beta");
    const first = deferred<EvidenceRequestState>();
    const second = deferred<EvidenceRequestState>();
    mocks.fetchChangeEvidence.mockResolvedValueOnce(response(revisions, "src/Pair.rs", [alpha, beta]))
      .mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    render(<ChangeEvidencePanel {...defaultProps} row={row(revisions)} />);
    const selector = await screen.findByRole("combobox", { name: "Baseline" });
    fireEvent.change(selector, { target: { value: alpha.name } });
    await waitFor(() => expect(mocks.fetchChangeEvidence).toHaveBeenCalledTimes(2));
    const firstSignal = mocks.fetchChangeEvidence.mock.calls[1][2] as AbortSignal;
    fireEvent.change(selector, { target: { value: beta.name } });
    await waitFor(() => expect(mocks.fetchChangeEvidence).toHaveBeenCalledTimes(3));
    expect(firstSignal.aborted).toBe(true);
    await act(async () => second.resolve(response(revisions, "src/Beta.rs")));
    await act(async () => first.resolve(response(revisions, "src/Alpha.rs")));
    expect(screen.getByText("src/Beta.rs")).toBeVisible();
    expect(screen.queryByText("src/Alpha.rs")).not.toBeInTheDocument();
    expect(screen.getByText(beta.payloadDigest)).toBeVisible();
    expect(screen.getByText("Change evidence ready for the selected baseline.")).toHaveAttribute("role", "status");
  });

  it("removes old evidence and withholds requests when the display project switches", async () => {
    mocks.fetchChangeEvidence.mockResolvedValue(response(revisions, "src/Primary.rs"));
    const { rerender } = render(<ChangeEvidencePanel {...defaultProps} row={row(revisions)} />);
    expect(await screen.findByText("src/Primary.rs")).toBeVisible();
    mocks.useProject.mockReturnValue({ project: sibling, isLoaded: true });
    rerender(<ChangeEvidencePanel {...defaultProps} row={row(revisions)} />);
    expect(await screen.findByText("Selected project: Sibling repository. Connected daemon serves Primary repository.")).toBeVisible();
    expect(screen.queryByText("src/Primary.rs")).not.toBeInTheDocument();
    expect(mocks.fetchChangeEvidence).toHaveBeenCalledTimes(1);
  });

  it("aborts evidence on session invalidation, ignores a late response, and clears the old panel", async () => {
    const result = deferred<EvidenceRequestState>();
    mocks.fetchChangeEvidence.mockReturnValue(result.promise);
    render(<ChangeEvidencePanel {...defaultProps} row={row(revisions)} />);
    await waitFor(() => expect(mocks.fetchChangeEvidence).toHaveBeenCalledTimes(1));
    const signal = mocks.fetchChangeEvidence.mock.calls[0][2] as AbortSignal;
    act(() => {
      resetInMemoryToken();
      window.dispatchEvent(new CustomEvent(SESSION_INVALID_EVENT));
    });
    await act(async () => result.resolve(response(revisions, "src/Invalidated.rs")));
    expect(signal.aborted).toBe(true);
    expect(screen.getByText("Sign in to view change evidence.")).toBeVisible();
    expect(screen.queryByText("src/Invalidated.rs")).not.toBeInTheDocument();
  });

  it("cancels the exact request on unmount", async () => {
    const result = deferred<EvidenceRequestState>();
    mocks.fetchChangeEvidence.mockReturnValue(result.promise);
    const { unmount } = render(<ChangeEvidencePanel {...defaultProps} row={row(revisions)} />);
    await waitFor(() => expect(mocks.fetchChangeEvidence).toHaveBeenCalledTimes(1));
    const signal = mocks.fetchChangeEvidence.mock.calls[0][2] as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => result.resolve(response(revisions, "src/Unmounted.rs")));
  });

  it("offers an explicit retry after a timeout", async () => {
    mocks.fetchChangeEvidence.mockResolvedValueOnce({ status: "timeout" })
      .mockResolvedValueOnce(response(revisions, "src/Retried.rs"));
    render(<ChangeEvidencePanel {...defaultProps} row={row(revisions)} />);
    expect(await screen.findByText("Change evidence request timed out.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Retry evidence" }));
    expect(await screen.findByText("src/Retried.rs")).toBeVisible();
    expect(mocks.fetchChangeEvidence.mock.calls.map(([key]) => key)).toEqual([revisions, revisions]);
  });

  it("keeps demo, offline, old-daemon, and unsupported-row states distinct", async () => {
    const { rerender } = render(<ChangeEvidencePanel {...defaultProps} source="mock" row={row(revisions)} />);
    expect(screen.getByText("Example data. Live change evidence is unavailable.")).toBeVisible();
    mocks.useDaemonStatusDetail.mockReturnValue({ isDaemonOffline: true, sseState: "reconnecting" });
    rerender(<ChangeEvidencePanel {...defaultProps} row={row(revisions)} />);
    expect(screen.getByText("Daemon unavailable.")).toBeVisible();
    mocks.useDaemonStatusDetail.mockReturnValue({ isDaemonOffline: false, sseState: "live" });
    mocks.fetchProjects.mockResolvedValueOnce([{ ...primary, changeEvidence: undefined }]);
    rerender(<ChangeEvidencePanel {...defaultProps} row={row(revisions)} />);
    expect(await screen.findByText("This daemon does not provide change evidence.")).toBeVisible();
    rerender(<ChangeEvidencePanel {...defaultProps} row={row(undefined)} />);
    expect(await screen.findByText("Before/after evidence is available for committed changes.")).toBeVisible();
    expect(mocks.fetchChangeEvidence).not.toHaveBeenCalled();
  });
});
