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
import { getAuthToken } from "./utils";
import { TokenPrompt } from "@/components/auth/TokenPrompt";

const STORAGE_KEY = "ledgerful:active-project";

interface ProjectContextType {
  project: Project;
  setProject: (project: Project) => void;
  allProjects: Project[];
  isLoaded: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project>(defaultProject);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const hasToken = Boolean(getAuthToken());
  const [isLoaded, setIsLoaded] = useState(hasToken ? false : true);
  const [authRetry, setAuthRetry] = useState(0);

  useEffect(() => {
    if (!hasToken) {
      return;
    }
    let cancelled = false;
    fetchProjects()
      .then((result) => {
        if (cancelled) return;
        const loaded = result.data;
        setAllProjects(loaded);
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
      .catch(() => {
        setAllProjects([defaultProject]);
        setIsLoaded(true);
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

  if (!hasToken) {
    return <TokenPrompt onAuthed={() => setAuthRetry((n) => n + 1)} />;
  }

  return (
    <ProjectContext.Provider
      value={{ project, setProject: handleSetProject, allProjects, isLoaded }}
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
