import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { generateProject } from '../utils/codeGenerator';
import type { GeneratedFile } from '../types';
import ProgressBar from '../components/ProgressBar';
import {
  FileCode,
  Check,
  Loader2,
  Sparkles,
  ArrowRight,
  Terminal,
} from 'lucide-react';

export default function CodeGeneration() {
  const {
    currentProject,
    setView,
    setGenerating,
    setGenerationProgress,
    generationProgress,
    generationStep,
    addFilesToProject,
  } = useAppStore();

  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!currentProject || hasStarted.current) return;
    hasStarted.current = true;

    setGenerating(true);
    setLogs(['[tippad] Starting code generation...']);

    generateProject(currentProject.idea, {
      onProgress: (progress, step) => {
        setGenerationProgress(progress, step);
        setLogs((prev) => [...prev, `[${Math.round(progress)}%] ${step}`]);
      },
      onFileGenerated: (file) => {
        setGeneratedFiles((prev) => [...prev, file]);
        setLogs((prev) => [...prev, `  ✓ Generated: ${file.path}`]);
      },
      onComplete: (files) => {
        addFilesToProject(currentProject.id, files);
        setGenerating(false);
        setIsComplete(true);
        setLogs((prev) => [
          ...prev,
          '',
          `[tippad] ✨ Generation complete!`,
          `[tippad] ${files.length} files generated across ${new Set(files.map((f) => f.category)).size} stacks`,
        ]);
      },
    });
  }, [currentProject]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const categoryIcons: Record<string, string> = {
    frontend: '⚛️',
    backend: '🖥️',
    contract: '⛓️',
    config: '⚙️',
  };

  const categoryColors: Record<string, string> = {
    frontend: 'text-secondary',
    backend: 'text-success',
    contract: 'text-primary',
    config: 'text-text-secondary',
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            {isComplete ? (
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <Check size={22} className="text-success" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Loader2 size={22} className="text-primary animate-spin" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">
                {isComplete ? 'Generation Complete!' : 'Generating Your App...'}
              </h1>
              <p className="text-text-secondary">
                {isComplete
                  ? `${generatedFiles.length} files ready for review and deployment`
                  : generationStep}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <ProgressBar
            progress={generationProgress}
            color={isComplete ? 'success' : 'primary'}
            size="lg"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Terminal Log */}
          <div className="glass rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-surface/50">
              <Terminal size={16} className="text-primary" />
              <span className="text-sm font-medium">Build Output</span>
              <div className="ml-auto flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-error/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
            </div>
            <div className="p-4 h-80 overflow-y-auto font-mono text-sm">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`${
                    log.includes('✓') ? 'text-success' :
                    log.includes('✨') ? 'text-primary' :
                    log.includes('[tippad]') ? 'text-secondary' :
                    'text-text-secondary'
                  } ${log === '' ? 'h-4' : ''}`}
                >
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
              {!isComplete && (
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
              )}
            </div>
          </div>

          {/* Generated Files */}
          <div className="glass rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-surface/50">
              <FileCode size={16} className="text-primary" />
              <span className="text-sm font-medium">Generated Files</span>
              <span className="ml-auto text-xs font-mono text-text-secondary">
                {generatedFiles.length} files
              </span>
            </div>
            <div className="p-4 h-80 overflow-y-auto space-y-1">
              {generatedFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-light transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className="text-sm">{categoryIcons[file.category]}</span>
                  <span className={`text-sm font-mono flex-1 truncate ${categoryColors[file.category]}`}>
                    {file.path}
                  </span>
                  <Check size={14} className="text-success flex-shrink-0" />
                </div>
              ))}
              {!isComplete && (
                <div className="flex items-center gap-3 px-3 py-2">
                  <Loader2 size={14} className="text-primary animate-spin" />
                  <span className="text-sm text-text-secondary">Generating...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {isComplete && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <button
              onClick={() => setView('editor')}
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 transition-all hover:shadow-[0_0_40px_rgba(158,127,255,0.3)]"
            >
              <Sparkles size={20} />
              Review & Edit Code
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setView('deployment')}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold border border-border hover:border-success/30 text-text-secondary hover:text-success transition-all"
            >
              Deploy As-Is
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
