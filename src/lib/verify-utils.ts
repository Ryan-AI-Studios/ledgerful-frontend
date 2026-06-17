import { VerificationTrendPoint, VerificationStep, VerificationHealth } from "./types";

/**
 * Calculates the pass rate percentage from passed and failed counts.
 */
export function calculatePassRate(passed: number, failed: number): number {
  const total = passed + failed;
  if (total === 0) return 100;
  return Math.round((passed / total) * 100);
}

/**
 * Generates SVG polyline points for verification trend sparklines.
 */
export function getSparklinePoints(
  data: VerificationTrendPoint[],
  type: "passed" | "failed",
  width: number,
  height: number,
  paddingY: number = 20
): string {
  if (!data || data.length === 0) return "";

  const maxTotal = Math.max(...data.map(p => Math.max(p.passed, p.failed)), 1);
  const stepX = width / (data.length - 1 || 1);

  return data.map((p, i) => {
    const x = i * stepX;
    const val = p[type];
    const y = height - paddingY - (val / maxTotal) * (height - paddingY * 2);
    return `${x},${y}`;
  }).join(" ");
}

/**
 * Determines aggregate health status based on individual step pass rates.
 */
export function getAggregateHealth(steps: VerificationStep[]): VerificationHealth["status"] {
  if (steps.length === 0) return "HEALTHY";

  const lowestPassRate = Math.min(...steps.map(s => s.passRatePercent));

  if (lowestPassRate < 80) return "FAILING";
  if (lowestPassRate < 95) return "DEGRADED";
  return "HEALTHY";
}

/**
 * Asserts that an element meets the minimum touch target size (44x44px).
 * Throws an error if the element is smaller than 44px in either dimension.
 */
export function assertTouchTargetMinimum(element: HTMLElement): void {
  // In a real browser environment, we'd use getBoundingClientRect()
  // In JSDOM/Vitest, we might need to rely on style or offset properties
  // since layout isn't fully simulated.
  const width = element.offsetWidth || parseInt(element.style.width) || 0;
  const height = element.offsetHeight || parseInt(element.style.height) || 0;

  if (width < 44 || height < 44) {
    throw new Error(
      `Touch target too small: ${width}x${height}px. Minimum required is 44x44px.`
    );
  }
}
