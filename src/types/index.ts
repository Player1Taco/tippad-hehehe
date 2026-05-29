export interface IdeaIntake {
  appName: string;
  appPurpose: string;
  targetUsers: string;
  mainFeatures: string[];
  interactions: string;
  hasBlockchain: boolean;
  blockchainFeatures: string[];
  designStyle: 'minimal' | 'bold' | 'corporate' | 'playful';
  additionalNotes: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  category: 'frontend' | 'backend' | 'contract' | 'config';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  idea: IdeaIntake;
  files: GeneratedFile[];
  status: 'draft' | 'generating' | 'ready' | 'deploying' | 'deployed';
  createdAt: string;
  updatedAt: string;
  deployments: Deployment[];
}

export interface Deployment {
  id: string;
  type: 'frontend' | 'backend' | 'contract';
  url: string;
  status: 'pending' | 'building' | 'live' | 'failed';
  provider: string;
  deployedAt: string;
}

export interface QuestionStep {
  id: string;
  question: string;
  description: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'toggle';
  options?: string[];
  placeholder?: string;
  required: boolean;
  field: keyof IdeaIntake;
}

export type AppView = 'landing' | 'intake' | 'generating' | 'editor' | 'deployment' | 'dashboard' | 'project';
