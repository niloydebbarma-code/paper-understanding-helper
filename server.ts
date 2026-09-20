import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { savePaperToS3, saveSessionToDynamoDB } from './services/awsOrchestrator';
import { convertPdfToMarkdown } from './services/pdfToMarkdown';
import { swarmOrchestrator } from './agents/swarmOrchestrator';
import { idpRouter } from './routes/idpRoutes';
import { agentRouter } from './routes/agentRoutes';
import { searchRouter } from './routes/searchRoutes';
import { claimRouter } from './routes/claimRoutes';
import { questionRouter } from './routes/questionRoutes';
import { sourceRouter } from './routes/sourceRoutes';
import { graphRouter } from './routes/graphRoutes';
import { roleRouter } from './routes/roleRoutes';
import { chatExportRouter } from './routes/chatExportRoutes';
import { telemetryRouter } from './routes/telemetryRoutes';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  const app = express();

  // --- BROWSER SECURITY POLICIES & CORS MIDDLEWARE ---
  app.use((req: Request, res: Response, next: NextFunction) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Security & CSP headers configured for KaTeX, Mermaid vector rendering, WebSockets, and Blobs
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https: ws: wss:; font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: blob: https:; connect-src 'self' https: ws: wss:; worker-src 'self' blob:;"
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Payload size limits for base64 PDFs / large research datasets
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // --- MOUNT MODULAR MICRO-TASK ROUTE CONTROLLERS (50 REST APIS) ---
  app.use('/api/idp', idpRouter);
  app.use(['/api/agents', '/api/agent'], agentRouter);
  app.use('/api/search', searchRouter);
  app.use(['/api/claims', '/api/claim'], claimRouter);
  app.use(['/api/questions', '/api/question'], questionRouter);
  app.use(['/api/sources', '/api/source'], sourceRouter);
  app.use(['/api/graphs', '/api/graph'], graphRouter);
  app.use(['/api/roles', '/api/role'], roleRouter);
  app.use('/api', chatExportRouter);
  app.use('/api', telemetryRouter);

  // --- SERVER-SENT EVENTS (SSE) REAL-TIME STREAMING PIPELINE ---
  app.get('/api/swarm/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection handshake
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString(), message: 'Bedrock Swarm Telemetry Stream Active' })}\n\n`);

    const intervalId = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'HEARTBEAT', timestamp: new Date().toISOString() })}\n\n`);
    }, 15000);

    req.on('close', () => {
      clearInterval(intervalId);
    });
  });

  // --- PRIMARY 5-AGENT SWARM PIPELINE (100% PURE AWS BEDROCK) ---
  app.post('/api/analyze-paper', async (req: Request, res: Response) => {
    try {
      const { paperText, paperName, role = 'phd', pdfBase64, isPdf } = req.body;

      if (!paperText && !pdfBase64) {
        return res.status(400).json({ error: 'Paper content or PDF file is required.' });
      }

      let generatedMarkdown: string = '';
      let extractedDocMetadata = undefined;

      if (isPdf && pdfBase64) {
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        try {
          const parsedDoc = await convertPdfToMarkdown(pdfBuffer, paperName);
          generatedMarkdown = parsedDoc.markdown;
          extractedDocMetadata = parsedDoc.documentMetadata;
        } catch (pdfErr) {
          console.warn('PDF to Markdown extraction warning:', pdfErr);
        }
      } else {
        generatedMarkdown = paperText;
      }

      console.log(`[Bedrock Swarm] Initiating 5-Agent Academic Review Swarm for "${paperName || 'Paper'}" under role "${role}" on AWS Bedrock...`);
      const swarmResult = await swarmOrchestrator.runSwarm(
        generatedMarkdown || paperText,
        paperName || 'Research Paper',
        role,
        extractedDocMetadata
      );
      const paperAnalysis = swarmResult.analysis;

      // Persist to AWS S3 & DynamoDB asynchronously
      if (pdfBase64) {
        savePaperToS3(paperAnalysis.paperId, Buffer.from(pdfBase64, 'base64'), 'application/pdf');
      }
      if (generatedMarkdown) {
        savePaperToS3(paperAnalysis.paperId, generatedMarkdown, 'text/markdown');
      } else if (paperText) {
        savePaperToS3(paperAnalysis.paperId, paperText, 'text/plain');
      }
      saveSessionToDynamoDB(paperAnalysis.paperId, paperAnalysis, role);

      res.json(paperAnalysis);
    } catch (error: any) {
      console.error('Error in /api/analyze-paper:', error);
      res.status(500).json({ error: error.message || 'Failed to analyze paper.' });
    }
  });

  // --- VITE OR STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[The Agentic Research Reviewer] Server running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
});
