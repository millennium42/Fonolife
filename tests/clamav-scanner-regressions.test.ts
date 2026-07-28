import test from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import fastify from "fastify";
import cookie from "@fastify/cookie";
import { randomUUID } from "node:crypto";
import { ClamAVAttachmentScanner, InMemoryAttachmentStorage } from "../src/domain/attachments.js";
import { attachmentRoutes } from "../src/modules/attachments/routes.js";
import { healthRoutes } from "../src/modules/health/routes.js";
import { config } from "../src/config.js";
import { pool } from "../src/db/pool.js";

// Isola testes das chamadas reais de banco de dados em verificação de autorização do paciente
pool.query = async () => ({
  rows: [{ id: "test-patient", name: "Patient Test", assigned_user_id: null, responsible_doctor_id: null, journey_status: "triage", archived_at: null }],
  rowCount: 1,
} as any);

pool.connect = async () => ({
  query: async () => ({ rows: [{ id: "test-patient" }], rowCount: 1 }),
  release: () => {},
} as any);

/**
 * Servidor TCP determinístico simulando os diversos comportamentos do daemon clamd.
 */
function createAdvancedClamdServer(behavior: {
  response?: string;
  delayMs?: number;
  closeAbruptly?: boolean;
  verifyChunks?: (commands: string[], chunks: Buffer[]) => void;
}) {
  const receivedCommands: string[] = [];
  const receivedChunks: Buffer[] = [];
  let connectionCount = 0;

  const server = net.createServer((socket) => {
    connectionCount++;

    if (behavior.closeAbruptly) {
      socket.destroy();
      return;
    }

    let bufferAcc = Buffer.alloc(0);

    socket.on("data", (data) => {
      bufferAcc = Buffer.concat([bufferAcc, data]);
      const asStr = data.toString("binary");
      if (asStr.includes("zPING") || asStr === "PING") {
        receivedCommands.push("zPING");
        if (behavior.delayMs) {
          setTimeout(() => { if (!socket.destroyed) socket.write("PONG\0"); }, behavior.delayMs);
        } else {
          socket.write("PONG\0");
        }
        return;
      }

      if (bufferAcc.toString("binary").includes("zINSTREAM")) {
        receivedCommands.push("zINSTREAM");
        receivedChunks.push(data);

        // Verifica se chegamos no terminador zero (4 bytes de zeros: 0x00000000 no final do buffer)
        if (bufferAcc.length >= 13 && bufferAcc.subarray(bufferAcc.length - 4).equals(Buffer.from([0, 0, 0, 0]))) {
          if (behavior.verifyChunks) {
            behavior.verifyChunks(receivedCommands, receivedChunks);
          }
          if (behavior.delayMs) {
            setTimeout(() => {
              if (!socket.destroyed) {
                socket.write(behavior.response ?? "stream: OK\0");
                socket.end();
              }
            }, behavior.delayMs);
          } else {
            socket.write(behavior.response ?? "stream: OK\0");
            socket.end();
          }
        }
      }
    });
  });

  return {
    start: (): Promise<number> => new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        resolve((server.address() as net.AddressInfo).port);
      });
    }),
    stop: (): Promise<void> => new Promise((resolve) => server.close(() => resolve())),
    getConnectionCount: () => connectionCount,
    getCommands: () => receivedCommands,
    getChunks: () => receivedChunks,
  };
}

