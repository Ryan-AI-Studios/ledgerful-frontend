import { render, screen, fireEvent } from "@testing-library/react";
import { UserMenu } from "../UserMenu";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getAuthToken,
  resetInMemoryToken,
  setAuthToken,
} from "@/lib/utils";

// fetchSession is called on mount and now returns WithSource<UserSession>
vi.mock("@/lib/session-data", () => ({
  fetchSession: vi.fn(() => Promise.resolve({
    data: {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      role: "admin",
    },
    source: "live",
  })),
}));

describe("UserMenu Component", () => {
  beforeEach(() => {
    resetInMemoryToken();
  });

  afterEach(() => {
    resetInMemoryToken();
  });

  it("renders the trigger button with user initial", async () => {
    render(<UserMenu />);
    const trigger = await screen.findByLabelText("User menu");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("T");
  });

  it("opens the menu on click", async () => {
    render(<UserMenu />);
    const trigger = await screen.findByLabelText("User menu");
    fireEvent.click(trigger);
    
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("closes the menu on Escape key", async () => {
    render(<UserMenu />);
    const trigger = await screen.findByLabelText("User menu");
    fireEvent.click(trigger);
    
    expect(screen.getByRole("menu")).toBeInTheDocument();
    
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the menu when clicking outside", async () => {
    render(<UserMenu />);
    const trigger = await screen.findByLabelText("User menu");
    fireEvent.click(trigger);
    
    expect(screen.getByRole("menu")).toBeInTheDocument();
    
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("Sign out clears token and dispatches ledgerful:session-invalid", async () => {
    setAuthToken("menu-session-token");
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    render(<UserMenu />);
    const trigger = await screen.findByLabelText("User menu");
    fireEvent.click(trigger);

    fireEvent.click(screen.getByRole("menuitem", { name: /sign out/i }));

    expect(getAuthToken()).toBeNull();
    const invalidEvents = dispatchSpy.mock.calls
      .map((c) => c[0] as Event)
      .filter((e) => e instanceof Event && e.type === "ledgerful:session-invalid");
    expect(invalidEvents.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    dispatchSpy.mockRestore();
  });
});
