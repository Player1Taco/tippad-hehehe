import type { IdeaIntake, GeneratedFile } from '../types';
import { generateFrontendFiles } from './frontendGenerator';
import { generateBackendFiles } from './backendGenerator';
import { generateSolanaFiles } from './solanaGenerator';

export interface GenerationCallbacks {
  onProgress: (progress: number, step: string) => void;
  onFileGenerated: (file: GeneratedFile) => void;
  onComplete: (files: GeneratedFile[]) => void;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateProject(
  idea: IdeaIntake,
  callbacks: GenerationCallbacks
): Promise<GeneratedFile[]> {
  const allFiles: GeneratedFile[] = [];

  callbacks.onProgress(5, 'Analyzing your idea...');
  await delay(800);

  callbacks.onProgress(10, 'Designing application architecture...');
  await delay(600);

  callbacks.onProgress(15, 'Planning component structure...');
  await delay(500);

  // Generate frontend
  callbacks.onProgress(20, 'Generating React frontend...');
  await delay(400);
  const frontendFiles = generateFrontendFiles(idea);
  for (let i = 0; i < frontendFiles.length; i++) {
    const progress = 20 + (i / frontendFiles.length) * 25;
    callbacks.onProgress(progress, `Creating ${frontendFiles[i].path}...`);
    callbacks.onFileGenerated(frontendFiles[i]);
    allFiles.push(frontendFiles[i]);
    await delay(200 + Math.random() * 300);
  }

  // Generate backend
  callbacks.onProgress(45, 'Generating Node.js backend...');
  await delay(400);
  const backendFiles = generateBackendFiles(idea);
  for (let i = 0; i < backendFiles.length; i++) {
    const progress = 45 + (i / backendFiles.length) * 25;
    callbacks.onProgress(progress, `Creating ${backendFiles[i].path}...`);
    callbacks.onFileGenerated(backendFiles[i]);
    allFiles.push(backendFiles[i]);
    await delay(200 + Math.random() * 300);
  }

  // Generate Solana contracts
  if (idea.hasBlockchain) {
    callbacks.onProgress(70, 'Generating Solana smart contracts...');
    await delay(400);
    const contractFiles = generateSolanaFiles(idea);
    for (let i = 0; i < contractFiles.length; i++) {
      const progress = 70 + (i / contractFiles.length) * 20;
      callbacks.onProgress(progress, `Creating ${contractFiles[i].path}...`);
      callbacks.onFileGenerated(contractFiles[i]);
      allFiles.push(contractFiles[i]);
      await delay(300 + Math.random() * 400);
    }
  }

  // Generate config files
  callbacks.onProgress(92, 'Generating deployment configs...');
  await delay(300);

  const readmeContent = generateReadme(idea);
  const readmeFile: GeneratedFile = {
    path: 'README.md',
    content: readmeContent,
    language: 'markdown',
    category: 'config',
  };
  callbacks.onFileGenerated(readmeFile);
  allFiles.push(readmeFile);

  callbacks.onProgress(96, 'Running final checks...');
  await delay(500);

  callbacks.onProgress(100, 'Generation complete! 🎉');
  await delay(300);

  callbacks.onComplete(allFiles);
  return allFiles;
}

function generateReadme(idea: IdeaIntake): string {
  return `# ${idea.appName}

${idea.appPurpose}

## 🚀 Features

${idea.mainFeatures.map((f) => `- **${f}**`).join('\n')}

## 🛠 Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express
${idea.hasBlockchain ? `- **Blockchain:** Solana (Anchor Framework)\n- **Features:** ${idea.blockchainFeatures.join(', ')}` : ''}

## 📦 Getting Started

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

### Backend
\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`
${idea.hasBlockchain ? `
### Smart Contracts
\`\`\`bash
cd contracts
anchor build
anchor test
anchor deploy
\`\`\`
` : ''}

## 🎯 Target Users

${idea.targetUsers}

## 📝 Additional Notes

${idea.additionalNotes || 'No additional notes.'}

---

Built with ⚡ Tippad
`;
}
