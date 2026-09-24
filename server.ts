import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// Official Firestore configuration from firebase-applet-config.json
const FIREBASE_PROJECT_ID = "lateral-hope-tthv3";
const FIREBASE_DATABASE_ID = "ai-studio-websmpn1bengkali-5e1acd1a-2624-4c02-88cd-1246d9058afb";
const FIREBASE_API_KEY = "AIzaSyDt7N52r6H-DzarY-7UlcwlIfkQ0nUu6Q4";
const FALLBACK_LOGO_URL = "https://i.ibb.co.com/d44hK88L/logo-smpn-1-bengkalis-kecil.png";

export interface ArticleOgData {
  id?: string;
  slug?: string;
  title?: string;
  summary?: string;
  content?: string;
  coverImage?: string;
}

/**
 * Escapes characters for safe HTML injection
 */
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Cleans markdown & HTML from text and truncates to ~150 chars for meta description
 */
function cleanDescription(summary?: string | null, content?: string | null): string {
  const sourceText = summary && summary.trim() ? summary : content;
  if (!sourceText || typeof sourceText !== "string") {
    return "Portal Resmi SMP Negeri 1 Bengkalis";
  }

  let clean = sourceText
    // Remove HTML tags
    .replace(/<[^>]*>/g, " ")
    // Remove markdown image syntax ![alt](url)
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    // Convert markdown links [text](url) to text
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    // Remove markdown headers, bold, italics, quotes
    .replace(/[#*`_~>]/g, " ")
    // Collapse whitespaces
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) {
    return "Portal Resmi SMP Negeri 1 Bengkalis";
  }

  if (clean.length > 150) {
    clean = clean.substring(0, 147).trim() + "...";
  }

  return clean;
}

/**
 * Transforms Google Drive URLs into lightweight 1200x630 OG CDN thumbnails (<100KB)
 * and ensures image URL is an absolute HTTPS URL.
 */
function getOptimizedOgImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string" || !url.trim() || url.trim().startsWith("data:")) {
    return FALLBACK_LOGO_URL;
  }

  const trimmed = url.trim();

  // Extract Google Drive File ID from any variant
  const fileIdMatch =
    trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/drive\.google\.com\/thumbnail\?id=([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/drive\.google\.com\/uc\?.*?id=([a-zA-Z0-9_-]+)/i);

  if (fileIdMatch && fileIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}=w1200-h630-p`;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return FALLBACK_LOGO_URL;
}

/**
 * Fetch article details directly from Firestore REST API for Server-Side OpenGraph rendering.
 * Supports searching by Document ID and by slug field.
 */
async function fetchArticleForOg(idOrSlug: string): Promise<ArticleOgData | null> {
  if (!idOrSlug || typeof idOrSlug !== "string") return null;
  const cleanKey = idOrSlug.trim();

  // 1. Direct Document ID lookup
  try {
    const directEndpoint = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents/news_articles/${encodeURIComponent(cleanKey)}?key=${FIREBASE_API_KEY}`;
    const response = await fetch(directEndpoint, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3500),
    });

    if (response.ok) {
      const data = await response.json();
      const fields = data.fields || {};
      return {
        id: cleanKey,
        slug: fields.slug?.stringValue,
        title: fields.title?.stringValue,
        summary: fields.summary?.stringValue,
        content: fields.content?.stringValue,
        coverImage: fields.coverImage?.stringValue,
      };
    }
  } catch (err) {
    // Continue to slug query
  }

  // 2. Structured Query by Slug field
  try {
    const queryEndpoint = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents:runQuery?key=${FIREBASE_API_KEY}`;
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: "news_articles" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "slug" },
            op: "EQUAL",
            value: { stringValue: cleanKey },
          },
        },
        limit: 1,
      },
    };

    const response = await fetch(queryEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(queryBody),
      signal: AbortSignal.timeout(3500),
    });

    if (response.ok) {
      const results = await response.json();
      if (Array.isArray(results) && results.length > 0 && results[0].document) {
        const docData = results[0].document;
        const fields = docData.fields || {};
        const docNameParts = (docData.name || "").split("/");
        const docId = docNameParts[docNameParts.length - 1] || cleanKey;
        return {
          id: docId,
          slug: fields.slug?.stringValue || cleanKey,
          title: fields.title?.stringValue,
          summary: fields.summary?.stringValue,
          content: fields.content?.stringValue,
          coverImage: fields.coverImage?.stringValue,
        };
      }
    }
  } catch (err) {
    // Ignore query error
  }

  return null;
}

/**
 * Injects dynamic Server-Side OpenGraph & SEO meta tags into index.html
 */
function injectOgMetaTags(html: string, article: ArticleOgData, fullUrl: string): string {
  const rawTitle = article.title ? article.title.trim() : "Website SMP Negeri 1 Bengkalis";
  const pageTitle = `${rawTitle} - SMP Negeri 1 Bengkalis`;
  const ogTitle = rawTitle;
  const description = cleanDescription(article.summary, article.content);
  const ogImage = getOptimizedOgImageUrl(article.coverImage);

  const safePageTitle = escapeHtml(pageTitle);
  const safeOgTitle = escapeHtml(ogTitle);
  const safeDescription = escapeHtml(description);
  const safeOgImage = escapeHtml(ogImage);
  const safeFullUrl = escapeHtml(fullUrl);

  let result = html;

  // 1. Replace <title>
  if (/<title>.*?<\/title>/i.test(result)) {
    result = result.replace(/<title>.*?<\/title>/gi, `<title>${safePageTitle}</title>`);
  } else {
    result = result.replace("</head>", `<title>${safePageTitle}</title>\n</head>`);
  }

  // 2. Helper to replace or insert meta tags cleanly
  const setMetaTag = (propertyOrNameAttr: "property" | "name", key: string, content: string) => {
    const regex = new RegExp(`<meta\\s+${propertyOrNameAttr}="${key}"\\s+content=".*?"\\s*\\/?>`, "gi");
    const regexReversed = new RegExp(`<meta\\s+content=".*?"\\s+${propertyOrNameAttr}="${key}"\\s*\\/?>`, "gi");
    const tag = `<meta ${propertyOrNameAttr}="${key}" content="${content}" />`;

    if (regex.test(result)) {
      result = result.replace(regex, tag);
    } else if (regexReversed.test(result)) {
      result = result.replace(regexReversed, tag);
    } else {
      result = result.replace("</head>", `  ${tag}\n</head>`);
    }
  };

  // Standard Meta Description
  setMetaTag("name", "description", safeDescription);

  // OpenGraph Tags
  setMetaTag("property", "og:type", "article");
  setMetaTag("property", "og:title", safeOgTitle);
  setMetaTag("property", "og:description", safeDescription);
  setMetaTag("property", "og:image", safeOgImage);
  setMetaTag("property", "og:image:width", "1200");
  setMetaTag("property", "og:image:height", "630");
  setMetaTag("property", "og:image:alt", safeOgTitle);
  setMetaTag("property", "og:url", safeFullUrl);
  setMetaTag("property", "og:site_name", "SMP Negeri 1 Bengkalis");

  // Twitter Cards
  setMetaTag("name", "twitter:card", "summary_large_image");
  setMetaTag("name", "twitter:title", safeOgTitle);
  setMetaTag("name", "twitter:description", safeDescription);
  setMetaTag("name", "twitter:image", safeOgImage);

  // Canonical link
  if (/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i.test(result)) {
    result = result.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/gi, `<link rel="canonical" href="${safeFullUrl}" />`);
  } else {
    result = result.replace("</head>", `  <link rel="canonical" href="${safeFullUrl}" />\n</head>`);
  }

  // image_src link for older crawlers
  if (/<link\s+rel="image_src"\s+href=".*?"\s*\/?>/i.test(result)) {
    result = result.replace(/<link\s+rel="image_src"\s+href=".*?"\s*\/?>/gi, `<link rel="image_src" href="${safeOgImage}" />`);
  } else {
    result = result.replace("</head>", `  <link rel="image_src" href="${safeOgImage}" />\n</head>`);
  }

  return result;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  let vite: any = null;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: PORT },
      appType: "custom",
    });
  }

  /**
   * Handler for news permalinks (/berita/:idOrSlug) and query posts (?post=... or ?berita=...)
   */
  async function serveNewsHtml(req: express.Request, res: express.Response, idOrSlug: string, next: express.NextFunction) {
    try {
      const article = await fetchArticleForOg(idOrSlug);
      const indexPath =
        process.env.NODE_ENV === "production"
          ? path.join(process.cwd(), "dist", "index.html")
          : path.join(process.cwd(), "index.html");

      if (!fs.existsSync(indexPath)) {
        return next();
      }

      let rawHtml = fs.readFileSync(indexPath, "utf-8");

      if (vite) {
        rawHtml = await vite.transformIndexHtml(req.originalUrl, rawHtml);
      }

      const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
      const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || "localhost:3000";
      const fullUrl = `${proto}://${host}/berita/${encodeURIComponent(idOrSlug)}`;

      let outputHtml = rawHtml;
      if (article && (article.title || article.coverImage)) {
        outputHtml = injectOgMetaTags(rawHtml, article, fullUrl);
      }

      // Requirement 6: Short Cache-Control header (5 minutes) for news article pages
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=60");
      return res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).send(outputHtml);
    } catch (err) {
      console.error("Error serving news article with Server-Side OG:", err);
      return next();
    }
  }

  // 1. Direct permalink route: /berita/:idOrSlug
  app.get("/berita/:idOrSlug", async (req, res, next) => {
    const idOrSlug = req.params.idOrSlug;
    if (idOrSlug) {
      return serveNewsHtml(req, res, idOrSlug, next);
    }
    next();
  });

  // 2. Query parameter fallback: ?post=... or ?berita=... or ?id=...
  app.use(async (req, res, next) => {
    const isHtmlRequest =
      req.method === "GET" &&
      !req.path.startsWith("/api/") &&
      !req.path.match(/\.(js|css|json|png|jpg|jpeg|gif|ico|svg|woff2?|map)$/i);

    const postId = req.query.post || req.query.berita || (req.path === "/" && req.query.id);

    if (isHtmlRequest && postId) {
      return serveNewsHtml(req, res, String(postId), next);
    }
    next();
  });

  // 3. Vite development middleware or Production static files
  if (vite) {
    app.use(vite.middlewares);
    // Fallback for default SPA routes in dev
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.join(process.cwd(), "index.html");
        let template = fs.readFileSync(indexPath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
