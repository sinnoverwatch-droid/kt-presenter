import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const url = process.env.KT_TEST_URL || "http://127.0.0.1:5173";
test("create, edit, advance, persist and navigate a presentation on desktop and mobile", async () => {
  const browser = await chromium.launch({
    executablePath: process.env.KT_CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    await page
      .getByRole("heading", { name: "Presentaciones recientes" })
      .waitFor();
    await page.screenshot({ path: "/tmp/kt-home.png", fullPage: true });
    await page
      .getByRole("button", { name: "Crear presentación", exact: true })
      .click();
    await page
      .getByLabel("Nombre de la presentación")
      .fill("Mi taller de React");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Crear presentación", exact: true })
      .click();
    await page.getByRole("heading", { name: "Mi taller de React" }).waitFor();
    await page.getByLabel("Nombre de la fase").fill("Introducción");
    await page
      .getByLabel("NOTAS DEL PRESENTADOR")
      .fill("Presentar los objetivos del taller.");
    await page
      .getByRole("button", { name: "Marcar como completada", exact: true })
      .click();
    await page.getByRole("button", { name: "Siguiente fase" }).click();
    assert.equal(
      await page.getByLabel("Nombre de la fase").inputValue(),
      "Desarrollo",
    );
    await page.getByRole("button", { name: "Agregar fase" }).click();
    assert.equal(
      await page.getByLabel("Nombre de la fase").inputValue(),
      "Nueva fase",
    );
    await page.getByRole("button", { name: "Presentar", exact: true }).click();
    await page.getByRole("button", { name: "Salir de presentación" }).waitFor();
    await page.keyboard.press("Escape");
    await page.reload();
    await page.getByRole("button", { name: /Presentaciones/ }).click();
    await page.getByPlaceholder("Buscar presentaciones…").fill("Mi taller");
    await page.getByRole("button", { name: /Mi taller de React/ }).click();
    assert.equal(
      await page.getByLabel("Nombre de la fase").inputValue(),
      "Introducción",
    );
    assert.equal(
      await page.getByLabel("NOTAS DEL PRESENTADOR").inputValue(),
      "Presentar los objetivos del taller.",
    );
    await page
      .getByRole("button", { name: "Completada", exact: true })
      .waitFor();
    await page.screenshot({ path: "/tmp/kt-phases.png", fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: "/tmp/kt-mobile.png", fullPage: true });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      "no mobile overflow",
    );
    await page.getByRole("button", { name: "Volver a presentaciones" }).click();
    await page
      .getByPlaceholder("Buscar presentaciones…")
      .fill("sin coincidencias");
    await page
      .getByRole("heading", { name: "No encontramos presentaciones" })
      .waitFor();
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
