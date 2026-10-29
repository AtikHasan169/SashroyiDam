import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createExpressApp } from './src/server/app.ts';
import { ensureDatabaseReady } from './src/server/db.ts';
import { injectProductMeta } from './src/server/metaInjector.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createExpressApp();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Helper to inject product SEO meta tags into index.html
  const handleHtmlRequest = async (
    req: express.Request,
    res: express.Response,
    rawHtml: string,
    vite?: any
  ) => {
    const prodParam = (req.query.product as string) || '';
    let finalHtml = rawHtml;

    if (prodParam) {
      try {
        const db = await ensureDatabaseReady();
        const norm = prodParam.trim().toLowerCase();
        const product = db.products.find(
          (p) =>
            ((p.slug && p.slug.toLowerCase() === norm) || p.id === prodParam) &&
            !p.isArchived
        );

        if (product) {
          const proto = req.headers['x-forwarded-proto'] || req.protocol;
          const host = req.get('host') || 'localhost:3000';
          const baseUrl = `${proto}://${host}`;
          finalHtml = injectProductMeta(rawHtml, product, baseUrl);
        }
      } catch (err) {
        console.warn('Failed to inject product meta:', err);
      }
    }

    if (vite) {
      finalHtml = await vite.transformIndexHtml(req.originalUrl, finalHtml);
    }

    res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
  };

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true }
    });

    // Intercept requests for HTML when ?product= is present to inject OpenGraph & Twitter tags
    app.use(async (req, res, next) => {
      const isHtmlReq =
        req.headers.accept?.includes('text/html') ||
        req.url === '/' ||
        req.path === '/';
      const hasProduct = Boolean(req.query.product);

      if (isHtmlReq && hasProduct) {
        try {
          const indexPath = path.resolve(__dirname, 'index.html');
          const rawHtml = fs.readFileSync(indexPath, 'utf-8');
          await handleHtmlRequest(req, res, rawHtml, vite);
          return;
        } catch (e) {
          return next(e);
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const indexPath = path.join(distPath, 'index.html');

    app.use(express.static(distPath, { index: false }));

    app.get('*', async (req, res, next) => {
      try {
        if (!fs.existsSync(indexPath)) {
          return res.status(404).send('Build not found');
        }
        const rawHtml = fs.readFileSync(indexPath, 'utf-8');
        await handleHtmlRequest(req, res, rawHtml);
      } catch (err) {
        next(err);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`সাশ্রয়ী দাম (Sashroyi Daam) server is active on port ${PORT}`);
  });
}

startServer();
