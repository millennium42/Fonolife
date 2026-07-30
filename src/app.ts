import Fastify from "fastify";
import cookie from "@fastify/cookie";
import staticFiles from "@fastify/static";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pool } from "./db/pool.js";
import { config } from "./config.js";
import { hashToken } from "./domain/security.js";
import {
  LocalAttachmentStorage,
  InMemoryAttachmentStorage,
  S3AttachmentStorage,
  DevAttachmentScanner,
  ClamAVAttachmentScanner,
  MockAttachmentScanner,
  type AttachmentStorage,
  type AttachmentScanner,
} from "./domain/attachments.js";

import { authRoutes } from "./modules/auth/routes.js";
import { importRoutes } from "./modules/import/routes.js";
import { healthRoutes } from "./modules/health/routes.js";
import { patientRoutes } from "./modules/patients/routes.js";
import { attachmentRoutes } from "./modules/attachments/routes.js";
import { catalogRoutes } from "./modules/catalog/routes.js";
import { financeRoutes } from "./modules/finance/routes.js";
import { doctorRoutes } from "./modules/doctors/routes.js";
import { reportRoutes } from "./modules/reports/routes.js";
import { privacyRoutes } from "./modules/privacy/routes.js";
import { adminRoutes } from "./modules/admin/routes.js";
import { crmRoutes } from "./modules/crm/routes.js";
import { appointmentRoutes } from "./modules/appointments/routes.js";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator" | "doctor";
  license_number?: string | null;
  specialty?: string | null;
  must_change_password: boolean;
};

declare module "fastify" {
  interface FastifyRequest {
    currentUser?: User;
  }
}

export function buildApp(customStorage?: AttachmentStorage, customScanner?: AttachmentScanner) {
  const app = Fastify({ logger: true, trustProxy: true });

  const attachmentStorage: AttachmentStorage = customStorage ?? (
    config.storageProvider === "s3"
      ? new S3AttachmentStorage({
          bucket: config.s3Bucket,
          region: config.s3Region,
          endpoint: config.s3Endpoint,
          forcePathStyle: config.s3ForcePathStyle,
          accessKeyId: config.s3AccessKeyId,
          secretAccessKey: config.s3SecretAccessKey,
        })
      : config.storageProvider === "demo" || config.storageProvider === "memory" || config.storageProvider === "in-memory"
      ? new InMemoryAttachmentStorage()
      : new LocalAttachmentStorage()
  );
  const attachmentScanner: AttachmentScanner = customScanner ?? (
    config.scannerProvider === "clamav"
      ? new ClamAVAttachmentScanner({ host: config.clamavHost, port: config.clamavPort, timeoutMs: config.clamavTimeoutMs })
      : config.scannerProvider === "mock"
      ? new MockAttachmentScanner()
      : new DevAttachmentScanner()
  );

  app.register(cookie);

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("x-content-type-options", "nosniff");
    reply.header("referrer-policy", "no-referrer");
    reply.header("content-security-policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    if (config.secureRuntime) reply.header("strict-transport-security", "max-age=31536000; includeSubDomains");
    return payload;
  });

  app.setErrorHandler((error, request, reply) => {
    const failure = error as Error & { statusCode?: number };
    const status = Number(failure.statusCode ?? 500);
    request.log.error(error);
    reply
      .status(status)
      .type("application/problem+json")
      .send({
        type: "about:blank",
        title: status === 503 ? (failure.message || "Serviço indisponível") : status >= 500 ? "Erro interno" : failure.message,
        status,
      });
  });

  app.addHook("onRequest", async (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      const origin = request.headers.origin;
      const referer = request.headers.referer;

      let allowedOrigin = config.origin;
      try {
        allowedOrigin = new URL(config.origin).origin;
      } catch {}

      let validOrigin = false;
      if (origin) {
        try {
          validOrigin = new URL(origin).origin === allowedOrigin;
        } catch {
          validOrigin = false;
        }
      }

      let validReferer = false;
      if (!origin && referer) {
        try {
          validReferer = new URL(referer).origin === allowedOrigin;
        } catch {
          validReferer = false;
        }
      }

      if (!validOrigin && !validReferer) {
        throw Object.assign(new Error("Origem não permitida ou ausente para mutações"), {
          statusCode: 403,
        });
      }
    }
    const token = request.cookies.fonolife_session;
    if (!token) return;
    const result = await pool.query<User>(
      `SELECT u.id,u.name,u.email,u.role,u.license_number,u.specialty,u.must_change_password FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active`,
      [hashToken(token)],
    );
    request.currentUser = result.rows[0];
    if (
      request.currentUser?.must_change_password &&
      ![
        "/api/auth/me",
        "/api/auth/change-password",
        "/api/auth/logout",
      ].includes(request.url)
    )
      throw Object.assign(
        new Error("Troque a senha temporária para continuar"),
        { statusCode: 403 },
      );
  });

  // Registro modular dos plugins de domínio
  app.register(authRoutes);
  app.register(importRoutes);
  app.register(healthRoutes, { attachmentStorage, attachmentScanner });
  app.register(patientRoutes);
  app.register(attachmentRoutes, { attachmentStorage, attachmentScanner });
  app.register(catalogRoutes);
  app.register(financeRoutes);
  app.register(doctorRoutes);
  app.register(crmRoutes);
  app.register(appointmentRoutes);
  app.register(reportRoutes);
  app.register(privacyRoutes);
  app.register(adminRoutes);

  const publicDir = resolve("dist/public");
  if (existsSync(publicDir)) {
    app.register(staticFiles, { root: publicDir });
    app.setNotFoundHandler((request, reply) =>
      request.url.startsWith("/api/")
        ? reply.code(404).send({ title: "Não encontrado", status: 404 })
        : reply.sendFile("index.html"),
    );
  }
  return app;
}
