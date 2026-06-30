"use client";

import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { GlobalOfflineBanner } from "./GlobalOfflineBanner";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";

interface PageLayoutProps {
  children: ReactNode;
  title: string;
}

export function PageLayout({ children, title }: PageLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsSidebarOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main"
        className="absolute -top-10 left-0 bg-[var(--color-primary)] text-[var(--color-text-inverse)] px-3 py-2 text-sm font-medium rounded-br-md focus:top-0 transition-none z-50"
      >
        Skip to main content
      </a>

      <TopNav onToggleMenu={() => setIsSidebarOpen(!isSidebarOpen)} isOpen={isSidebarOpen} />

      <GlobalOfflineBanner />

      <div className="flex flex-1 relative">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main id="main" className="flex-1 p-4 md:p-8 min-w-0">
          <div className="max-w-5xl">
            <h1 className="text-[1.5rem] font-bold tracking-[-0.015em] mb-6">
              {title}
            </h1>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
