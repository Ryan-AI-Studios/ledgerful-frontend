"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { Project, projects, activeProject as defaultProject } from "./projects";

const STORAGE_KEY = "ledgerful:active-project";

interface ProjectContextType {
  project: Project;
  setProject: (project: Project) => void;
  allProjects: Project[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

function findProject(id: string | null): Project | undefined {
  if (!id) return undefined;
  return projects.find((p) => p.id === id);
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project>(defaultProject);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const next = findProject(stored);
      if (next) setProject(next);
    } catch {
      // localStorage unavailable (e.g., private mode) — fall back to default.
    }
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
      value={{ project, setProject: handleSetProject, allProjects: projects }}
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
