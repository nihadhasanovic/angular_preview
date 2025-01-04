import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

export function app(): express.Express {
  const server = express();

  // The folder where our server bundle is located
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  // The folder where our browser (client) build is located
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  // This is the template used for SSR
  const indexHtml = join(serverDistFolder, 'index.server.html');

  // Create the Angular SSR engine
  const commonEngine = new CommonEngine();

  // 1. SSR route first
  server.get('*', async (req, res, next) => {
    try {
      const { protocol, originalUrl, baseUrl, headers } = req;

      // Hard-coded meta tags for testing
      const metaTitle = 'My Static Test Title';
      const metaDescription = 'This is a static description for testing meta tag replacement.';
      const metaImage = 'https://static.vecteezy.com/system/resources/previews/006/662/131/non_2x/replace-icon-double-reverse-arrow-exchange-linear-sign-for-graphic-design-logo-web-site-social-media-mobile-app-ui-illustration-free-vector.jpg';

      // Render the Angular app to a string
      let html = await commonEngine.render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      });

      // Naive string replacement to inject our meta tags:
      // 1. og:title
      html = html.replace(
        /(<meta[^>]+property="og:title"[^>]+content=")([^"]*)(")/,
        `$1${escapeForHtml(metaTitle)}$3`
      );

      // 2. og:description
      html = html.replace(
        /(<meta[^>]+property="og:description"[^>]+content=")([^"]*)(")/,
        `$1${escapeForHtml(metaDescription)}$3`
      );

      // 3. og:image
      html = html.replace(
        /(<meta[^>]+property="og:image"[^>]+content=")([^"]*)(")/,
        `$1${escapeForHtml(metaImage)}$3`
      );

      // Twitter tags
      html = html.replace(
        /(<meta[^>]+name="twitter:title"[^>]+content=")([^"]*)(")/,
        `$1${escapeForHtml(metaTitle)}$3`
      );

      html = html.replace(
        /(<meta[^>]+name="twitter:description"[^>]+content=")([^"]*)(")/,
        `$1${escapeForHtml(metaDescription)}$3`
      );

      html = html.replace(
        /(<meta[^>]+name="twitter:image"[^>]+content=")([^"]*)(")/,
        `$1${escapeForHtml(metaImage)}$3`
      );

      // Send the final SSR HTML
      res.send(html);
    } catch (error) {
      next(error);
    }
  });

  // 2. Serve static files (JS, CSS, images, etc.), but do NOT serve index.html
  //    directly—so SSR handles the HTML for all routes.
  server.use(express.static(browserDistFolder, {
    maxAge: '1y',
    // IMPORTANT: We don't serve index.html directly here
    index: false
  }));

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;
  const serverInstance = app();
  serverInstance.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();

/**
 * Helper to escape special characters in dynamic strings before injecting into HTML
 */
function escapeForHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
