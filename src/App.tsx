import React from 'react';
import { useAppStore } from './store/appStore';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import IdeaIntake from './pages/IdeaIntake';
import CodeGeneration from './pages/CodeGeneration';
import CodeEditor from './pages/CodeEditor';
import Deployment from './pages/Deployment';
import Dashboard from './pages/Dashboard';

function AppContent() {
  const { currentView, sidebarOpen } = useAppStore();

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <Landing />;
      case 'intake':
        return <IdeaIntake />;
      case 'generating':
        return <CodeGeneration />;
      case 'editor':
        return <CodeEditor />;
      case 'deployment':
        return <Deployment />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return <Landing />;
    }
  };

  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        {renderView()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background circuit-pattern">
      <Header />
      <div className="flex">
        {currentView !== 'editor' && <Sidebar />}
        <main className="flex-1 min-w-0">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
