import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
const url = process.env.KT_TEST_URL || "http://127.0.0.1:5173";
// A user-supplied document can be tested locally without publishing it in Git.
const fixture =
  process.env.KT_PDF_COMPAT_FIXTURE ||
  fileURLToPath(new URL("./fixtures/kt-demo.pdf", import.meta.url));
test("PDF renderer supports browsers without modern Map upsert APIs, across pages and audience", async () => {
  const browser = await chromium.launch({
    executablePath: process.env.KT_CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 800, height: 1100 },
    });
    await context.addInitScript(() => {
      for (const prototype of [Map.prototype, WeakMap.prototype]) {
        delete prototype.getOrInsertComputed;
        delete prototype.getOrInsert;
      }
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && m.text().includes("PDF rendering failed"))
        errors.push(m.text());
    });
    await page.goto(url);
    assert.equal(
      await page.evaluate(() => typeof Map.prototype.getOrInsertComputed),
      "undefined",
    );
    await page
      .getByRole("button", { name: /En preparación.*Una idea/ })
      .click();
    await page.getByLabel("Seleccionar PDF").setInputFiles(fixture);
    await expect(page.locator(".pdf-canvas")).toHaveAttribute(
      "data-render-state",
      "ready",
      { timeout: 20000 },
    );
    const count = Number(
      (await page.getByTestId("page-count").textContent()).split("/")[1],
    );
    assert.ok(count > 0);
    for (let i = 1; i <= count; i++) {
      await expect(page.getByTestId("page-count")).toHaveText(
        `${i} / ${count}`,
      );
      await expect(page.locator(".pdf-canvas")).toHaveAttribute(
        "data-render-state",
        "ready",
        { timeout: 20000 },
      );
      assert.equal(
        await page
          .locator("canvas")
          .evaluate(
            (c) =>
              c.width > 0 &&
              c.height > 0 &&
              c
                .getContext("2d")
                .getImageData(
                  Math.floor(c.width / 2),
                  Math.floor(c.height / 2),
                  1,
                  1,
                ).data[3] > 0,
          ),
        true,
      );
      if (i < count)
        await page.getByRole("button", { name: "Página siguiente" }).click();
    }
    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("button", { name: "Abrir audiencia" }).click();
    const audience = await popupPromise;
    audience.on("pageerror", (e) => errors.push(e.message));
    await expect(audience.locator(".pdf-canvas")).toHaveAttribute(
      "data-render-state",
      "ready",
      { timeout: 20000 },
    );
    // Repeat rapid navigation and a responsive resize to cancel in-flight renders.
    if (count > 1) {
      await page.getByRole("button", { name: "Página anterior" }).click();
      await page.getByRole("button", { name: "Página siguiente" }).click();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator(".pdf-canvas")).toHaveAttribute(
      "data-render-state",
      "ready",
      { timeout: 20000 },
    );
    await expect(audience.locator(".pdf-canvas")).toHaveAttribute(
      "data-render-state",
      "ready",
      { timeout: 20000 },
    );
    assert.equal(await page.getByRole("alert").count(), 0);
    assert.deepEqual(errors, []);
    console.log(
      `Rendered ${count} pages, audience and resize without native Map upsert APIs.`,
    );
  } finally {
    await browser.close();
  }
});
