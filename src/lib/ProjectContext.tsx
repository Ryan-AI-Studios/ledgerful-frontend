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
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project>(defaultProject);
  const [allProjects, setAllProjects] = useState<Project[]>([defaultProject]);

  useEffect(() => {
    let cancelled = false;
    fetchProjects()
      .then((loaded) => {
        if (cancelled) return;
        const list = loaded.length > 0 ? loaded : [defaultProject];
        setAllProjects(list);

        try {
          const stored = window.localStorage.getItem(STORAGE_KEY);
          const next = stored ? list.find((p) => p.id === stored) : undefined;
          if (next) setProject(next);
        } catch {
          // localStorage unavailable (e.g., private mode) — fall back to default.
        }
      })
      .catch(() => {
        // Keep the default project list on failure.
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
      value={{ project, setProject: handleSetProject, allProjects }}
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
