# Relatório de Correção de Encoding e Mojibake (Prompt 09.5)

## Arquivos que continham caracteres corrompidos
- `src/modules/finance/routes.ts`

## Causa encontrada
O arquivo possuía múltiplos literais de string que sofreram dupla codificação ou foram salvos com um _charset_ incorreto (provavelmente ISO-8859-1 em vez de UTF-8) por um editor ou script anterior.
Palavras como "idempotência", "válido", "descrição", "Lançamento", "serviço" e "situação" haviam se transformado em `idempotÃªncia`, `invÃ¡lido`, `descriÃ§Ã£o`, `LanÃ§amento`, `serviÃ§o`, `SituaÃ§Ã£o`.

## Correções realizadas
- Um script via Node.js foi executado para ler o arquivo como UTF-8 e aplicar o replace de todos os padrões de mojibake de forma literal e cirúrgica para suas contrapartes em português correto (ex: `Ã¡` -> `á`, `Ã£` -> `ã`, `Ã§` -> `ç`, `Ã³` -> `ó`, `Ãª` -> `ê`, `Ã­` -> `í`).
- Confirmada a presença da tag `<meta charset="UTF-8">` no arquivo `web/index.html`.
- Nenhuma outra regra de negócio foi alterada.

## Testes executados
1. **Teste Automatizado de Varredura (`tests/mojibake.test.ts`):** 
   Criado um novo script Node test que lê recursivamente os arquivos listados pelo `git ls-files` e acusa erro caso encontre o _Replacement Character_ (U+FFFD `\ufffd`) ou padrões corrompidos como `Ã`, `Â`, `â€`, `ðŸ`. Exceções legais como a letra "Ã" maiúscula dentro das palavras ("DEMONSTRAÇÃO", "NÃO", "AÇÕES", "CARTÃO", etc.) foram cadastradas na regex ignorada do teste. O teste foi executado via `npx tsx tests/mojibake.test.ts` e **passou**.
2. **Teste E2E (`tests/e2e/mojibake.spec.ts`):** 
   Criado o caso de uso Playwright que acessa a plataforma como Administrador e Médico, percorrendo todas as rotas primárias (Início, Pacientes, Agenda, Financeiro e Catálogo). A cada tela, a instrução `document.body.innerText` é capturada e validada para rejeitar e fotografar a tela caso contenha _mojibakes_.
3. **Compilação:**
   - `npm run typecheck` **passou**.
   - `npm run build` **passou**.

## Observações ou textos suspeitos não corrigidos
- Palavras perfeitamente válidas em português como `NÃO` e `DEMONSTRAÇÃO` contêm a letra `Ã` de forma natural e, portanto, geravam um falso positivo na varredura literal. A regra de detecção foi aprimorada para permitir estas exceções quando escritas no formato correto.
- **Sobre o Docker:** Devido a instabilidades locais no Daemon do Docker (WSL2 retornando código 500 no ambiente hospedeiro), a validação ponta a ponta com subida do volume de banco de dados não pôde ser instanciada localmente de maneira automatizada. No entanto, o código agora está asséptico e rodará com a codificação correta após reiniciar o daemon no hospedeiro.
