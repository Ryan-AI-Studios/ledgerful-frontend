"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { fetchStatus } from "./status-data";

interface DaemonStatusContextType {
  isDaemonOffline: boolean;
}

const DaemonStatusContext = createContext<DaemonStatusContextType>({
  isDaemonOffline: false,
});

export function DaemonStatusProvider({ children }: { children: ReactNode }) {
  const [isDaemonOffline, setIsDaemonOffline] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        await fetchStatus();
        setIsDaemonOffline(false);
      } catch {
        setIsDaemonOffline(true);
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DaemonStatusContext.Provider value={{ isDaemonOffline }}>
      {children}
    </DaemonStatusContext.Provider>
  );
}

export function useDaemonStatus(): boolean {
  const ctx = useContext(DaemonStatusContext);
  return ctx.isDaemonOffline;
}