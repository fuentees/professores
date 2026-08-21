import { expect, test } from "@playwright/test";
import axe from "axe-core";

const ROUTES = ["/", "/materiais", "/entrar"];

for (const route of ROUTES) {
  test(`${route} não tem violações graves de acessibilidade`, async ({ page }) => {
    await page.goto(route);
    await page.addScriptTag({ content: axe.source });

    const violations = await page.evaluate(async () => {
      const axeApi = (window as typeof window & {
        axe: { run: (root: Document, options: unknown) => Promise<{ violations: Array<{ id: string; impact: string | null; nodes: Array<{ target: unknown }> }> }> };
      }).axe;
      const result = await axeApi.run(document, {
        resultTypes: ["violations"],
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      });
      return result.violations
        .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
        .map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.length,
          targets: violation.nodes.slice(0, 12).map((node) => node.target),
        }));
    });

    expect(violations).toEqual([]);
  });
}
