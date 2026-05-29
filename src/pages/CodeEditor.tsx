import React, { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useAppStore } from '../store/appStore';
import type { GeneratedFile } from '../types';
import {
  FileCode,
  FolderOpen,
  Rocket,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Download,
  Search,
} from 'lucide-react';

interface FileTreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: FileTreeNode[];
  file?: GeneratedFile;
}

function buildFileTree(files: GeneratedFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  files.forEach((file) => {
    const parts = file.path.split('/');
    let current = root;

    parts.forEach((part, i) => {
      const isLast = i === parts.length - 1;
      const existing = current.find((n) => n.name === part);

      if (existing) {
        if (!isLast) current = existing.children;
      } else {
        const node: FileTreeNode = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          isFolder: !isLast,
          children: [],
          file: isLast ? file : undefined,
        };
        current.push(node);
        if (!isLast) current = node.children;
      }
    });
  });

  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(root);
  return root;
}

const languageMap: Record<string, string> = {
  tsx: 'typescript',
  ts: 'typescript',
  jsx: 'javascript',
  js: 'javascript',
  json: 'json',
  css: 'css',
  html: 'html',
  md: 'markdown',
  rs: 'rust',
  toml: 'toml',
  sol: 'solidity',
  plaintext: 'plaintext',
};

const fileIcons: Record<string, string> = {
  tsx: '⚛️',
  ts: '📘',
  jsx: '⚛️',
  js: '📒',
  json: '📋',
  css: '🎨',
  html: '🌐',
  md: '📝',
  rs: '🦀',
  toml: '⚙️',
  sol: '💎',
};

function FileTreeItem({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: FileTreeNode;
  depth: number;
  selectedPath: string;
  onSelect: (file: GeneratedFile) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const ext = node.name.split('.').pop() || '';

  if (node.isFolder) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 hover:bg-surface-light rounded-lg transition-colors text-left"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {expanded ? <ChevronDown size={14} className="text-text-secondary" /> : <ChevronRight size={14} className="text-text-secondary" />}
          <FolderOpen size={14} className="text-primary" />
          <span className="text-sm font-medium text-text-secondary">{node.name}</span>
        </button>
        {expanded && node.children.map((child) => (
          <FileTreeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => node.file && onSelect(node.file)}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-left ${
        selectedPath === node.path
          ? 'bg-primary/10 text-white'
          : 'hover:bg-surface-light text-text-secondary hover:text-white'
      }`}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      <span className="text-xs">{fileIcons[ext] || '📄'}</span>
      <span className="text-sm truncate">{node.name}</span>
    </button>
  );
}

export default function CodeEditor() {
  const { currentProject, updateFileContent, setView } = useAppStore();
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(
    currentProject?.files[0] || null
  );
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const files = currentProject?.files || [];
  const tree = buildFileTree(files);

  const filteredTree = searchQuery
    ? files.filter((f) => f.path.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined && selectedFile && currentProject) {
        updateFileContent(currentProject.id, selectedFile.path, value);
      }
    },
    [selectedFile, currentProject, updateFileContent]
  );

  const handleCopy = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const ext = selectedFile?.path.split('.').pop() || 'plaintext';
  const monacoLang = languageMap[ext] || selectedFile?.language || 'plaintext';

  const categoryStats = files.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* File Explorer */}
      <div className="w-72 glass-strong border-r border-border/50 flex flex-col">
        <div className="p-3 border-b border-border/50">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary/50 text-white placeholder-text-secondary/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredTree ? (
            filteredTree.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left text-sm ${
                  selectedFile?.path === file.path
                    ? 'bg-primary/10 text-white'
                    : 'hover:bg-surface-light text-text-secondary'
                }`}
              >
                <span className="text-xs">{fileIcons[file.path.split('.').pop() || ''] || '📄'}</span>
                <span className="truncate">{file.path}</span>
              </button>
            ))
          ) : (
            tree.map((node) => (
              <FileTreeItem
                key={node.path}
                node={node}
                depth={0}
                selectedPath={selectedFile?.path || ''}
                onSelect={setSelectedFile}
              />
            ))
          )}
        </div>

        <div className="p-3 border-t border-border/50 space-y-2">
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryStats).map(([cat, count]) => (
              <span key={cat} className="px-2 py-1 rounded-md bg-surface-light text-xs text-text-secondary">
                {cat}: {count}
              </span>
            ))}
          </div>
          <button
            onClick={() => setView('deployment')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Rocket size={16} />
            Deploy Project
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedFile ? (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-surface/30">
              <div className="flex items-center gap-2">
                <FileCode size={16} className="text-primary" />
                <span className="text-sm font-mono text-text-secondary">{selectedFile.path}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  selectedFile.category === 'frontend' ? 'bg-secondary/20 text-secondary' :
                  selectedFile.category === 'backend' ? 'bg-success/20 text-success' :
                  selectedFile.category === 'contract' ? 'bg-primary/20 text-primary' :
                  'bg-surface-light text-text-secondary'
                }`}>
                  {selectedFile.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-white hover:bg-surface-light transition-all"
                >
                  {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                language={monacoLang}
                value={selectedFile.content}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  minimap: { enabled: true, scale: 1 },
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  renderLineHighlight: 'all',
                  bracketPairColorization: { enabled: true },
                  wordWrap: 'on',
                  tabSize: 2,
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileCode size={48} className="mx-auto text-text-secondary/30 mb-4" />
              <p className="text-text-secondary">Select a file to edit</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