test("PROMPT 02 — Suíte COMPLETA de Regressões, Protocolo INSTREAM e Fail-Closed ClamAV", async (t) => {
  await t.test("Protocolo TCP Real - Resposta 'stream: OK' resulta em clean === true", async () => {
    const srv = createAdvancedClamdServer({ response: "stream: OK\0" });
    const port = await srv.start();
    try {
      const scanner = new ClamAVAttachmentScanner({ host: "127.0.0.1", port, timeoutMs: 2000 });
      const res = await scanner.scan(Buffer.from("%PDF-1.4\n%%EOF arquivo limpo"), "application/pdf");
      assert.equal(res.status, "clean");
      assert.equal(res.clean, true);
      assert.equal(res.engine, "clamav");
    } finally {
      await srv.stop();
    }
  });

  await t.test("Protocolo TCP Real - Resposta 'stream: Eicar-Signature FOUND' detecta infecção", async () => {
    const srv = createAdvancedClamdServer({ response: "stream: Eicar-Signature FOUND\0" });
    const port = await srv.start();
    try {
      const scanner = new ClamAVAttachmentScanner({ host: "127.0.0.1", port, timeoutMs: 2000 });
      const res = await scanner.scan(Buffer.from("%PDF-1.4\n%%EOF payload malicioso"), "application/pdf");
      assert.equal(res.status, "infected");
      assert.equal(res.clean, false);
      assert.equal(res.signature, "Eicar-Signature");
      assert.ok(res.reason?.includes("Eicar-Signature"));
    } finally {
      await srv.stop();
    }
  });

  await t.test("Protocolo TCP Real - Resposta 'stream: ERROR' aciona fail-closed com status failed", async () => {
    const srv = createAdvancedClamdServer({ response: "stream: ERROR\0" });
    const port = await srv.start();
    try {
      const scanner = new ClamAVAttachmentScanner({ host: "127.0.0.1", port, timeoutMs: 2000 });
      const res = await scanner.scan(Buffer.from("%PDF-1.4\n%%EOF erro no daemon"), "application/pdf");
      assert.equal(res.status, "failed");
      assert.equal(res.clean, false);
      assert.ok(res.reason?.includes("fail-closed"));
    } finally {
      await srv.stop();
    }
  });

  await t.test("Protocolo TCP Real - Timeout de comunicação com clamd aciona fail-closed", async () => {
    const srv = createAdvancedClamdServer({ delayMs: 1500 });
    const port = await srv.start();
    try {
      const scanner = new ClamAVAttachmentScanner({ host: "127.0.0.1", port, timeoutMs: 300 });
      const res = await scanner.scan(Buffer.from("%PDF-1.4\n%%EOF timeout"), "application/pdf");
      assert.equal(res.status, "failed");
      assert.equal(res.clean, false);
      assert.ok(res.reason?.includes("Timeout"), "Motivo deve relatar timeout");
    } finally {
      await srv.stop();
    }
  });

  await t.test("Protocolo TCP Real - Fechamento antecipado do socket (desconexão) aciona fail-closed", async () => {
    const srv = createAdvancedClamdServer({ closeAbruptly: true });
    const port = await srv.start();
    try {
      const scanner = new ClamAVAttachmentScanner({ host: "127.0.0.1", port, timeoutMs: 2000 });
      const res = await scanner.scan(Buffer.from("%PDF-1.4\n%%EOF socket destruído"), "application/pdf");
      assert.equal(res.status, "failed");
      assert.equal(res.clean, false);
    } finally {
      await srv.stop();
    }
  });

  await t.test("Protocolo TCP Real - Resposta malformada do servidor aciona fail-closed", async () => {
    const srv = createAdvancedClamdServer({ response: "UNKNOWN_PROTOCOL_PAYLOAD_500\0" });
    const port = await srv.start();
    try {
      const scanner = new ClamAVAttachmentScanner({ host: "127.0.0.1", port, timeoutMs: 2000 });
      const res = await scanner.scan(Buffer.from("%PDF-1.4\n%%EOF resposta malformada"), "application/pdf");
      assert.equal(res.status, "failed");
      assert.equal(res.clean, false);
      assert.ok(res.reason?.includes("UNKNOWN_PROTOCOL_PAYLOAD_500") || res.reason?.includes("fail-closed"));
    } finally {
      await srv.stop();
    }
  });

  await t.test("Protocolo TCP Real - Payload em múltiplos chunks respeita formato big-endian e terminador 4-bytes zero", async () => {
    let checkedChunks = false;
    const srv = createAdvancedClamdServer({
      response: "stream: OK\0",
      verifyChunks: (cmds, chunks) => {
        checkedChunks = true;
        assert.ok(cmds.includes("zINSTREAM"), "Comando zINSTREAM deve ter sido evocado");
        assert.ok(chunks.length >= 1, "Devia receber chunks do payload");
      }
    });
    const port = await srv.start();
    try {
      const scanner = new ClamAVAttachmentScanner({ host: "127.0.0.1", port, timeoutMs: 3000 });
      // Buffer de 150 KB para forçar o particionamento em múltiplos chunks de 64KB no envio
      const header = Buffer.from("%PDF-1.4\n");
      const body = Buffer.alloc(150000, "A");
      const eof = Buffer.from("\n%%EOF");
      const largePayload = Buffer.concat([header, body, eof]);
      
      const res = await scanner.scan(largePayload, "application/pdf");
      assert.equal(res.status, "clean");
      assert.equal(res.clean, true);
      assert.equal(checkedChunks, true, "Verificador de chunks do servidor deve ter sido executado");
    } finally {
      await srv.stop();
    }
  });

  await t.test("Integração E2E HTTP - Upload de EICAR é recusado (400 Bad Request)", async () => {
    const srv = createAdvancedClamdServer({ response: "stream: Win.Test.EICAR_HDB-1 FOUND\0" });
    const port = await srv.start();
    const storage = new InMemoryAttachmentStorage();
    const scanner = new ClamAVAttachmentScanner({ host: "127.0.0.1", port, timeoutMs: 2000 });

    const app = fastify();
    app.register(cookie);
    app.addHook("onRequest", async (req) => { (req as any).currentUser = { id: "user-1", role: "admin", name: "Admin" }; });
    app.register(attachmentRoutes, { attachmentStorage: storage, attachmentScanner: scanner });

    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/patients/${randomUUID()}/attachments`,
        payload: {
          fileName: "eicar.pdf",
          contentBase64: Buffer.from("%PDF-1.4\nEICAR-STANDARD-ANTIVIRUS-TEST-FILE\n%%EOF").toString("base64"),
          mimeType: "application/pdf",
          category: "exam",
          notes: "EICAR test",
        },
      });
      assert.equal(res.statusCode, 400, "Deve recusar EICAR com 400");
      const body = JSON.parse(res.payload);
      assert.ok(body.title.includes("Falha na verificação de segurança"), "Titulo deve indicar recusa do controle antivírus");
    } finally {
      await srv.stop();
      await app.close();
    }
  });

  await t.test("Integração E2E HTTP - Upload de PDF sintético limpo é aceito (201 Created)", async () => {
    const srv = createAdvancedClamdServer({ response: "stream: OK\0" });
    const port = await srv.start();
    const storage = new InMemoryAttachmentStorage();
    const scanner = new ClamAVAttachmentScanner({ host: "127.0.0.1", port, timeoutMs: 2000 });

    const app = fastify();
    app.register(cookie);
    app.addHook("onRequest", async (req) => { (req as any).currentUser = { id: "user-1", role: "admin", name: "Admin" }; });
    app.register(attachmentRoutes, { attachmentStorage: storage, attachmentScanner: scanner });

    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/patients/${randomUUID()}/attachments`,
        payload: {
          fileName: "exame_valido.pdf",
          contentBase64: Buffer.from("%PDF-1.4\n%%EOF sintético limpo de teste").toString("base64"),
          mimeType: "application/pdf",
          category: "exam_report",
          clinicalNotes: "Exame em ordem",
        },
      });
      assert.equal(res.statusCode, 201, "PDF sintético limpo deve ser aprovado pelo ClamAV e persistido com 201 Created");
      const body = JSON.parse(res.payload);
      assert.equal(body.status, "ready");
      assert.equal(body.category, "exam_report");
    } finally {
      await srv.stop();
      await app.close();
    }
  });

  await t.test("Integração E2E HTTP - Daemon parado aciona FAIL-CLOSED no upload sem vazar host/porta", async () => {
    const brokenPort = 65534;
    const storage = new InMemoryAttachmentStorage();
    const scanner = new ClamAVAttachmentScanner({ host: "127.0.0.1", port: brokenPort, timeoutMs: 500 });

    const app = fastify();
    app.register(cookie);
    app.addHook("onRequest", async (req) => { (req as any).currentUser = { id: "user-1", role: "admin", name: "Admin" }; });
    app.register(attachmentRoutes, { attachmentStorage: storage, attachmentScanner: scanner });

    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/patients/${randomUUID()}/attachments`,
        payload: {
          fileName: "laudo.pdf",
          contentBase64: Buffer.from("%PDF-1.4\n%%EOF teste limpo mas com daemon inoperante").toString("base64"),
          mimeType: "application/pdf",
          category: "exam",
          notes: "Teste fail-closed",
        },
      });
      assert.equal(res.statusCode, 503, "Em falha do daemon antivírus, deve suspender upload com 503 Service Unavailable");
      const body = JSON.parse(res.payload);
      // Garante que detalhes internos de host, porta ou stack trace NÃO vazem
      assert.ok(!body.title.includes("127.0.0.1") && !body.title.includes("65534") && !body.title.includes("ECONNREFUSED"));
      assert.ok(body.title.includes("Serviço de segurança antivírus indisponível") || body.title.includes("suspenso por segurança"));
    } finally {
      await app.close();
    }
  });

  await t.test("Integração E2E HTTP - Divergência de MIME é bloqueada na camada estrutural antes da varredura", async () => {
    const srv = createAdvancedClamdServer({ response: "stream: OK\0" });
    const port = await srv.start();
    const storage = new InMemoryAttachmentStorage();
    const scanner = new ClamAVAttachmentScanner({ host: "127.0.0.1", port, timeoutMs: 2000 });

    const app = fastify();
    app.register(cookie);
    app.addHook("onRequest", async (req) => { (req as any).currentUser = { id: "user-1", role: "admin", name: "Admin" }; });
    app.register(attachmentRoutes, { attachmentStorage: storage, attachmentScanner: scanner });

    try {
      // Cria buffer com Magic Bytes de imagem JPEG, mas declara como application/pdf
      const jpegMagic = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const res = await app.inject({
        method: "POST",
        url: `/api/patients/${randomUUID()}/attachments`,
        payload: {
          fileName: "fake-pdf.jpg",
          contentBase64: jpegMagic.toString("base64"),
          mimeType: "application/pdf", // Divergente dos Magic Bytes
          category: "exam",
          notes: "MIME divergence",
        },
      });
      assert.equal(res.statusCode, 400, "MIME divergente deve ser recusado com 400");
      const body = JSON.parse(res.payload);
      assert.ok(body.title.includes("Divergência entre MIME declarado") || body.title.includes("Falha na verificação"));
      // Confirma que nenhuma requisição TCP INSTREAM precisou ser enviada ao clamd pois falhou na estrutura
      assert.equal(srv.getConnectionCount(), 0, "Nenhuma conexão TCP clamd deve ser aberta para arquivos estruturalmente inválidos");
    } finally {
      await srv.stop();
      await app.close();
    }
  });

  await t.test("Integração Health Policy - Indisponibilidade do ClamAV torna o sistema 'unavailable' no /api/health", async () => {
    const storage = new InMemoryAttachmentStorage();
    const scanner = new ClamAVAttachmentScanner({ host: "127.0.0.1", port: 65534, timeoutMs: 300 });

    const app = fastify();
    app.register(cookie);
    app.register(healthRoutes, { attachmentStorage: storage, attachmentScanner: scanner });

    try {
      const res = await app.inject({ method: "GET", url: "/api/health" });
      const body = JSON.parse(res.payload);
      assert.equal(body.scanner, "down", "Scanner na porta inoperante deve constar como down");
      assert.equal(body.status, "unavailable", "Status geral do health deve refletir 'unavailable' por falha em subsistema crítico de segurança (antivírus)");
    } finally {
      await app.close();
    }
  });

  await t.test("Integração Health Policy - Scanner operando com PING/PONG reporta 'ok' e status saudável", async () => {
    const srv = createAdvancedClamdServer({ response: "stream: OK\0" });
    const port = await srv.start();
    const storage = new InMemoryAttachmentStorage();
    const scanner = new ClamAVAttachmentScanner({ host: "127.0.0.1", port, timeoutMs: 2000 });

    const app = fastify();
    app.register(cookie);
    app.register(healthRoutes, { attachmentStorage: storage, attachmentScanner: scanner });

    try {
      const res = await app.inject({ method: "GET", url: "/api/health" });
      const body = JSON.parse(res.payload);
      assert.equal(body.scanner, "ok", "Scanner com resposta PONG deve reportar scanner === 'ok'");
      assert.ok(srv.getCommands().includes("zPING"), "Health check deve utilizar comando zPING nativo do ClamAV");
    } finally {
      await srv.stop();
      await app.close();
    }
  });
});
