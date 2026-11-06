import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
const url = process.env.KT_TEST_URL || "http://127.0.0.1:5173";
const fixture = fileURLToPath(
  new URL("./fixtures/kt-demo.pdf", import.meta.url),
);
test("live KT: PDF persistence, audience privacy, timing, questions and breaks", async () => {
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
    await page.clock.install({ time: new Date() });
    await page.goto(url);
    await page
      .getByRole("button", { name: /En preparación.*Una idea/ })
      .click();
    await page
      .getByLabel("NOTAS DEL PRESENTADOR")
      .fill("SECRETO: solo debe verlo el presentador.");
    await page.getByLabel("Seleccionar PDF").setInputFiles({
      name: "ejemplo.pptx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      buffer: Buffer.from("pptx"),
    });
    await expect(page.getByRole("alert")).toContainText(
      "Exportá tu PowerPoint a PDF",
    );
    await page.getByLabel("Seleccionar PDF").setInputFiles({
      name: "roto.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("not a pdf"),
    });
    await expect(page.getByRole("alert")).toContainText(
      "No se pudo abrir el PDF",
    );
    await page.getByLabel("Seleccionar PDF").setInputFiles(fixture);
    await expect(page.getByTestId("page-count")).toHaveText("1 / 2");
    await page.waitForFunction(() => {
      const c = document.querySelector("canvas");
      if (!c?.width) return false;
      const data = c.getContext("2d").getImageData(0, 0, 1, 1).data;
      return data[3] === 255 && data[0] < 220;
    });
    await expect(page.getByRole("status")).toContainText("PDF guardado");
    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("button", { name: "Abrir audiencia" }).click();
    const audience = await popupPromise;
    audience.on("pageerror", (e) => errors.push(e.message));
    await expect(audience.locator(".audience-header")).toContainText(
      "Apertura",
    );
    await expect(audience.locator("body")).not.toContainText("SECRETO");
    await expect(audience.locator(".audience-screen")).toHaveCSS(
      "display",
      "flex",
    );
    await page.getByRole("button", { name: "Página siguiente" }).click();
    await expect(page.getByTestId("page-count")).toHaveText("2 / 2");
    await expect(audience.getByLabel("Página 2 del PDF")).toBeVisible();
    await page
      .getByRole("button", { name: "Comenzar esta fase en página 2" })
      .click();
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    await page.getByRole("button", { name: "Iniciar cronómetro" }).click();
    await page.clock.fastForward(5500);
    await expect(page.getByTestId("total-time")).toHaveText("00:05");
    await expect(page.getByTestId("phase-time")).toHaveText("04:55");
    await page.getByRole("button", { name: "Pausar cronómetro" }).click();
    await page.clock.fastForward(5000);
    await expect(page.getByTestId("total-time")).toHaveText("00:05");
    await page.getByRole("button", { name: "Agregar descanso" }).click();
    await expect(page.locator(".break-countdown")).toHaveText("10:00");
    await expect(audience.locator(".break-countdown")).toHaveText("10:00");
    await page.getByRole("button", { name: "Iniciar cronómetro" }).click();
    await page.clock.fastForward(10 * 60 * 1000 + 1000);
    await expect(page.locator(".break-countdown")).toHaveText("+00:01");
    await expect(page.locator(".break-stage")).toContainText(
      "Terminó el descanso",
    );
    await page.getByRole("button", { name: "Pausar cronómetro" }).click();
    await page.getByRole("button", { name: "1 minuto", exact: true }).click();
    await expect(page.locator(".break-countdown")).toHaveText("00:59");
    await page
      .getByRole("button", { name: "Reiniciar fase", exact: true })
      .click();
    await expect(page.locator(".break-countdown")).toHaveText("11:00");
    await page.getByRole("button", { name: "Agregar pregunta" }).click();
    await page
      .getByLabel("Pregunta al grupo")
      .fill("¿Dónde dejamos el conocimiento del equipo?");
    await expect(
      audience.getByRole("heading", {
        name: "¿Dónde dejamos el conocimiento del equipo?",
      }),
    ).toBeVisible();
    await expect(audience.locator(".answer.correct")).toHaveCount(0);
    await page.getByRole("button", { name: "Revelar respuesta" }).click();
    await expect(audience.locator(".answer.correct")).toHaveCount(1);
    await page.getByRole("button", { name: "Ocultar respuesta" }).click();
    await expect(audience.locator(".answer.correct")).toHaveCount(0);
    await page.getByLabel("Opciones de respuesta").fill("");
    await expect(audience.locator(".answer")).toHaveCount(0);
    await expect(audience.locator(".question-stage")).toContainText(
      "Compartí tu respuesta con el grupo.",
    );
    await page
      .getByRole("button", { name: "Mover antes", exact: true })
      .click();
    await expect(page.locator(".timeline-item.selected")).toContainText(
      "Pregunta al grupo",
    );
    await page
      .getByRole("button", { name: "Mover después", exact: true })
      .click();
    await page.screenshot({
      path: "/tmp/kt-session-desktop.png",
      fullPage: true,
    });
    for (const width of [1024, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `no overflow at ${width}px`,
      );
    }
    await page.screenshot({
      path: "/tmp/kt-session-tablet.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Volver a presentaciones" }).click();
    await expect(audience.getByRole("status")).toContainText(
      "La sesión se cerró",
    );
    await page.clock.resume();
    await audience.reload();
    await expect(
      audience.getByRole("heading", { name: "Vista de audiencia" }),
    ).toBeVisible();
    await page.reload();
    await page
      .getByRole("button", { name: /En preparación.*Una idea/ })
      .click();
    await expect(page.getByTestId("page-count")).toHaveText("2 / 2");
    await expect(page.getByTestId("total-time")).toHaveText("00:00");
    await expect(page.getByLabel("NOTAS DEL PRESENTADOR")).toHaveValue(
      "SECRETO: solo debe verlo el presentador.",
    );
    await page.getByRole("button", { name: /Descanso.*11 min/ }).click();
    await expect(page.locator(".break-countdown")).toHaveText("11:00");
    await page
      .getByRole("button", { name: "Reiniciar sesión", exact: true })
      .click();
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
