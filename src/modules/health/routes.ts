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
    let storageDetails: string | undefined;
    try {
      if (typeof attachmentStorage.health === "function") {
        const h = await attachmentStorage.health();
        storageStatus = h.status;
        storageDetails = h.details;
      } else {
        await attachmentStorage.exists("__health_check__");
      }
    } catch (err: any) {
      storageStatus = "degraded";
      storageDetails = err?.message || "Storage indisponível";
    }

    let scannerStatus = "ok";
    try {
      await attachmentScanner.scan(Buffer.from("%PDF-1.4\n%%EOF"), "application/pdf");
    } catch {
      scannerStatus = "degraded";
    }

    let overallStatus: "healthy" | "degraded" | "unavailable" = "healthy";
    if (dbStatus === "down" || storageStatus === "down") {
      overallStatus = "unavailable";
    } else if (storageStatus === "degraded" || scannerStatus === "degraded") {
      overallStatus = "degraded";
    }

    return {
      status: overallStatus,
      database: dbStatus,
      storage: storageStatus,
      storageDetails,
      scanner: scannerStatus,
      storageProvider: config.storageProvider,
      scannerProvider: config.scannerProvider,
    };
  });

  app.get("/api/config", async () => {
    return {
      demoMode: config.demo,
      environment: config.appEnv,
      storageProvider: config.storageProvider,
      storageClass: config.storageProvider === "demo" || config.storageProvider === "memory" || config.storageProvider === "in-memory"
        ? "InMemoryAttachmentStorage"
        : config.storageProvider === "s3"
        ? "S3AttachmentStorage"
        : "LocalAttachmentStorage",
    };
  });
}
