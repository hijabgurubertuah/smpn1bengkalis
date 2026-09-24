import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// Firestore configuration for dynamic OpenGraph metadata fetch
const FIREBASE_PROJECT_ID = "lateral-hope-tthv3";
const FIREBASE_DATABASE_ID = "ai-studio-websmpn1bengkali-5e1acd1a-2624-4c02-88cd-1246d9058afb";
const FIREBASE_API_KEY = "AIzaSyDt7N52r6H-DzarY-7UlcwlIfkQ0nUu6Q4";

/**
 * Transforms Google Drive URLs or image links into lightweight 1200x630 OG CDN thumbnails (<100KB)
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
async function fetchArticleForOg(postId: string): Promise<{ title?: string; coverImage?: string; summary?: string } | null> {
  if (!postId || typeof postId !== "string" || !postId.trim()) return null;
  const cleanId = postId.trim();

  try {
    const endpoint = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents/news_articles/${cleanId}?key=${FIREBASE_API_KEY}`;
    const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
    
    if (response.ok) {
      const data = await response.json();
      const fields = data.fields || {};

      const title = fields.title?.stringValue;
      const coverImage =
        fields.coverImage?.stringValue ||
        fields.imageUrl?.stringValue ||
        fields.photoUrl?.stringValue ||
        fields.image?.stringValue;

      const rawSummary =
        fields.excerpt?.stringValue ||
        fields.summary?.stringValue ||
        fields.content?.stringValue ||
        "";

      const summary = rawSummary.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

      if (title || coverImage) {
        return {
          title,
          coverImage,
          summary: summary || "Portal Resmi SMP Negeri 1 Bengkalis",
        };
      }
    }
  } catch (err) {
    console.error("Error fetching OG metadata for post:", err);
  }

  return null;
}

/**
 * Inject dynamic OpenGraph meta tags into static index.html
 */
function injectOgMetaTags(
  html: string,
  article: { title?: string; coverImage?: string; summary?: string },
  fullUrl: string
): string {
  const ogTitle = article.title ? article.title.trim() : "Website SMP Negeri 1 Bengkalis";
  const docTitle = article.title ? `${article.title.trim()} - SMP Negeri 1 Bengkalis` : "Website SMP Negeri 1 Bengkalis";
  const ogImage = getOptimizedOgImageUrl(article.coverImage);
  const description = article.summary && article.summary.trim()
    ? article.summary.trim().substring(0, 160)
    : "Portal Resmi SMP Negeri 1 Bengkalis";

  let result = html;

  // 1. Update <title>
  result = result.replace(/<title>.*?<\/title>/gi, `<title>${docTitle}</title>`);

  // Helper to update or inject a meta tag cleanly before </head>
  const setMetaTag = (attrName: string, attrVal: string, contentVal: string) => {
    const regex = new RegExp(`<meta\\s+${attrName}="${attrVal}"\\s+content=".*?"\\s*\\/?>`, "gi");
    if (regex.test(result)) {
      result = result.replace(regex, `<meta ${attrName}="${attrVal}" content="${contentVal}" />`);
    } else {
      result = result.replace("</head>", `  <meta ${attrName}="${attrVal}" content="${contentVal}" />\n</head>`);
    }
  };

  // OpenGraph standard meta tags for social previews (WhatsApp, Facebook, Telegram, LinkedIn, Discord)
  setMetaTag("property", "og:title", ogTitle);
  setMetaTag("property", "og:description", description);
  setMetaTag("property", "og:image", ogImage);
  setMetaTag("property", "og:image:secure_url", ogImage);
  setMetaTag("property", "og:image:type", "image/jpeg");
  setMetaTag("property", "og:image:width", "1200");
  setMetaTag("property", "og:image:height", "630");
  setMetaTag("property", "og:url", fullUrl);
  setMetaTag("property", "og:type", "article");
  setMetaTag("property", "og:site_name", "SMP Negeri 1 Bengkalis");

  // Twitter / X card tags
  setMetaTag("name", "twitter:card", "summary_large_image");
  setMetaTag("name", "twitter:title", ogTitle);
  setMetaTag("name", "twitter:description", description);
  setMetaTag("name", "twitter:image", ogImage);

  // General SEO description & link thumbnail
  setMetaTag("name", "description", description);

  if (result.includes('<link rel="image_src"')) {
    result = result.replace(/<link rel="image_src"\s+href=".*?"\s*\/?>/gi, `<link rel="image_src" href="${ogImage}" />`);
  } else {
    result = result.replace("</head>", `  <link rel="image_src" href="${ogImage}" />\n</head>`);
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

  // Dynamic OpenGraph handler for HTML requests with ?post=POST_ID or /post/:id
  app.use(async (req, res, next) => {
    const isHtmlRequest =
      req.method === "GET" &&
      !req.path.startsWith("/api/") &&
      !req.path.match(/\.(js|css|json|png|jpg|jpeg|gif|ico|svg|woff2?)$/i);

    if (!isHtmlRequest) {
      return next();
    }

    // Extract post ID from query params or path
    let postId = (req.query.post || req.query.p || req.query.article || req.query.id)
      ? String(req.query.post || req.query.p || req.query.article || req.query.id).trim()
      : null;

    if (!postId) {
      const pathMatch = req.path.match(/^\/(?:post|berita|artikel|news)\/([a-zA-Z0-9_-]+)/i);
      if (pathMatch && pathMatch[1]) {
        postId = pathMatch[1];
      }
    }

    if (postId) {
      try {
        const article = await fetchArticleForOg(postId);
        if (article && (article.title || article.coverImage)) {
          const indexPath =
            process.env.NODE_ENV === "production"
              ? path.join(process.cwd(), "dist", "index.html")
              : path.join(process.cwd(), "index.html");

          if (fs.existsSync(indexPath)) {
            const rawHtml = fs.readFileSync(indexPath, "utf-8");
            const proto = req.get("x-forwarded-proto") || req.protocol || "https";
            const host = req.get("x-forwarded-host") || req.get("host");
            const fullUrl = `${proto}://${host}${req.originalUrl}`;
            const transformedHtml = injectOgMetaTags(rawHtml, article, fullUrl);

            res.setHeader("Content-Type", "text/html; charset=utf-8");
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
