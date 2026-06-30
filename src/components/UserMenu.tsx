"use client";

import React, { useState, useRef, useEffect } from "react";
import { fetchSession } from "@/lib/session-data";
import { UserSession } from "@/lib/types";
import { DataSourceBadge } from "./DataSourceBadge";
import { User, Settings, LogOut } from "lucide-react";
import Link from "next/link";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [source, setSource] = useState<import("@/lib/fallback").DataSource>("live");
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchSession().then((result) => {
      setSession(result.data);
      setSource(result.source);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) && 
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
      // Accessibility: Focus the first menu item when opening
      setTimeout(() => {
        const firstItem = menuRef.current?.querySelector<HTMLAnchorElement | HTMLButtonElement>('[role="menuitem"]');
        firstItem?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const items = Array.from(menuRef.current?.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>('[role="menuitem"]') || []);
    if (items.length === 0) return;

    const index = items.indexOf(document.activeElement as HTMLAnchorElement | HTMLButtonElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (index + 1) % items.length;
      items[nextIndex].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (index - 1 + items.length) % items.length;
      items[prevIndex].focus();
    } else if (e.key === "Tab") {
      // Focus trap within the menu
      if (e.shiftKey) {
        if (document.activeElement === items[0]) {
          e.preventDefault();
          items[items.length - 1].focus();
        }
      } else {
        if (document.activeElement === items[items.length - 1]) {
          e.preventDefault();
          items[0].focus();
        }
      }
    }
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  if (loading) {
    return <div className="w-11 h-11 rounded-full bg-[var(--color-surface-raised)] animate-pulse" />;
  }

  const initials = session?.name
    ? session.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={toggleMenu}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="User menu"
        className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-semibold overflow-hidden transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-alt)] ${
          isOpen ? "ring-2 ring-[var(--color-primary)]" : "bg-[var(--color-surface-alt)] border border-[var(--color-border)] hover:border-[var(--color-primary)]"
        }`}
      >
        {session?.avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={session.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[var(--color-text-primary)]">{initials}</span>
        )}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          onKeyDown={handleKeyDown}
          className="absolute right-0 mt-2 w-56 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.4)] py-1 z-50 focus:outline-none"
        >
          <div className="px-3 py-2 border-b border-[var(--color-border-muted)] mb-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{session?.name}</p>
              <DataSourceBadge source={source} />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] truncate">{session?.email}</p>
            {session?.role && (
              <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--color-surface-alt)] text-[var(--color-primary)] border border-[var(--color-border-muted)]">
                {session.role}
              </span>
            )}
          </div>
          
          <Link
            href="/profile"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-alt)] focus:bg-[var(--color-surface-alt)] focus:outline-none transition-colors duration-100 mx-1 rounded-md"
            onClick={() => setIsOpen(false)}
          >
            <User className="w-4 h-4 text-[var(--color-text-muted)]" />
            Profile
          </Link>
          
          <Link
            href="/settings"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-alt)] focus:bg-[var(--color-surface-alt)] focus:outline-none transition-colors duration-100 mx-1 rounded-md"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="w-4 h-4 text-[var(--color-text-muted)]" />
            Settings
          </Link>
          
          <div className="h-px bg-[var(--color-border-muted)] my-1 mx-1" />
          
          <button
            role="menuitem"
            className="w-[calc(100%-8px)] flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-surface-alt)] focus:bg-[var(--color-surface-alt)] focus:outline-none transition-colors duration-100 mx-1 rounded-md text-left"
            onClick={() => {
              setIsOpen(false);
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
