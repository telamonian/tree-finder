import { test, expect } from "@playwright/test";

async function getElement(page) {
  return await page.evaluate(async () => {
    await new Promise((resolve) => setTimeout(() => resolve(), 1000));
    return document.querySelector("tree-finder-panel").outerHTML;
  });
}

test.describe("Basic render test", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("./index.html", {
      waitUntil: "networkidle",
    });

    // wait up to 10s for tree-finder to render
    await page.waitForFunction(
      () => document.querySelector("tree-finder-panel"),
      null,
      { timeout: 10000 }
    );
  });

  test("exists", async ({ page }) => {
    const tree = await getElement(page);
    await expect(tree).not.toBe(null)
    await expect(tree).toContain("<tree-finder-panel>");
  });

  test("structure", async ({ page }) => {
    const tree = await getElement(page);
    await expect(tree).toContain("<tree-finder-panel>");
    await expect(tree).toContain("<tree-finder-breadcrumbs");
    await expect(tree).toContain("<tree-finder-grid");
  });
});
