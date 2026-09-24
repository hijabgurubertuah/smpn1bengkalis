import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// Firestore configuration for dynamic OpenGraph metadata fetch
const FIREBASE_PROJECT_ID = "lateral-hope-tthv3";
const FIREBASE_DATABASE_ID = "ai-studio-websmpn1bengkali-5e1acd1a-2624-4c02-88cd-1246d9058afb";
const FIREBASE_API_KEY = "AIzaSyDt7N52r6H-DzarY-7UlcwlIfkQ0nUu6Q4";

/**
 * Transforms Google Drive URLs into lightweight 1200x630 OG CDN thumbnails (<100KB)
 */
function getOptimizedOgImageUrl(url: string | undefined | null): string {
  const fallbackLogo = "https://i.ibb.co.com/d44hK88L/logo-smpn-1-bengkalis-kecil.png";
  if (!url || typeof url !== "string" || !url.trim() || url.trim().startsWith("data:")) {
    return fallbackLogo;
  }
  const trimmed = url.trim();
  const fileIdMatch =
    trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i);

  if (fileIdMatch && fileIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}=w1200-h630-p`;
  }
  return trimmed;
}

/**
 * Fetch article details directly from Firestore REST API for Server-Side OpenGraph rendering
 */
async function fetchArticleForOg(postId: string): Promise<{ title?: string; coverImage?: string } | null> {
  try {
    const endpoint = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents/news_articles/${postId}?key=${FIREBASE_API_KEY}`;
    const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const data = await response.json();
    const fields = data.fields || {};
    return {
      title: fields.title?.stringValue,
      coverImage: fields.coverImage?.stringValue,
    };
  } catch {
    return null;
  }
}

/**
 * Inject dynamic OpenGraph meta tags into static index.html
 */
function injectOgMetaTags(html: string, article: { title?: string; coverImage?: string }, fullUrl: string): string {
  const title = article.title ? `${article.title} - SMP Negeri 1 Bengkalis` : "Website SMP Negeri 1 Bengkalis";
  const ogTitle = article.title || "Website SMP Negeri 1 Bengkalis";
  const ogImage = getOptimizedOgImageUrl(article.coverImage);
  const description = "Portal Resmi SMP Negeri 1 Bengkalis";

  let result = html;
  result = result.replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`);
  result = result.replace(/<meta property="og:title" content=".*?"\s*\/?>/gi, `<meta property="og:title" content="${ogTitle}" />`);
  result = result.replace(/<meta property="og:description" content=".*?"\s*\/?>/gi, `<meta property="og:description" content="${description}" />`);
  result = result.replace(/<meta property="og:image" content=".*?"\s*\/?>/gi, `<meta property="og:image" content="${ogImage}" />`);
  result = result.replace(/<meta name="twitter:title" content=".*?"\s*\/?>/gi, `<meta name="twitter:title" content="${ogTitle}" />`);
  result = result.replace(/<meta name="twitter:description" content=".*?"\s*\/?>/gi, `<meta name="twitter:description" content="${description}" />`);
  result = result.replace(/<meta name="twitter:image" content=".*?"\s*\/?>/gi, `<meta name="twitter:image" content="${ogImage}" />`);

  if (result.includes('<meta property="og:url"')) {
    result = result.replace(/<meta property="og:url" content=".*?"\s*\/?>/gi, `<meta property="og:url" content="${fullUrl}" />`);
  } else {
    result = result.replace("</head>", `<meta property="og:url" content="${fullUrl}" />\n</head>`);
  }

  return result;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Dynamic OpenGraph handler for HTML requests with ?post=POST_ID
  app.use(async (req, res, next) => {
    const postId = req.query.post ? String(req.query.post) : null;
    const isHtmlRequest =
      req.method === "GET" &&
      !req.path.startsWith("/api/") &&
      !req.path.match(/\.(js|css|json|png|jpg|jpeg|gif|ico|svg|woff2?)$/i);

    if (postId && isHtmlRequest) {
      try {
        const article = await fetchArticleForOg(postId);
        if (article && (article.title || article.coverImage)) {
          const indexPath =
            process.env.NODE_ENV === "production"
              ? path.join(process.cwd(), "dist", "index.html")
              : path.join(process.cwd(), "index.html");

          if (fs.existsSync(indexPath)) {
            const rawHtml = fs.readFileSync(indexPath, "utf-8");
            const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
            const transformedHtml = injectOgMetaTags(rawHtml, article, fullUrl);
            return res.status(200).send(transformedHtml);
          }
        }
      } catch (err) {
        console.error("Error in OG middleware:", err);
      }
    }
    next();
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: PORT },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
