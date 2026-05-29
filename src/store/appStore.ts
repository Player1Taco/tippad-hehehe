import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, IdeaIntake, GeneratedFile, AppView, Deployment } from '../types';

interface AppState {
  currentView: AppView;
  currentProject: Project | null;
  projects: Project[];
  isGenerating: boolean;
  generationProgress: number;
  generationStep: string;
  sidebarOpen: boolean;

  setView: (view: AppView) => void;
  setSidebarOpen: (open: boolean) => void;
  createProject: (idea: IdeaIntake) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
  setGenerating: (generating: boolean) => void;
  setGenerationProgress: (progress: number, step: string) => void;
  addFilesToProject: (projectId: string, files: GeneratedFile[]) => void;
  updateFileContent: (projectId: string, filePath: string, content: string) => void;
  addDeployment: (projectId: string, deployment: Deployment) => void;
  updateDeploymentStatus: (projectId: string, deploymentId: string, status: Deployment['status'], url?: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentView: 'landing',
      currentProject: null,
      projects: [],
      isGenerating: false,
      generationProgress: 0,
      generationStep: '',
      sidebarOpen: true,

      setView: (view) => set({ currentView: view }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      createProject: (idea) => {
        const project: Project = {
          id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: idea.appName,
          description: idea.appPurpose,
          idea,
          files: [],
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deployments: [],
        };
        set((state) => ({
          projects: [project, ...state.projects],
          currentProject: project,
        }));
        return project;
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
          currentProject:
            state.currentProject?.id === id
              ? { ...state.currentProject, ...updates, updatedAt: new Date().toISOString() }
              : state.currentProject,
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
        }));
      },

      setCurrentProject: (project) => set({ currentProject: project }),

      setGenerating: (generating) => set({ isGenerating: generating }),

      setGenerationProgress: (progress, step) =>
        set({ generationProgress: progress, generationStep: step }),

      addFilesToProject: (projectId, files) => {
        set((state) => {
          const updated = state.projects.map((p) =>
            p.id === projectId
              ? { ...p, files: [...p.files, ...files], status: 'ready' as const, updatedAt: new Date().toISOString() }
              : p
          );
          const current = state.currentProject?.id === projectId
            ? { ...state.currentProject, files: [...state.currentProject.files, ...files], status: 'ready' as const, updatedAt: new Date().toISOString() }
            : state.currentProject;
          return { projects: updated, currentProject: current };
        });
      },

      updateFileContent: (projectId, filePath, content) => {
        set((state) => {
          const updateFiles = (files: GeneratedFile[]) =>
            files.map((f) => (f.path === filePath ? { ...f, content } : f));
          return {
            projects: state.projects.map((p) =>
              p.id === projectId ? { ...p, files: updateFiles(p.files) } : p
            ),
            currentProject:
              state.currentProject?.id === projectId
                ? { ...state.currentProject, files: updateFiles(state.currentProject.files) }
                : state.currentProject,
          };
        });
      },

      addDeployment: (projectId, deployment) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, deployments: [...p.deployments, deployment], status: 'deploying' as const }
              : p
          ),
          currentProject:
            state.currentProject?.id === projectId
              ? { ...state.currentProject, deployments: [...state.currentProject.deployments, deployment], status: 'deploying' as const }
              : state.currentProject,
        }));
      },

      updateDeploymentStatus: (projectId, deploymentId, status, url) => {
        const updateDeps = (deps: Deployment[]) =>
          deps.map((d) => (d.id === deploymentId ? { ...d, status, ...(url ? { url } : {}) } : d));
        set((state) => {
          const updatedProjects = state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const newDeps = updateDeps(p.deployments);
            const allLive = newDeps.every((d) => d.status === 'live');
            return { ...p, deployments: newDeps, status: allLive ? 'deployed' as const : p.status };
          });
          const current = state.currentProject?.id === projectId
            ? (() => {
                const newDeps = updateDeps(state.currentProject!.deployments);
                const allLive = newDeps.every((d) => d.status === 'live');
                return { ...state.currentProject!, deployments: newDeps, status: allLive ? 'deployed' as const : state.currentProject!.status };
              })()
            : state.currentProject;
          return { projects: updatedProjects, currentProject: current };
        });
      },
    }),
    {
      name: 'tippad-storage',
      partialize: (state) => ({
        projects: state.projects,
      }),
    }
  )
);
