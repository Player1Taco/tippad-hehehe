import React from 'react';
import { useAppStore } from '../store/appStore';
import {
  Zap,
  Menu,
  Plus,
  LayoutDashboard,
  ChevronLeft,
} from 'lucide-react';

export default function Header() {
  const { currentView, setView, sidebarOpen, setSidebarOpen, currentProject } = useAppStore();

  return (
    <header className="h-16 glass-strong border-b border-border/50 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {currentView !== 'landing' && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-surface-light transition-colors text-text-secondary hover:text-white"
          >
            <Menu size={20} />
          </button>
        )}
        <button
          onClick={() => setView('landing')}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gradient-static">Tippad</span>
        </button>

        {currentProject && currentView !== 'landing' && (
          <div className="flex items-center gap-2 text-text-secondary">
            <ChevronLeft size={16} />
            <span className="text-sm font-medium text-white">{currentProject.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              currentProject.status === 'deployed' ? 'bg-success/20 text-success' :
              currentProject.status === 'ready' ? 'bg-primary/20 text-primary' :
              currentProject.status === 'generating' ? 'bg-warning/20 text-warning' :
              'bg-surface-light text-text-secondary'
            }`}>
              {currentProject.status}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {currentView !== 'landing' && (
          <>
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-white hover:bg-surface-light transition-all"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </button>
            <button
              onClick={() => {
                useAppStore.getState().setCurrentProject(null);
                setView('intake');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              New Project
            </button>
          </>
        )}
      </div>
    </header>
  );
}
