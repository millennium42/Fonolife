import test from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import { ClamAVAttachmentScanner } from "../src/domain/attachments.js";

function createFakeClamdServer(responseType: "OK" | "FOUND" | "ERROR" | "PONG" = "OK", customSignature = "Win.Test.Malware-HDB-1") {
  let connectionCount = 0;
  const receivedCommands: string[] = [];

  const server = net.createServer((socket) => {
    connectionCount++;
    socket.on("data", (data) => {
      const str = data.toString("binary");
      receivedCommands.push(str);

      if (str.includes("zPING") || str === "PING") {
        socket.write("PONG\0");
        return;
      }

      if (str.includes("INSTREAM") || str.includes("zINSTREAM")) {
        // Quando o stream conclui com zero de 4 bytes (0x00000000) ou após o buffer
        if (responseType === "OK") {
          socket.write("stream: OK\0");
        } else if (responseType === "FOUND") {
          socket.write(`stream: ${customSignature} FOUND\0`);
        } else if (responseType === "ERROR") {
          socket.write("stream: ERROR\0");
        }
        socket.end();
      }
    });
  });

  return {
    start: (): Promise<number> => new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const port = (server.address() as net.AddressInfo).port;
        resolve(port);
      });
    }),
    stop: (): Promise<void> => new Promise((resolve) => server.close(() => resolve())),
    getConnectionCount: () => connectionCount,
    getReceivedCommands: () => receivedCommands,
  };
}

test("PROMPT 02 — Reprodução do Defeito no Scanner ClamAV (comunicação simulada vs. real via TCP)", async (t) => {
  await t.test("ClamAVAttachmentScanner deve conectar ao daemon real via TCP INSTREAM e não apenas checar string em memória", async () => {
    const clamdServer = createFakeClamdServer("OK");
    const port = await clamdServer.start();

    try {
      const scanner = new ClamAVAttachmentScanner({ host: "127.0.0.1", port, timeoutMs: 2000 });
      const testPayload = Buffer.from("%PDF-1.4\n%%EOF arquivo limpo de teste", "utf-8");
      
      const result = await scanner.scan(testPayload, "application/pdf");

      // Comprova se houve conexão TCP real com o daemon
      assert.ok(clamdServer.getConnectionCount() > 0, "Scanner deve abrir conexão TCP com host/port do clamd");
      assert.equal(result.status, "clean");
      assert.equal(result.clean, true);
    } finally {
      await clamdServer.stop();
    }
  });

  await t.test("Fail-closed em indisponibilidade: porta inoperante/falha de conexão não pode retornar clean", async () => {
    // Porta onde não há servidor TCP respondendo
    const brokenPort = 65534;
    const scanner = new ClamAVAttachmentScanner({ host: "127.0.0.1", port: brokenPort, timeoutMs: 500 });

    const result = await scanner.scan(Buffer.from("%PDF-1.4\n%%EOF teste", "utf-8"), "application/pdf");

    assert.equal(result.status, "failed", "Em falha de rede/daemon parado, status deve ser 'failed' (fail-closed)");
    assert.equal(result.clean, false, "Em falha de rede/daemon parado, clean deve ser false (fail-closed)");
  });

  await t.test("Health check / ping no daemon ClamAV com inspeção da resposta lógica PONG", async () => {
    const clamdServer = createFakeClamdServer("OK");
    const port = await clamdServer.start();

    try {
      const scanner = new ClamAVAttachmentScanner({ host: "127.0.0.1", port, timeoutMs: 2000 });
      assert.equal(typeof (scanner as any).healthCheck, "function", "ClamAVAttachmentScanner deve implementar método healthCheck() ou ping()");
      const health = await (scanner as any).healthCheck();
      assert.equal(health.status, "ok");
    } finally {
      await clamdServer.stop();
    }
  });
});
