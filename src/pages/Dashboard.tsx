import React from 'react';
import { useAppStore } from '../store/appStore';
import GlowCard from '../components/GlowCard';
import {
  Plus,
  FolderOpen,
  Clock,
  Code2,
  Rocket,
  Trash2,
  FileCode,
  Globe,
  Server,
  Link2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function Dashboard() {
  const { projects, setView, setCurrentProject, deleteProject } = useAppStore();

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    draft: { color: 'text-text-secondary', bg: 'bg-surface-light', label: 'Draft' },
    generating: { color: 'text-warning', bg: 'bg-warning/20', label: 'Generating' },
    ready: { color: 'text-primary', bg: 'bg-primary/20', label: 'Ready' },
    deploying: { color: 'text-secondary', bg: 'bg-secondary/20', label: 'Deploying' },
    deployed: { color: 'text-success', bg: 'bg-success/20', label: 'Deployed' },
  };

  const handleProjectClick = (project: typeof projects[0]) => {
    setCurrentProject(project);
    if (project.status === 'deployed') {
      setView('deployment');
    } else if (project.files.length > 0) {
      setView('editor');
    } else {
      setView('intake');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold mb-1">Your Projects</h1>
            <p className="text-text-secondary">
              {projects.length === 0
                ? 'Create your first project to get started'
                : `${projects.length} project${projects.length !== 1 ? 's' : ''} created`}
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentProject(null);
              setView('intake');
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 transition-all hover:shadow-[0_0_30px_rgba(158,127,255,0.3)]"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-24 h-24 rounded-3xl bg-surface mx-auto flex items-center justify-center mb-6">
              <FolderOpen size={40} className="text-text-secondary/30" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No projects yet</h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Describe your idea and Tippad will generate a complete full-stack application for you.
            </p>
            <button
              onClick={() => setView('intake')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 transition-all"
            >
              <Sparkles size={20} />
              Create Your First App
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const status = statusConfig[project.status] || statusConfig.draft;
              const frontendFiles = project.files.filter((f) => f.category === 'frontend').length;
              const backendFiles = project.files.filter((f) => f.category === 'backend').length;
              const contractFiles = project.files.filter((f) => f.category === 'contract').length;

              return (
                <GlowCard
                  key={project.id}
                  className="p-6 group"
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Code2 size={22} className="text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-error/20 text-text-secondary hover:text-error transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                    {project.description}
                  </p>

                  {project.files.length > 0 && (
                    <div className="flex items-center gap-3 mb-4">
                      {frontendFiles > 0 && (
                        <span className="flex items-center gap-1 text-xs text-secondary">
                          <Globe size={12} /> {frontendFiles}
                        </span>
                      )}
                      {backendFiles > 0 && (
                        <span className="flex items-center gap-1 text-xs text-success">
                          <Server size={12} /> {backendFiles}
                        </span>
                      )}
                      {contractFiles > 0 && (
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <Link2 size={12} /> {contractFiles}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-text-secondary ml-auto">
                        <FileCode size={12} /> {project.files.length} files
                      </span>
                    </div>
                  )}

                  {project.deployments.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      {project.deployments.map((dep) => (
                        <span
                          key={dep.id}
                          className={`w-2 h-2 rounded-full ${
                            dep.status === 'live' ? 'bg-success' :
                            dep.status === 'building' ? 'bg-warning animate-pulse' :
                            'bg-text-secondary'
                          }`}
                          title={`${dep.type}: ${dep.status}`}
                        />
                      ))}
                      <span className="text-xs text-text-secondary">
                        {project.deployments.filter((d) => d.status === 'live').length}/{project.deployments.length} live
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-border/30">
                    <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <Clock size={12} />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                    <ArrowRight size={16} className="text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </GlowCard>
              );
            })}

            {/* New Project Card */}
            <GlowCard
              className="p-6 flex flex-col items-center justify-center min-h-[240px] border-dashed"
              onClick={() => {
                setCurrentProject(null);
                setView('intake');
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-surface-light flex items-center justify-center mb-4">
                <Plus size={24} className="text-text-secondary" />
              </div>
              <p className="font-medium text-text-secondary">Create New Project</p>
            </GlowCard>
          </div>
        )}
      </div>
    </div>
  );
}
