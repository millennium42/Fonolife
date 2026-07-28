import type { FastifyInstance } from "fastify";
import { pool } from "../../db/pool.js";
import { config } from "../../config.js";
import type { AttachmentStorage, AttachmentScanner } from "../../domain/attachments.js";

/**
 * Helper de timeout individual para verificações de prontidão (Readiness)
 */
function withTimeout<T>(promise: Promise<T>, ms: number, dependencyName: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout (${ms}ms) em check de prontidão: ${dependencyName}`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export async function healthRoutes(
  app: FastifyInstance,
  opts: { attachmentStorage: AttachmentStorage; attachmentScanner: AttachmentScanner }
) {
  const { attachmentStorage, attachmentScanner } = opts;

  // Endpoint de liveness: indica simplesmente que o processo do Node/Fastify está ativo
  app.get("/api/health/live", async (_request, reply) => {
    return reply.code(200).send({ status: "ok", live: true });
  });

  // Endpoint de readiness (compatível com Render): só indica 200 saudável se as dependências obrigatórias estiverem funcionais
  app.get("/api/health", async (request, reply) => {
    let dbStatus = "ok";
    let storageStatus = "ok";
    let storageDetails: string | undefined;
    let scannerStatus = "ok";
    let scannerDetails: string | undefined;

    try {
      try {
        await withTimeout(pool.query("SELECT 1"), 2500, "PostgreSQL");
      } catch (err: any) {
        dbStatus = "down";
        request.log.warn({ dependency: "database", status: "down", details: err?.message }, "Falha no check de prontidão do PostgreSQL");
      }

      try {
        if (typeof attachmentStorage.health === "function") {
          const h = await withTimeout(attachmentStorage.health(), 3000, "AttachmentStorage");
          storageStatus = (h && (h as any).status) ? h.status : ((h as any) === false ? "failed" : "down");
          storageDetails = h ? (h as any).details : undefined;
          if (storageStatus !== "ok" && storageStatus !== "degraded") {
            if (storageStatus !== "failed" && storageStatus !== "down") storageStatus = "down";
          }
        } else {
          // Fallback mínimo sem utilizar chave inexistente como prova de storage saudável
          storageStatus = "ok";
        }
        if (storageStatus !== "ok") {
          request.log.warn({ dependency: "storage", status: storageStatus, details: storageDetails }, "Storage em estado não ideal na prontidão");
        }
      } catch (err: any) {
        storageStatus = "down";
        storageDetails = err?.message || "Storage indisponível ou timeout";
        request.log.warn({ dependency: "storage", status: "down", details: storageDetails }, "Exceção/timeout no check de prontidão do Storage");
      }

      try {
        if (typeof attachmentScanner.healthCheck === "function") {
          const h = await withTimeout(attachmentScanner.healthCheck(), 3000, "AttachmentScanner");
          scannerStatus = (h && (h as any).status) ? h.status : ((h as any) === false ? "failed" : "down");
          scannerDetails = h ? (h as any).details : undefined;
          if (scannerStatus !== "ok" && scannerStatus !== "degraded" && scannerStatus !== "infected" as any) {
            if (scannerStatus !== "failed" && scannerStatus !== "down") scannerStatus = "down";
          }
        } else {
          const s = await withTimeout(attachmentScanner.scan(Buffer.from("%PDF-1.4\n%%EOF"), "application/pdf"), 3000, "AttachmentScanner");
          if (s.status === "failed" || (s as any).status === false) {
            scannerStatus = "failed";
            scannerDetails = `Scanner reportou falha operacional: ${s.reason || "failed"}`;
          } else if (s.status === "infected" || (s as any).status === "infected") {
            scannerStatus = "infected";
            scannerDetails = `Scanner identificou infecção no check de prontidão: ${s.reason || s.signature || "infected"}`;
          } else if (s.status !== "clean" || !s.clean) {
            scannerStatus = "failed";
            scannerDetails = `Scanner respondeu status não limpo: ${s.reason || s.status}`;
          }
        }
        if (scannerStatus !== "ok") {
          request.log.warn({ dependency: "scanner", status: scannerStatus, details: scannerDetails }, "Scanner em estado não ideal na prontidão");
        }
      } catch (err: any) {
        scannerStatus = "down";
        scannerDetails = err?.message || "Scanner indisponível ou timeout";
        request.log.warn({ dependency: "scanner", status: "down", details: scannerDetails }, "Exceção/timeout no check de prontidão do Scanner");
      }

      let overallStatus: "healthy" | "degraded" | "unavailable" = "healthy";
      let statusCode = 200;

      const isStorageUnhealthy = storageStatus === "down" || (storageStatus as any) === "failed" || (storageStatus as any) === false || (storageStatus as any) === "error";
      const isScannerUnhealthy = scannerStatus === "down" || (scannerStatus as any) === "failed" || (scannerStatus as any) === "infected" || (scannerStatus as any) === false || (scannerStatus as any) === "error";

      if (dbStatus === "down" || isStorageUnhealthy || isScannerUnhealthy) {
        overallStatus = "unavailable";
        statusCode = 503;
      } else if (storageStatus === "degraded" || scannerStatus === "degraded") {
        overallStatus = "degraded";
        statusCode = 200;
      }

      request.log.info({ overallStatus, statusCode, database: dbStatus, storage: storageStatus, scanner: scannerStatus }, "Inspeção de prontidão (readiness) concluída");

      return reply.code(statusCode).send({
        status: overallStatus,
        database: dbStatus,
        storage: storageStatus,
        storageDetails,
        scanner: scannerStatus,
        scannerDetails,
        storageProvider: config.storageProvider,
        scannerProvider: config.scannerProvider,
      });
    } catch (err: any) {
      // Proteção contra conversão acidental de 503 em 500 no error handler global
      request.log.error(err, "Falha crítica não tratada na execução do check de prontidão (readiness)");
      return reply.code(503).send({
        status: "unavailable",
        database: dbStatus,
        storage: storageStatus,
        scanner: scannerStatus,
        error: "Exceção na checagem de prontidão do sistema (fail-closed)",
      });
    }
  });

  // Endpoint de inspeção operacional sem exposição de segredos, tokens, credenciais ou caminhos internos
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
