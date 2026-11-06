import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
const url = process.env.KT_TEST_URL || "http://127.0.0.1:5173";
const fixture = fileURLToPath(
  new URL("./fixtures/kt-demo.pdf", import.meta.url),
);
test("page interactions live in the app, sync to audience and leave the PDF untouched", async () => {
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
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    await page
      .getByRole("button", { name: /En preparación.*Una idea/ })
      .click();
    await page.getByLabel("Seleccionar PDF").setInputFiles(fixture);
    await expect(page.getByTestId("page-count")).toHaveText("1 / 2");
    await expect(page.getByRole("status")).toContainText("PDF guardado");
    await page
      .getByRole("button", { name: "Agregar interacción a esta página" })
      .click();
    await expect(page.getByLabel("Contexto de la interacción")).toContainText(
      "Bienvenida",
    );
    await page
      .getByLabel("Título de la interacción")
      .fill("Una situación de trabajo");
    await page
      .getByLabel("Contexto de la interacción")
      .fill("El equipo recibe una tarea sin documentación.");
    await page
      .getByLabel("Pregunta de la interacción")
      .fill("¿Qué harías primero?");
    await page
      .getByLabel("Opciones de la interacción")
      .fill("Adivinar\nPedir contexto\nIgnorar el pedido");
    await page
      .getByLabel("Respuesta correcta de la interacción")
      .selectOption("1");
    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("button", { name: "Abrir audiencia" }).click();
    const audience = await popupPromise;
    audience.on("pageerror", (e) => errors.push(e.message));
    await expect(audience.locator(".page-interaction")).toContainText(
      "El equipo recibe una tarea sin documentación.",
    );
    await expect(audience.locator(".page-interaction .correct")).toHaveCount(0);
    await page.locator(".page-interaction .answer").nth(1).click();
    await expect(audience.locator(".page-interaction .chosen")).toContainText(
      "Pedir contexto",
    );
    await page.getByRole("button", { name: "Revelar solución" }).click();
    await expect(audience.locator(".page-interaction .correct")).toContainText(
      "Pedir contexto",
    );
    await page.getByRole("button", { name: "Página siguiente" }).click();
    await expect(page.locator(".page-interaction")).toHaveCount(0);
    await expect(audience.locator(".page-interaction")).toHaveCount(0);
    await page.getByRole("button", { name: "Página anterior" }).click();
    await expect(page.locator(".page-interaction")).toContainText(
      "¿Qué harías primero?",
    );
    await expect(page.locator(".page-interaction .correct")).toHaveCount(0);
    await page.getByRole("button", { name: "Ocultar actividad" }).click();
    await expect(audience.locator(".page-interaction")).toHaveCount(0);
    await page.getByRole("button", { name: "Mostrar actividad" }).click();
    await expect(audience.locator(".page-interaction")).toBeVisible();
    await page.setViewportSize({ width: 768, height: 1024 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.screenshot({
      path: "/tmp/kt-page-interaction.png",
      fullPage: true,
    });
    await page.reload();
    await page
      .getByRole("button", { name: /En preparación.*Una idea/ })
      .click();
    await expect(page.locator(".page-interaction")).toContainText(
      "¿Qué harías primero?",
    );
    const hash = await page.evaluate(async () => {
      const database = await new Promise((resolve, reject) => {
        const request = indexedDB.open("kt-presenter-files", 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const stored = await new Promise((resolve, reject) => {
        const request = database
          .transaction("documents")
          .objectStore("documents")
          .get("demo");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const digest = await crypto.subtle.digest(
        "SHA-256",
        await stored.blob.arrayBuffer(),
      );
      database.close();
      return [...new Uint8Array(digest)]
        .map((n) => n.toString(16).padStart(2, "0"))
        .join("");
    });
    assert.equal(
      hash,
      createHash("sha256")
        .update(await readFile(fixture))
        .digest("hex"),
    );
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
