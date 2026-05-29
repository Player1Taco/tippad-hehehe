import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import type { Deployment as DeploymentType } from '../types';
import GlowCard from '../components/GlowCard';
import ProgressBar from '../components/ProgressBar';
import {
  Rocket,
  Globe,
  Server,
  Link2,
  Check,
  Loader2,
  ExternalLink,
  RefreshCw,
  Shield,
  Zap,
  Copy,
} from 'lucide-react';

const deploymentConfigs = [
  {
    type: 'frontend' as const,
    name: 'Frontend',
    provider: 'Vercel',
    icon: <Globe size={24} />,
    color: 'from-secondary to-blue-400',
    description: 'React app deployed to Vercel Edge Network',
    features: ['Global CDN', 'Auto SSL', 'Edge Functions'],
  },
  {
    type: 'backend' as const,
    name: 'Backend API',
    provider: 'Railway',
    icon: <Server size={24} />,
    color: 'from-success to-emerald-400',
    description: 'Node.js API deployed to Railway',
    features: ['Auto Scaling', 'Health Checks', 'Logging'],
  },
  {
    type: 'contract' as const,
    name: 'Smart Contract',
    provider: 'Solana Devnet',
    icon: <Link2 size={24} />,
    color: 'from-primary to-purple-400',
    description: 'Anchor program deployed to Solana Devnet',
    features: ['Program Verified', 'IDL Published', 'Devnet Ready'],
  },
];

