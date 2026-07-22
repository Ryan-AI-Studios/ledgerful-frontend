"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { fetchStatus } from "./status-data";
import { isApiError } from "./fallback";

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
        // Connectivity-only: discard data/source; failures mean offline.
        await fetchStatus();
        setIsDaemonOffline(false);
      } catch (err) {
        if (isApiError(err) && (err.status === 401 || err.status === 403)) {
          setIsDaemonOffline(false);
        } else {
          setIsDaemonOffline(true);
        }
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
