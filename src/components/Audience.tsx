import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Stage, type PublicStage } from "./Stage";
import { openPdf } from "./PdfCanvas";
import { formatTime } from "../hooks/useSessionClock";
export function Audience({ id }: { id: string }) {
  const [state, setState] = useState<PublicStage>();
  const [blob, setBlob] = useState<Blob>();
  const [document, setDocument] = useState<PDFDocumentProxy>();
  const [message, setMessage] = useState(
    "Abrí la sesión en el panel del presentador para recibir el contenido.",
  );
  useEffect(() => {
    const channel = new BroadcastChannel(`kt-audience-${id}`);
    channel.onmessage = ({ data }) => {
      if (data.type === "state") {
        setState(data.state);
        setMessage("");
      }
      if (data.type === "document") setBlob(data.blob);
      if (data.type === "ended") {
        setState(undefined);
        setMessage("La sesión se cerró. Podés cerrar esta ventana.");
      }
    };
    channel.postMessage({ type: "ready" });
    return () => channel.close();
  }, [id]);
  useEffect(() => {
    if (!blob) return;
    let cancelled = false;
    let pdf: PDFDocumentProxy | undefined;
    openPdf(blob)
      .then((value) => {
        pdf = value;
        if (cancelled) void value.loadingTask.destroy();
        else {
          setDocument(value);
          setMessage("");
        }
      })
      .catch(() => {
        if (!cancelled) setMessage("No se pudo cargar el PDF en esta ventana.");
      });
    return () => {
      cancelled = true;
      setDocument(undefined);
      void pdf?.loadingTask.destroy();
    };
  }, [blob]);
  return (
    <main className="audience-screen">
      {state ? (
        <>
          <header className="audience-header">
            <strong>{state.title}</strong>
            <span>
              Fase {state.phaseNumber} / {state.phaseCount} · {state.phaseTitle}
            </span>
            <span>
              {formatTime(state.remaining)} {state.running ? "" : "· En pausa"}
            </span>
          </header>
          {message && <p role="status">{message}</p>}
          <Stage state={state} document={document} />
          <footer>
            KT Presenter<span>Vista de audiencia · Sin notas privadas</span>
            <button
              className="text-button"
              onClick={() => {
                if (!window.document.documentElement.requestFullscreen) {
                  setMessage(
                    "Usá el control de pantalla completa del navegador.",
                  );
                  return;
                }
                if (!window.document.fullscreenElement)
                  void window.document.documentElement
                    .requestFullscreen()
                    .catch(() =>
                      setMessage(
                        "Usá el control de pantalla completa del navegador.",
                      ),
                    );
                else void window.document.exitFullscreen();
              }}
            >
              Pantalla completa
            </button>
          </footer>
        </>
      ) : (
        <div className="document-empty">
          <h1>Vista de audiencia</h1>
          <p role="status">{message}</p>
          <p>
            Esta ventana se sincroniza con el presentador en el mismo
            dispositivo.
          </p>
        </div>
      )}
    </main>
  );
}
