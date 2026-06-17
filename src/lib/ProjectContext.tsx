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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProjects()
      .then((loaded) => {
        if (cancelled) return;
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
        // Fallback to default if load fails
        setAllProjects([defaultProject]);
        setIsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSetProject = useCallback((next: Project) => {
    setProject(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next.id);
    } catch {
      // ignore storage errors.
    }
  }, []);

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
