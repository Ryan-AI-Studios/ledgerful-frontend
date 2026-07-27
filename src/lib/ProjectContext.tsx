"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { Project, activeProject as defaultProject, fetchProjects } from "./projects";
import { SESSION_INVALID_EVENT } from "./events";
import { DataSource, isApiError } from "./fallback";
import { getAuthToken } from "./utils";
import { TokenPrompt } from "@/components/auth/TokenPrompt";
import {
  HANDOFF_FAILED_MESSAGE,
  beginHandoffExchange,
  shouldBootstrapHandoff,
} from "./session-handoff";

const STORAGE_KEY = "ledgerful:active-project";

interface ProjectContextType {
  project: Project;
  setProject: (project: Project) => void;
  allProjects: Project[];
  isLoaded: boolean;
  projectsSource: DataSource;
  loadError: string | null;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project>(defaultProject);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [projectsSource, setProjectsSource] = useState<DataSource>("live");
  const [loadError, setLoadError] = useState<string | null>(null);
  // Seed from module token so Strict Mode remount after a completed exchange
  // does not flash TokenPrompt for one frame.
  const [hasToken, setHasToken] = useState(() => Boolean(getAuthToken()));
  const [isLoaded, setIsLoaded] = useState(true);
  const [authRetry, setAuthRetry] = useState(0);
  // Seed true when `#c=` is present or exchange is in-flight so TokenPrompt
  // does not flash during exchange / Strict Mode remount.
  const [bootstrapping, setBootstrapping] = useState(shouldBootstrapHandoff);
  const [handoffFailedMessage, setHandoffFailedMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    const tokenPresent = Boolean(getAuthToken());
    // seed external module token into state once on mount (DoD-6); getAuthToken is pure post-0080
    // eslint-disable-next-line react-hooks/set-state-in-effect -- DoD-6 mount seed from pure getAuthToken
    setHasToken(tokenPresent);

    if (tokenPresent) {
      setIsLoaded(false);
      setBootstrapping(false);
    } else {
      // Shared single-flight: remounts join in-flight exchange instead of
      // abandoning a code that was already stripped from the hash.
      const exchange = beginHandoffExchange();
      if (exchange) {
        setBootstrapping(true);
        void exchange
          .then(() => {
            // Success path ignores cancelled: setAuthToken already ran at module
            // level; apply React state if this mount is still active. A Strict
            // Mode remount joins the same promise and seeds from getAuthToken().
            if (cancelled) return;
            if (getAuthToken()) {
              setHasToken(true);
              setIsLoaded(false);
              setAuthRetry((n) => n + 1);
            }
            setBootstrapping(false);
          })
          .catch(() => {
            if (cancelled) return;
            setHandoffFailedMessage(HANDOFF_FAILED_MESSAGE);
            setBootstrapping(false);
          });
      } else {
        setBootstrapping(false);
      }
    }

    const onInvalid = () => {
      setHasToken(false);
      setIsLoaded(true);
      setBootstrapping(false);
    };
    window.addEventListener(SESSION_INVALID_EVENT, onInvalid);
    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_INVALID_EVENT, onInvalid);
    };
  }, []);

  useEffect(() => {
    if (!hasToken) {
      return;
    }
    let cancelled = false;
    // Mark loading while projects resolve (covers onAuthed path; seed path also sets false above).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- projects fetch gate for isLoaded
    setIsLoaded(false);
    fetchProjects()
      .then((result) => {
        if (cancelled) return;
        const loaded = result.data;
        setAllProjects(loaded);
        setProjectsSource(result.source);
        setIsLoaded(true);

        if (loaded.length > 0) {
          try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            const next = stored ? loaded.find((p) => p.id === stored) : loaded[0];
            if (next) setProject(next);
          } catch {
            setProject(loaded[0]);
          }
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // Token reset + TokenPrompt re-show are handled by apiFetch session
        // invalidation (SESSION_INVALID_EVENT). Keep catch safe: set load
        // error state without fighting the unmount.
        if (isApiError(err) && (err.status === 401 || err.status === 403)) {
          setLoadError("Authentication failed. Please check your token.");
          setAllProjects([]);
          setIsLoaded(true);
        } else {
          setAllProjects([defaultProject]);
          setProjectsSource("mock");
          setIsLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [hasToken, authRetry]);

  const handleSetProject = useCallback((next: Project) => {
    setProject(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next.id);
    } catch {
      // ignore storage errors.
    }
  }, []);

  if (bootstrapping) {
    // Hold an empty shell so TokenPrompt does not flash during handoff exchange.
    return null;
  }

  if (!hasToken) {
    return (
      <TokenPrompt
        message={handoffFailedMessage ?? undefined}
        handoffFailed={Boolean(handoffFailedMessage)}
        onAuthed={() => {
          setHasToken(true);
          setIsLoaded(false);
          setAuthRetry((n) => n + 1);
        }}
      />
    );
  }

  return (
    <ProjectContext.Provider
      value={{ project, setProject: handleSetProject, allProjects, isLoaded, projectsSource, loadError }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
