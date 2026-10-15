import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();

// Health check endpoints for Cloud Run, Kubernetes, and uptime probes
const handleHealth = (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'RythuMitra',
    timestamp: new Date().toISOString()
  });
};

app.get('/health', handleHealth);
app.get('/api/health', handleHealth);

// Serve static production build from dist directory
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// Fallback route for SPA client-side routing
app.get('*', (_req: express.Request, res: express.Response) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="2">
  <title>RythuMitra</title>
</head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f4;">
  <p style="color:#44403c;">RythuMitra is starting up... Please wait.</p>
</body>
</html>`);
  }
});

const preferredPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

function startServer(portToTry: number) {
  const server = app.listen(portToTry, '0.0.0.0', () => {
    console.log(`RythuMitra server running on http://0.0.0.0:${portToTry}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE' && portToTry !== 3000) {
      console.warn(`Port ${portToTry} in use. Falling back to port 3000...`);
      startServer(3000);
    } else {
      console.error('Server failed to start:', err);
      process.exit(1);
    }
  });
}

startServer(preferredPort);

