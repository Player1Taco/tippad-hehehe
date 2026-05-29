import React from 'react';
import { useAppStore } from '../store/appStore';
import {
  FolderOpen,
  Code2,
  Rocket,
  FileText,
  Settings,
  Trash2,
  Clock,
} from 'lucide-react';

export default function Sidebar() {
  const { sidebarOpen, currentProject, projects, setView, setCurrentProject, deleteProject } = useAppStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="w-72 glass-strong border-r border-border/50 flex flex-col h-[calc(100vh-4rem)] sticky top-16 overflow-hidden">
      {currentProject && (
        <div className="p-4 border-b border-border/50">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Current Project
          </h3>
          <div className="space-y-1">
            {currentProject.files.length > 0 && (
              <button
                onClick={() => setView('editor')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-surface-light transition-colors text-left group"
              >
                <Code2 size={16} className="text-primary" />
                <span>Code Editor</span>
                <span className="ml-auto text-xs text-text-secondary font-mono">
                  {currentProject.files.length} files
                </span>
              </button>
            )}
            {currentProject.status === 'ready' && (
              <button
                onClick={() => setView('deployment')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-surface-light transition-colors text-left"
              >
                <Rocket size={16} className="text-success" />
                <span>Deploy</span>
              </button>
            )}
            {currentProject.status === 'deployed' && (
              <button
                onClick={() => setView('deployment')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-surface-light transition-colors text-left"
              >
                <Rocket size={16} className="text-success" />
                <span>Deployments</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
          All Projects
        </h3>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen size={32} className="mx-auto text-text-secondary/50 mb-2" />
            <p className="text-sm text-text-secondary">No projects yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all ${
                  currentProject?.id === project.id
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-surface-light'
                }`}
                onClick={() => {
                  setCurrentProject(project);
                  if (project.files.length > 0) {
                    setView('editor');
                  } else {
                    setView('intake');
                  }
                }}
              >
                <FileText size={16} className={currentProject?.id === project.id ? 'text-primary' : 'text-text-secondary'} />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{project.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock size={10} className="text-text-secondary" />
                    <span className="text-xs text-text-secondary">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject(project.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-error/20 text-text-secondary hover:text-error transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border/50">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-surface-light transition-colors text-text-secondary">
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
