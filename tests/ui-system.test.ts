import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");

describe("design system clínico", () => {
  test("expõe os componentes compartilhados obrigatórios", () => {
    const source = read("web", "src", "components", "ui.tsx");
    for (const component of [
      "AppShell",
      "Sidebar",
      "TopBar",
      "PageHeader",
      "QuickActions",
      "Button",
      "IconButton",
      "Modal",
      "ConfirmModal",
      "FormModal",
      "Drawer",
      "Card",
      "StatCard",
      "DataTable",
      "Badge",
      "FilterBar",
      "Tabs",
      "Toast",
      "EmptyState",
      "ErrorState",
      "LoadingState",
      "Skeleton",
      "PatientLink",
    ]) {
      assert.match(source, new RegExp(`export function ${component}\\b`), component);
    }
  });

  test("centraliza diálogo e navegação de paciente", () => {
    const app = read("web", "src", "main.tsx");
    assert.doesNotMatch(app, /modal-overlay|modal-content/);
    assert.doesNotMatch(app, /window\.(alert|confirm|prompt)\s*\(/);
    assert.doesNotMatch(app, /function PatientNameLink\b/);
    assert.match(app, /<PatientLink\b/);
  });

  test("mantém foco visível, movimento reduzido e tabela responsiva", () => {
    const style = read("web", "src", "style.css");
    assert.match(style, /:focus-visible/);
    assert.match(style, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    assert.match(style, /\.table-scroll/);
  });

  test("versiona baselines visuais estáveis para todos os viewports", () => {
    for (const viewport of ["mobile-360", "tablet-768", "desktop-1440"]) {
      for (const screen of ["login", "dashboard", "financeiro-modal"]) {
        assert.equal(
          existsSync(join(root, "tests", "e2e", "visual-baseline.spec.ts-snapshots", `${screen}-${viewport}.png`)),
          true,
          `${screen}-${viewport}`,
        );
      }
    }
  });
});
