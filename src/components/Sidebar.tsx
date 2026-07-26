"use client";

import {
  LayoutDashboard,
  BookOpen,
  GitCommit,
  Settings,
  BarChart3,
  Share2,
  Activity,
  FolderGit2,
  X,
  Shield,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProject } from "@/lib/ProjectContext";
import { StatusDot } from "./StatusDot";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Tailwind `lg` — sidebar is always visible as a static column at this width. */
const DESKTOP_NAV_MQ = "(min-width: 1024px)";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/changes", label: "Changes", icon: GitCommit },
  { href: "/ledger", label: "Ledger", icon: BookOpen },
  { href: "/hotspots", label: "Hotspots", icon: BarChart3 },
  { href: "/trends", label: "Trends", icon: Activity },
  { href: "/graph", label: "Graph", icon: Share2 },
  { href: "/compliance", label: "Compliance", icon: Shield },
  { href: "/verify", label: "Verify", icon: CheckSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { project } = useProject();
  const sidebarRef = useRef<HTMLElement>(null);
  // Desktop (`lg+`): column is always on-screen via CSS — never aria-hidden.
  // Mobile: drawer is off-screen when closed; aria-hidden + inert apply only then.
  const [isDesktopNav, setIsDesktopNav] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(DESKTOP_NAV_MQ);
    const sync = () => setIsDesktopNav(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const mobileDrawerOpen = Boolean(isOpen);
  /** Hidden from AT only when the mobile drawer is actually closed. */
  const hideFromA11y = !isDesktopNav && !mobileDrawerOpen;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      // Focus trap only for the open mobile drawer (desktop is always in page tab order).
      if (e.key === "Tab" && mobileDrawerOpen && !isDesktopNav && sidebarRef.current) {
        const focusableElements = sidebarRef.current.querySelectorAll(
          'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };
    if (mobileDrawerOpen && !isDesktopNav) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        const focusableElements = sidebarRef.current?.querySelectorAll(
          'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
        );
        if (focusableElements && focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus();
        }
      }, 0);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [mobileDrawerOpen, isDesktopNav, onClose]);

  // When the mobile drawer closes while focus is still inside it, move focus to main
  // so we never leave a focused node under aria-hidden (browser console warning).
  useEffect(() => {
    if (hideFromA11y && sidebarRef.current?.contains(document.activeElement)) {
      const main = document.getElementById("main");
      if (main instanceof HTMLElement) {
        if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
        main.focus({ preventScroll: true });
      } else if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [hideFromA11y]);

  const handleNavClick = () => {
    // Close mobile drawer on navigate; desktop no-op (onClose still clears open flag).
    onClose?.();
  };

  return (
    <>
      {/* Backdrop — mobile drawer only */}
      {mobileDrawerOpen && !isDesktopNav && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="mobile-sidebar"
        ref={sidebarRef}
        role="complementary"
        aria-label="Sidebar Navigation"
        aria-hidden={hideFromA11y ? true : undefined}
        // inert when the mobile drawer is closed — blocks focus into off-screen links
        {...(hideFromA11y ? { inert: true } : {})}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] bg-[var(--color-surface)] border-r border-[var(--color-border)] p-4 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto lg:z-auto",
          mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between lg:hidden mb-4">
          <span className="font-semibold text-[var(--color-text-primary)]">Menu</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Main" className="flex-1">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-100 border-l-2 ${
                      isActive
                        ? "relative bg-[rgba(0,229,160,0.06)] text-[var(--color-primary)] border-[var(--color-primary)]"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto pt-4 border-t border-[var(--color-border-muted)]">
          <Link
            href="/projects"
            onClick={handleNavClick}
            className="flex items-center gap-2 px-3 py-3 rounded-md text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors duration-100"
          >
            <FolderGit2 className="w-4 h-4" aria-hidden="true" />
            <div className="flex-1">
              <div className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-0.5 leading-normal">
                Project
              </div>
              <div className="flex items-center gap-2 text-sm">
                <StatusDot status={project.status} />
                <span className="truncate">{project.name}</span>
              </div>
            </div>
          </Link>

          <Link
            href="/status"
            onClick={handleNavClick}
            className="flex items-center gap-2 px-3 py-3 rounded-md text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors duration-100 mt-1"
          >
            <Activity className="w-4 h-4" aria-hidden="true" />
            <div className="flex-1">
              <div className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-0.5 leading-normal">
                Status
              </div>
              <div className="flex items-center gap-2 text-sm">
                <StatusDot status={project.status} />
                <span className="capitalize">{project.status}</span>
              </div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
