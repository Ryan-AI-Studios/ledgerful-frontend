"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
}

export function Reveal({ children, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"visible" | "hidden" | "revealed">("visible");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const rect = el.getBoundingClientRect();
    const belowFold = rect.top > window.innerHeight;
    if (!belowFold) return;

    let observer: IntersectionObserver | null = null;
    try {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setState("revealed");
            observer?.disconnect();
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
      );
    } catch {
      return;
    }

    const hide = window.requestAnimationFrame(() => setState("hidden"));
    observer.observe(el);

    const fallback = window.setTimeout(() => setState("revealed"), 1500);

    return () => {
      observer?.disconnect();
      window.clearTimeout(fallback);
      window.cancelAnimationFrame(hide);
    };
  }, []);

  const hidden = state === "hidden";

  return (
    <div
      ref={ref}
      className={`${className} transition-[opacity,transform] duration-300 ${
        hidden ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      {children}
    </div>
  );
}
