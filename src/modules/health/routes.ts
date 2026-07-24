import type { FastifyInstance } from "fastify";
import { pool } from "../../db/pool.js";
import { config } from "../../config.js";
import type { AttachmentStorage, AttachmentScanner } from "../../domain/attachments.js";

export async function healthRoutes(
  app: FastifyInstance,
  opts: { attachmentStorage: AttachmentStorage; attachmentScanner: AttachmentScanner }
) {
  const { attachmentStorage, attachmentScanner } = opts;

  app.get("/api/health", async () => {
    let dbStatus = "ok";
    try {
      await pool.query("SELECT 1");
    } catch {
      dbStatus = "down";
    }

    let storageStatus = "ok";
    try {
      await attachmentStorage.exists("__health_check__");
    } catch {
      storageStatus = "degraded";
    }

    let scannerStatus = "ok";
    try {
      await attachmentScanner.scan(Buffer.from("%PDF-1.4\n%%EOF"), "application/pdf");
    } catch {
      scannerStatus = "degraded";
    }

    let overallStatus: "healthy" | "degraded" | "unavailable" = "healthy";
    if (dbStatus === "down") {
      overallStatus = "unavailable";
    } else if (storageStatus === "degraded" || scannerStatus === "degraded") {
      overallStatus = "degraded";
    }

    return {
      status: overallStatus,
      database: dbStatus,
      storage: storageStatus,
      scanner: scannerStatus,
      storageProvider: config.storageProvider,
      scannerProvider: config.scannerProvider,
    };
  });

  app.get("/api/config", async () => {
    return { demoMode: config.demo };
  });
}
