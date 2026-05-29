import type { IdeaIntake, GeneratedFile } from '../types';

export function generateBackendFiles(idea: IdeaIntake): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const resourceNames = idea.mainFeatures.map((f) =>
    f.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
  );

  files.push({
    path: 'backend/package.json',
    content: JSON.stringify({
      name: `${idea.appName.toLowerCase().replace(/\s+/g, '-')}-api`,
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'node --watch server.js',
        start: 'node server.js',
      },
      dependencies: {
        express: '^4.21.0',
        cors: '^2.8.5',
        helmet: '^8.0.0',
        'express-rate-limit': '^7.4.0',
        dotenv: '^16.4.5',
        ...(idea.hasBlockchain ? { '@solana/web3.js': '^1.95.0' } : {}),
      },
    }, null, 2),
    language: 'json',
    category: 'backend',
  });

  files.push({
    path: 'backend/server.js',
    content: `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
${resourceNames.map((name) => `import ${name}Router from './routes/${name}.js';`).join('\n')}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    app: '${idea.appName}',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
${resourceNames.map((name) => `app.use('/api/${name}', ${name}Router);`).join('\n')}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

app.listen(PORT, () => {
  console.log(\`🚀 ${idea.appName} API running on port \${PORT}\`);
});

export default app;`,
    language: 'javascript',
    category: 'backend',
  });

  resourceNames.forEach((name, i) => {
    files.push({
      path: `backend/routes/${name}.js`,
      content: `import { Router } from 'express';

const router = Router();

// In-memory store (replace with database in production)
let items = [
  { id: '1', name: 'Sample ${idea.mainFeatures[i]} Item', status: 'active', createdAt: new Date().toISOString() },
  { id: '2', name: 'Another ${idea.mainFeatures[i]} Item', status: 'pending', createdAt: new Date().toISOString() },
];

// GET all ${name}
router.get('/', (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  let filtered = items;
  if (status) filtered = filtered.filter(item => item.status === status);
  
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + Number(limit));
  
  res.json({
    data: paginated,
    meta: {
      total: filtered.length,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(filtered.length / limit),
    },
  });
});

// GET single ${name}
router.get('/:id', (req, res) => {
  const item = items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: { message: '${idea.mainFeatures[i]} not found' } });
  res.json({ data: item });
});

// POST create ${name}
router.post('/', (req, res) => {
  const { name, ...rest } = req.body;
  if (!name) return res.status(400).json({ error: { message: 'Name is required' } });
  
  const newItem = {
    id: Date.now().toString(36),
    name,
    status: 'active',
    createdAt: new Date().toISOString(),
    ...rest,
  };
  items.push(newItem);
  res.status(201).json({ data: newItem });
});

// PUT update ${name}
router.put('/:id', (req, res) => {
  const index = items.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: { message: '${idea.mainFeatures[i]} not found' } });
  
  items[index] = { ...items[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json({ data: items[index] });
});

// DELETE ${name}
router.delete('/:id', (req, res) => {
  const index = items.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: { message: '${idea.mainFeatures[i]} not found' } });
  
  items.splice(index, 1);
  res.status(204).send();
});

export default router;`,
      language: 'javascript',
      category: 'backend',
    });
  });

  files.push({
    path: 'backend/.env.example',
    content: `PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
${idea.hasBlockchain ? 'SOLANA_RPC_URL=https://api.devnet.solana.com\nSOLANA_NETWORK=devnet' : ''}`,
    language: 'plaintext',
    category: 'backend',
  });

  return files;
}
