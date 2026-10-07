import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { isAuthorizedAdminEmail } from "@shared/const";
import { sdk } from "./sdk";
import sharp from "sharp";


function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  const allowedImageMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ]);
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
    fileFilter: (_req, file, callback) => {
      if (!allowedImageMimeTypes.has(file.mimetype)) {
        callback(new Error("Only JPEG, PNG, WEBP, and GIF images are allowed"));
        return;
      }
      callback(null, true);
    },
  });

  // Product images are a restricted admin operation, just like the product
  // mutations. Authenticate before invoking multer so unauthenticated users
  // cannot use the upload endpoint as a public storage proxy.
  app.post("/api/upload", async (req: any, res) => {
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!isAuthorizedAdminEmail(user.email)) {
      return res.status(403).json({ error: "Admin access required" });
    }

    upload.single("file")(req, res, async uploadError => {
      if (uploadError instanceof multer.MulterError) {
        const message = uploadError.code === "LIMIT_FILE_SIZE"
          ? "Image must be 5 MB or smaller"
          : "Invalid image upload";
        return res.status(400).json({ error: message });
      }

      if (uploadError) {
        return res.status(400).json({ error: uploadError.message });
      }

      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file provided" });
        }

        const safeOriginalName = req.file.originalname
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .slice(-100);
        const uploadId = `${Date.now()}-${randomUUID()}`;
        const thumbnailBuffer = await sharp(req.file.buffer, {
          animated: false,
          limitInputPixels: 40_000_000,
        })
          .rotate()
          .resize({
            width: 720,
            height: 720,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 76, effort: 4 })
          .toBuffer();

        const [original, thumbnail] = await Promise.all([
          storagePut(
            `products/originals/${uploadId}-${safeOriginalName}`,
            req.file.buffer,
            req.file.mimetype
          ),
          storagePut(
            `products/thumbnails/${uploadId}.webp`,
            thumbnailBuffer,
            "image/webp"
          ),
        ]);

        return res.json({ url: original.url, thumbnailUrl: thumbnail.url });
      } catch (error) {
        console.error("Upload error:", error);
        return res.status(500).json({ error: "Upload failed" });
      }
    });
  });
  
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
