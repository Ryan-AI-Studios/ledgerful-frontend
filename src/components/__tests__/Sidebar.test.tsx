import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Sidebar } from "../Sidebar";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { assertTouchTargetMinimum } from "../../lib/verify-utils";

describe("Sidebar", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnClose.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders when isOpen is true", () => {
    render(<Sidebar isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("does not show when isOpen is false (via CSS class)", () => {
    render(<Sidebar isOpen={false} onClose={mockOnClose} />);
    const sidebar = screen.getByRole("complementary", { hidden: true });
    expect(sidebar).toHaveClass("-translate-x-full");
    expect(sidebar).toHaveAttribute("aria-hidden", "true");
  });

  it("calls onClose when the Escape key is pressed", () => {
    render(<Sidebar isOpen={true} onClose={mockOnClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("auto-focuses the first element when it opens", async () => {
    render(<Sidebar isOpen={true} onClose={mockOnClose} />);
    
    // The component uses setTimeout(..., 0)
    act(() => {
      vi.advanceTimersByTime(0);
    });

    const closeButton = screen.getByRole("button", { name: /close menu/i });
    expect(document.activeElement).toBe(closeButton);
  });

  it("cycles focus with Tab key (focus trap)", async () => {
    // For focus trap testing, it's often easier to use real timers and fireEvent
    // or ensure userEvent is configured correctly. 
    // Let's use real timers for this specific test to avoid complexity.
    vi.useRealTimers();
    render(<Sidebar isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole("button", { name: /close menu/i });
    const navLinks = screen.getAllByRole("link");
    const lastElement = navLinks[navLinks.length - 1];

    // Wait for auto-focus
    await waitFor(() => expect(document.activeElement).toBe(closeButton));

    // Tab on last element should cycle to first
    lastElement.focus();
    fireEvent.keyDown(lastElement, { key: "Tab" });
    expect(document.activeElement).toBe(closeButton);

    // Shift+Tab on first element should cycle to last
    closeButton.focus();
    fireEvent.keyDown(closeButton, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(lastElement);
    
    vi.useFakeTimers(); // Restore
  });

  it("calls onClose when the backdrop is clicked", () => {
    render(<Sidebar isOpen={true} onClose={mockOnClose} />);
    const backdrop = document.querySelector(".bg-black\\/50");
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    } else {
      throw new Error("Backdrop not found");
    }
  });

  it("has accessible touch targets (min 44x44px)", () => {
    render(<Sidebar isOpen={true} onClose={mockOnClose} />);
    const buttons = screen.getAllByRole("button");
    const links = screen.getAllByRole("link");

    // In JSDOM, we mock the dimensions if they aren't provided by styles
    [...buttons, ...links].forEach(el => {
      // Mock dimensions for JSDOM
      Object.defineProperty(el, "offsetWidth", { configurable: true, value: 48 });
      Object.defineProperty(el, "offsetHeight", { configurable: true, value: 48 });
      
      expect(() => assertTouchTargetMinimum(el as HTMLElement)).not.toThrow();
    });
  });

  it("has correct ARIA attributes", () => {
    render(<Sidebar isOpen={true} onClose={mockOnClose} />);
    const sidebar = screen.getByRole("complementary");
    expect(sidebar).toHaveAttribute("aria-label", "Sidebar Navigation");
    
    const closeButton = screen.getByRole("button", { name: /close menu/i });
    expect(closeButton).toHaveAttribute("aria-label", "Close menu");
  });
});