export default function Deployment() {
  const { currentProject, addDeployment, updateDeploymentStatus, setView } = useAppStore();
  const [deploying, setDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState<Record<string, number>>({});
  const [deploySteps, setDeploySteps] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const hasBlockchain = currentProject?.idea.hasBlockchain;
  const configs = hasBlockchain ? deploymentConfigs : deploymentConfigs.filter((c) => c.type !== 'contract');

  const getDeployment = (type: string) =>
    currentProject?.deployments.find((d) => d.type === type);

  const simulateDeployment = async (type: 'frontend' | 'backend' | 'contract', provider: string) => {
    const deploymentId = `dep_${Date.now()}_${type}`;
    const steps: Record<string, string[]> = {
      frontend: ['Installing dependencies...', 'Building React app...', 'Optimizing assets...', 'Deploying to CDN...', 'Configuring SSL...', 'Live! 🎉'],
      backend: ['Installing dependencies...', 'Running health checks...', 'Building container...', 'Deploying to Railway...', 'Starting server...', 'Live! 🎉'],
      contract: ['Compiling program...', 'Running tests...', 'Building BPF...', 'Deploying to Devnet...', 'Publishing IDL...', 'Live! 🎉'],
    };

    const urls: Record<string, string> = {
      frontend: `https://${currentProject!.name.toLowerCase().replace(/\s+/g, '-')}.vercel.app`,
      backend: `https://${currentProject!.name.toLowerCase().replace(/\s+/g, '-')}-api.railway.app`,
      contract: `https://explorer.solana.com/address/${generateFakeAddress()}?cluster=devnet`,
    };

    addDeployment(currentProject!.id, {
      id: deploymentId,
      type,
      url: '',
      status: 'building',
      provider,
      deployedAt: new Date().toISOString(),
    });

    const typeSteps = steps[type];
    for (let i = 0; i < typeSteps.length; i++) {
      setDeploySteps((prev) => ({ ...prev, [type]: typeSteps[i] }));
      setDeployProgress((prev) => ({ ...prev, [type]: ((i + 1) / typeSteps.length) * 100 }));
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
    }

    updateDeploymentStatus(currentProject!.id, deploymentId, 'live', urls[type]);
  };

  const handleDeployAll = async () => {
    setDeploying(true);
    const promises = configs.map((config) =>
      simulateDeployment(config.type, config.provider)
    );
    await Promise.all(promises);
    setDeploying(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const allDeployed = configs.every((c) => getDeployment(c.type)?.status === 'live');

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10 animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Rocket size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Deploy {currentProject?.name}</h1>
              <p className="text-text-secondary">
                {allDeployed
                  ? 'All services are live and running!'
                  : 'Deploy your application to production with one click'}
              </p>
            </div>
          </div>
        </div>

        {/* Deploy All Button */}
        {!allDeployed && (
          <div className="mb-8">
            <button
              onClick={handleDeployAll}
              disabled={deploying}
              className={`w-full py-5 rounded-2xl font-bold text-lg transition-all ${
                deploying
                  ? 'bg-surface-light text-text-secondary cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary to-secondary text-white hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(158,127,255,0.3)]'
              }`}
            >
              {deploying ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 size={22} className="animate-spin" />
                  Deploying all services...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <Zap size={22} />
                  Deploy Everything
                </span>
              )}
            </button>
          </div>
        )}

        {/* Deployment Cards */}
        <div className="grid grid-cols-1 gap-6">
          {configs.map((config) => {
            const deployment = getDeployment(config.type);
            const progress = deployProgress[config.type] || 0;
            const step = deploySteps[config.type] || '';
            const isLive = deployment?.status === 'live';
            const isBuilding = deployment?.status === 'building';

            return (
              <GlowCard
                key={config.type}
                className="p-6 sm:p-8"
                hover={false}
                glowColor={isLive ? 'success' : 'primary'}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.color} bg-opacity-20 flex items-center justify-center flex-shrink-0 text-white`}
                    style={{ background: `linear-gradient(135deg, rgba(158,127,255,0.15), rgba(56,189,248,0.15))` }}
                  >
                    {config.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold">{config.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isLive ? 'bg-success/20 text-success' :
                        isBuilding ? 'bg-warning/20 text-warning' :
                        'bg-surface-light text-text-secondary'
                      }`}>
                        {isLive ? '● Live' : isBuilding ? '● Building' : '○ Ready'}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm mb-3">{config.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {config.features.map((feature) => (
                        <span key={feature} className="px-2.5 py-1 rounded-lg bg-surface-light text-xs text-text-secondary flex items-center gap-1">
                          <Shield size={10} />
                          {feature}
                        </span>
                      ))}
                    </div>

                    {isBuilding && (
                      <div className="mb-4">
                        <ProgressBar progress={progress} label={step} size="sm" color="primary" />
                      </div>
                    )}

                    {isLive && deployment?.url && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-background border border-border">
                        <ExternalLink size={14} className="text-success flex-shrink-0" />
                        <span className="text-sm font-mono text-success truncate flex-1">
                          {deployment.url}
                        </span>
                        <button
                          onClick={() => handleCopy(deployment.url, config.type)}
                          className="p-1.5 rounded-lg hover:bg-surface-light transition-colors"
                        >
                          {copied === config.type ? (
                            <Check size={14} className="text-success" />
                          ) : (
                            <Copy size={14} className="text-text-secondary" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {isLive ? (
                      <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                        <Check size={24} className="text-success" />
                      </div>
                    ) : isBuilding ? (
                      <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                        <Loader2 size={24} className="text-warning animate-spin" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center">
                        <Rocket size={24} className="text-text-secondary" />
                      </div>
                    )}
                  </div>
                </div>
              </GlowCard>
            );
          })}
        </div>

        {/* Post-deployment actions */}
        {allDeployed && (
          <div className="mt-10 text-center animate-slide-up">
            <div className="glass rounded-3xl p-10 border border-success/20">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2">All Systems Go!</h2>
              <p className="text-text-secondary mb-6">
                Your application is fully deployed and accessible worldwide.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setView('dashboard')}
                  className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => setView('editor')}
                  className="px-6 py-3 rounded-xl font-medium border border-border hover:border-primary/30 text-text-secondary hover:text-white transition-all"
                >
                  Edit & Redeploy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function generateFakeAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
