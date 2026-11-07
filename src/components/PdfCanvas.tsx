import { useEffect, useRef, useState } from "react";
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
GlobalWorkerOptions.workerSrc = workerUrl;
export async function openPdf(blob: Blob) {
  const task = getDocument({
    data: new Uint8Array(await blob.arrayBuffer()),
    cMapUrl: new URL(
      `${import.meta.env.BASE_URL}pdfjs/cmaps/`,
      window.location.href,
    ).href,
    cMapPacked: true,
    standardFontDataUrl: new URL(
      `${import.meta.env.BASE_URL}pdfjs/standard_fonts/`,
      window.location.href,
    ).href,
    wasmUrl: new URL(
      `${import.meta.env.BASE_URL}pdfjs/wasm/`,
      window.location.href,
    ).href,
    iccUrl: new URL(
      `${import.meta.env.BASE_URL}pdfjs/iccs/`,
      window.location.href,
    ).href,
  });
  task.onPassword = () => {
    void task.destroy();
  };
  return task.promise;
}
export function PdfCanvas({
  document,
  page,
}: {
  document: PDFDocumentProxy;
  page: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState("");
  const [rendering, setRendering] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.floor(entries[0].contentRect.width)),
    );
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!width || !canvas.current) return;
    let cancelled = false;
    let task:
      | ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]>
      | undefined;
    setError("");
    setRendering(true);
    document
      .getPage(page)
      .then((pdfPage) => {
        if (cancelled || !canvas.current) return;
        const original = pdfPage.getViewport({ scale: 1 });
        // Bound raster memory even on high-density tablet screens and huge PDF pages.
        const scale = Math.min(
          width / original.width,
          1800 / original.width,
          2400 / original.height,
        );
        const viewport = pdfPage.getViewport({ scale });
        canvas.current.width = Math.ceil(viewport.width);
        canvas.current.height = Math.ceil(viewport.height);
        task = pdfPage.render({ canvas: canvas.current, viewport });
        return task.promise.then(() => {
          if (!cancelled) setRendering(false);
        });
      })
      .catch((error) => {
        if (!cancelled && error?.name !== "RenderingCancelledException") {
          setRendering(false);
          console.error("PDF rendering failed:", error?.name, error?.message);
          setError("No se pudo dibujar esta página del PDF.");
        }
      });
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [document, page, width, attempt]);
  return (
    <div
      className="pdf-canvas"
      ref={container}
      aria-busy={rendering}
      data-render-state={error ? "error" : rendering ? "loading" : "ready"}
    >
      {error && (
        <div className="pdf-render-error">
          <p role="alert">{error}</p>
          <button
            className="secondary"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Reintentar página
          </button>
        </div>
      )}
      {rendering && (
        <p className="pdf-render-status" aria-live="polite">
          Preparando página {page}…
        </p>
      )}
      <canvas
        ref={canvas}
        hidden={!!error}
        aria-label={`Página ${page} del PDF`}
      />
    </div>
  );
}
