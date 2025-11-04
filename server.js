import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
    configFile: path.resolve(__dirname, 'project-bolt/project/vite.config.ts')
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  // Serve static assets from the client build in production
  // For development, Vite handles this
  const resolve = (p) => path.resolve(__dirname, p);
  app.use(
    '/assets',
    express.static(resolve('dist/client/assets'))
  );

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // 1. Read index.html
      let template = fs.readFileSync(
        resolve('project-bolt/project/index.html'),
        'utf-8'
      );

      // 2. Apply Vite HTML transforms. This injects the Vite HMR client, etc.
      template = await vite.transformIndexHtml(url, template);

      // 3. Load the server entry. ssrLoadModule is an equivalent to import()
      const { render } = await vite.ssrLoadModule(
        resolve('project-bolt/project/src/entry-server.tsx')
      );

      // 4. Render the app HTML.
      const { html: appHtml } = await render(url);

      // 5. Inject the rendered app HTML into the template.
      const html = template.replace(`<!--ssr-outlet-->`, appHtml);

      // 6. Send the rendered HTML back.
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      // If an error is caught, let Vite fix the stack trace so it maps back to
      // your actual source code.
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  app.listen(5173, () => {
    console.log('Server listening on http://localhost:5173' );
  });
}

createServer();
