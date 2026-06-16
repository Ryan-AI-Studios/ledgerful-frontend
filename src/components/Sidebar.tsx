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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProject } from "@/lib/ProjectContext";
import { StatusDot } from "./StatusDot";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/changes", label: "Changes", icon: GitCommit },
  { href: "/ledger", label: "Ledger", icon: BookOpen },
  { href: "/hotspots", label: "Hotspots", icon: BarChart3 },
  { href: "/graph", label: "Graph", icon: Share2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { project } = useProject();

  return (
    <aside className="w-[260px] flex-shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] p-4 flex flex-col">
      <nav aria-label="Main" className="flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-100 ${
                    isActive
                      ? "relative bg-[rgba(0,229,160,0.06)] text-[var(--color-primary)] pl-4"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                  }`}
                  style={isActive ? { borderLeft: "2px solid var(--color-primary)" } : undefined}
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
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors duration-100"
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
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors duration-100 mt-1"
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
  );
}
