import type { IdeaIntake, GeneratedFile } from '../types';

export function generateFrontendFiles(idea: IdeaIntake): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const componentNames = idea.mainFeatures.map((f) =>
    f.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
  );

  files.push({
    path: 'frontend/package.json',
    content: JSON.stringify({
      name: idea.appName.toLowerCase().replace(/\s+/g, '-'),
      private: true,
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
      },
      dependencies: {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
        'react-router-dom': '^7.1.1',
        'lucide-react': '^0.468.0',
        ...(idea.hasBlockchain ? { '@solana/web3.js': '^1.95.0', '@solana/wallet-adapter-react': '^0.15.35' } : {}),
      },
      devDependencies: {
        '@types/react': '^18.3.18',
        '@types/react-dom': '^18.3.5',
        '@vitejs/plugin-react': '^4.3.4',
        autoprefixer: '^10.4.20',
        postcss: '^8.4.49',
        tailwindcss: '^3.4.17',
        typescript: '~5.6.2',
        vite: '^6.0.0',
      },
    }, null, 2),
    language: 'json',
    category: 'frontend',
  });

  files.push({
    path: 'frontend/src/App.tsx',
    content: `import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
${componentNames.map((name) => `import ${name} from './pages/${name}';`).join('\n')}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
${componentNames.map((name) => `          <Route path="/${name.toLowerCase()}" element={<${name} />} />`).join('\n')}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}`,
    language: 'tsx',
    category: 'frontend',
  });

  files.push({
    path: 'frontend/src/components/Layout.tsx',
    content: `import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            ${idea.appName}
          </Link>
          <nav className="flex items-center gap-6">
${componentNames.map((name) => `            <Link to="/${name.toLowerCase()}" className="text-gray-400 hover:text-white transition-colors">${name}</Link>`).join('\n')}
${idea.hasBlockchain ? `            <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-medium hover:opacity-90 transition-opacity">
              Connect Wallet
            </button>` : ''}
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}`,
    language: 'tsx',
    category: 'frontend',
  });

  files.push({
    path: 'frontend/src/pages/Home.tsx',
    content: `import React from 'react';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
          ${idea.appName}
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          ${idea.appPurpose}
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-semibold hover:opacity-90 transition-all hover:scale-105">
            Get Started
          </button>
          <button className="px-8 py-3 border border-gray-700 rounded-xl font-semibold hover:bg-gray-800 transition-all">
            Learn More
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
${idea.mainFeatures.map((feature, i) => `        <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-purple-500/30 transition-all hover:scale-[1.02]">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
            <span className="text-2xl">${['🚀', '⚡', '🎯', '💎', '🔥', '✨', '🌟', '💡'][i % 8]}</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">${feature}</h3>
          <p className="text-gray-400 text-sm">Powerful ${feature.toLowerCase()} functionality built for ${idea.targetUsers.toLowerCase()}.</p>
        </div>`).join('\n')}
      </div>
    </div>
  );
}`,
    language: 'tsx',
    category: 'frontend',
  });

  componentNames.forEach((name, i) => {
    files.push({
      path: `frontend/src/pages/${name}.tsx`,
      content: `import React, { useState } from 'react';

export default function ${name}() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">${idea.mainFeatures[i]}</h1>
        <p className="text-gray-400">Manage and interact with ${idea.mainFeatures[i].toLowerCase()} features.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gray-900/50 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Overview</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-800/50 flex items-center justify-between">
              <span className="text-gray-300">Status</span>
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">Active</span>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/50 flex items-center justify-between">
              <span className="text-gray-300">Last Updated</span>
              <span className="text-gray-400 text-sm">Just now</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-medium hover:opacity-90 transition-opacity">
              Create New
            </button>
            <button className="w-full px-4 py-3 border border-gray-700 rounded-xl font-medium hover:bg-gray-800 transition-colors">
              View All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}`,
      language: 'tsx',
      category: 'frontend',
    });
  });

  files.push({
    path: 'frontend/tailwind.config.js',
    content: `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0a0a0f',
        },
      },
    },
  },
  plugins: [],
};`,
    language: 'javascript',
    category: 'frontend',
  });

  return files;
}
