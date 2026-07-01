import { VerificationHealth, VerificationTrendPoint, VerificationStep } from "../types";

export const MOCK_VERIFICATION_HEALTH: VerificationHealth = {
  status: "HEALTHY",
  lastRunAt: "2026-06-15T14:30:00Z",
  message: "All verification steps passed in the last run.",
};

export const MOCK_VERIFICATION_HISTORY: VerificationTrendPoint[] = [
  { date: "2026-06-01", passed: 12, failed: 0 },
  { date: "2026-06-02", passed: 15, failed: 1 },
  { date: "2026-06-03", passed: 10, failed: 0 },
  { date: "2026-06-04", passed: 18, failed: 2 },
  { date: "2026-06-05", passed: 14, failed: 0 },
  { date: "2026-06-06", passed: 9, failed: 0 },
  { date: "2026-06-07", passed: 11, failed: 1 },
  { date: "2026-06-08", passed: 16, failed: 0 },
  { date: "2026-06-09", passed: 20, failed: 0 },
  { date: "2026-06-10", passed: 13, failed: 1 },
  { date: "2026-06-11", passed: 17, failed: 0 },
  { date: "2026-06-12", passed: 15, failed: 0 },
  { date: "2026-06-13", passed: 12, failed: 0 },
  { date: "2026-06-14", passed: 19, failed: 1 },
  { date: "2026-06-15", passed: 22, failed: 0 },
];

export const MOCK_VERIFICATION_STEPS: VerificationStep[] = [
  {
    id: "step-1",
    name: "Linter (ESLint)",
    lastRunAt: "2026-06-15T14:25:00Z",
    averageDurationMs: 4500,
    passRatePercent: 98,
    recentFailures: 1,
  },
  {
    id: "step-2",
    name: "Type Check (tsc)",
    lastRunAt: "2026-06-15T14:26:00Z",
    averageDurationMs: 12000,
    passRatePercent: 95,
    recentFailures: 3,
  },
  {
    id: "step-3",
    name: "Unit Tests (vitest)",
    lastRunAt: "2026-06-15T14:28:00Z",
    averageDurationMs: 25000,
    passRatePercent: 99,
    recentFailures: 0,
  },
  {
    id: "step-4",
    name: "E2E Tests (playwright)",
    lastRunAt: "2026-06-15T14:30:00Z",
    averageDurationMs: 180000,
    passRatePercent: 92,
    recentFailures: 5,
  },
  {
    id: "step-5",
    name: "Security Scan",
    lastRunAt: "2026-06-15T14:20:00Z",
    averageDurationMs: 8000,
    passRatePercent: 100,
    recentFailures: 0,
  },
];

