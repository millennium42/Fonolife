import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

test("Não devem existir caracteres corrompidos (mojibake) no repositório", async (t) => {
  const repoRoot = process.cwd();
  
  // Get tracked text files
  const filesOutput = execSync("git ls-files", { cwd: repoRoot, encoding: "utf8" });
  const files = filesOutput.split("\n").map(f => f.trim()).filter(Boolean);

  const textExtensions = [".ts", ".tsx", ".js", ".html", ".css", ".json", ".md"];
  const trackedTextFiles = files.filter(f => 
    textExtensions.includes(path.extname(f)) &&
    !f.includes("mojibake")
  );

  const mojibakeRegex = /(\ufffd|Ã|Â|â€|ðŸ)/;

  // Allowed exceptions where "Ã" is legally used (e.g., uppercase A with tilde in "DEMONSTRAÇÃO", "NÃO")
  // Or "Â" in uppercase words.
  const allowedPatterns = [
    /NÃO/g,
    /DEMONSTRAÇÃO/g,
    /AÇÕES/g,
    /PADRÃO/g,
    /CARTÃO/g,
    /SÃO/g,
    /MANUTENÇÃO/g,
    /ÂMBITO/g,
    /ÂNGULO/g,
  ];

  const filesWithMojibake: string[] = [];

  for (const file of trackedTextFiles) {
    const filePath = path.join(repoRoot, file);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, "utf8");

    // Remove allowed patterns
    for (const pattern of allowedPatterns) {
      content = content.replace(pattern, "");
    }

    if (mojibakeRegex.test(content)) {
      const match = content.match(mojibakeRegex);
      filesWithMojibake.push(`${file} (found: ${match?.[0]})`);
    }
  }

  assert.deepEqual(
    filesWithMojibake, 
    [], 
    "Foram encontrados caracteres suspeitos de mojibake (, Ã, Â, â€, ðŸ) nos arquivos acima. Caso sejam legítimos, adicione à lista de exceções."
  );
});
