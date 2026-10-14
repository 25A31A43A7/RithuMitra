import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 3000;

// Health check endpoint for Cloud Run deployment monitoring
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'RythuMitra', timestamp: new Date().toISOString() });
});

// Serve static production build from dist directory
const distPath = path.resolve(process.cwd(), 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', (_req, res) => {
    res.status(503).send('Application is still building. Please refresh in a moment.');
  });
}

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`RythuMitra production server running on port ${port}`);
});
