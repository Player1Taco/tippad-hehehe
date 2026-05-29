import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import AnimatedBackground from '../components/AnimatedBackground';
import {
  Zap,
  Code2,
  Rocket,
  Layers,
  ArrowRight,
  Sparkles,
  Globe,
  Shield,
  Terminal,
  Cpu,
  GitBranch,
  Box,
} from 'lucide-react';

const typewriterTexts = [
  'a DeFi trading platform',
  'an NFT marketplace',
  'a social media app',
  'a project management tool',
  'a blockchain game',
  'an e-commerce store',
  'a real-time chat app',
];

export default function Landing() {
  const { setView } = useAppStore();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const text = typewriterTexts[currentTextIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayText.length < text.length) {
      timeout = setTimeout(() => {
        setDisplayText(text.slice(0, displayText.length + 1));
      }, 60);
    } else if (!isDeleting && displayText.length === text.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText.length > 0) {
      timeout = setTimeout(() => {
        setDisplayText(text.slice(0, displayText.length - 1));
      }, 30);
    } else if (isDeleting && displayText.length === 0) {
      setIsDeleting(false);
      setCurrentTextIndex((prev) => (prev + 1) % typewriterTexts.length);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentTextIndex]);

  const features = [
    {
      icon: <Sparkles size={24} />,
      title: 'AI-Powered Generation',
      description: 'Describe your idea and watch it transform into production-ready code across multiple stacks.',
      color: 'from-primary to-purple-400',
    },
    {
      icon: <Layers size={24} />,
      title: 'Full-Stack Output',
      description: 'React frontend, Node.js backend, and Solana smart contracts — all generated simultaneously.',
      color: 'from-secondary to-blue-400',
    },
    {
      icon: <Rocket size={24} />,
      title: 'Instant Deployment',
      description: 'One-click deploy to Vercel, Railway, and Solana Devnet. Zero configuration needed.',
      color: 'from-accent to-pink-400',
    },
    {
      icon: <Code2 size={24} />,
      title: 'Built-in Editor',
      description: 'Review and customize generated code with a professional Monaco-powered editor.',
      color: 'from-success to-emerald-400',
    },
  ];

  const stats = [
    { value: '3', label: 'Stacks Generated', icon: <Box size={18} /> },
    { value: '<30s', label: 'Generation Time', icon: <Cpu size={18} /> },
    { value: '1-Click', label: 'Deployment', icon: <Rocket size={18} /> },
    { value: '100%', label: 'Production Ready', icon: <Shield size={18} /> },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      {/* Gradient orbs */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-8">
            <Zap size={14} className="text-primary" />
            <span className="text-sm font-medium text-text-secondary">
              The future of app development is here
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] mb-6 tracking-tight">
            <span className="text-white">Build</span>
            <br />
            <span className="text-gradient">{displayText}</span>
            <span className="animate-pulse text-primary">|</span>
            <br />
            <span className="text-white">in seconds.</span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Describe your idea. Tippad generates a complete React frontend, Node.js backend,
            and Solana smart contracts — then deploys everything instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <button
              onClick={() => setView('intake')}
              className="group relative px-8 py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-primary to-secondary text-white overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(158,127,255,0.4)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Building
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => setView('dashboard')}
              className="px-8 py-4 rounded-2xl font-semibold text-lg border border-border hover:border-primary/30 text-text-secondary hover:text-white transition-all hover:bg-surface/50"
            >
              View Dashboard
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl w-full animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {stats.map((stat, i) => (
            <div key={i} className="glass rounded-2xl p-4 text-center border border-border/30 hover:border-primary/20 transition-all">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-primary">{stat.icon}</span>
                <span className="text-2xl font-bold text-white">{stat.value}</span>
              </div>
              <span className="text-xs text-text-secondary">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="text-gradient">How it works</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              Three simple steps from idea to deployed application
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {[
              {
                step: '01',
                title: 'Describe Your Idea',
                desc: 'Answer guided questions about your app\'s purpose, features, and target users.',
                icon: <Terminal size={28} />,
              },
              {
                step: '02',
                title: 'Generate Code',
                desc: 'Watch as Tippad creates your complete full-stack application in real-time.',
                icon: <GitBranch size={28} />,
              },
              {
                step: '03',
                title: 'Deploy Instantly',
                desc: 'One click deploys your frontend, backend, and smart contracts simultaneously.',
                icon: <Globe size={28} />,
              },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="glass rounded-3xl p-8 border border-border/30 hover:border-primary/30 transition-all duration-500 hover:scale-[1.03]">
                  <div className="text-6xl font-black text-primary/10 mb-4">{item.step}</div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 text-primary">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight size={24} className="text-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="glass rounded-3xl p-8 border border-border/30 hover:border-primary/20 transition-all duration-500 group hover:scale-[1.02]"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} bg-opacity-20 flex items-center justify-center mb-5 text-white group-hover:scale-110 transition-transform`}
                  style={{ background: `linear-gradient(135deg, rgba(158,127,255,0.2), rgba(56,189,248,0.2))` }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 sm:p-16 border border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Ready to build something <span className="text-gradient">amazing</span>?
              </h2>
              <p className="text-text-secondary text-lg mb-8 max-w-xl mx-auto">
                No coding experience needed. Just your idea and 30 seconds.
              </p>
              <button
                onClick={() => setView('intake')}
                className="group px-10 py-5 rounded-2xl font-bold text-lg bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 transition-all hover:shadow-[0_0_50px_rgba(158,127,255,0.4)]"
              >
                <span className="flex items-center gap-2">
                  Launch Tippad
                  <Zap size={20} className="group-hover:rotate-12 transition-transform" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-primary" />
            <span className="font-bold text-gradient-static">Tippad</span>
          </div>
          <p className="text-sm text-text-secondary">
            © 2025 Tippad. Idea to app in seconds.
          </p>
        </div>
      </footer>
    </div>
  );
}
