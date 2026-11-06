import { Coffee, FileText, MessageCircle } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { PdfCanvas } from "./PdfCanvas";
import "./session.css";
import { formatTime } from "../hooks/useSessionClock";
export interface PublicStage {
  title: string;
  phaseTitle: string;
  kind: "content" | "question" | "break";
  phaseNumber: number;
  phaseCount: number;
  remaining: number;
  elapsed: number;
  running: boolean;
  page: number;
  question: string;
  options: string[];
  revealedAnswer?: number;
}
export function Stage({
  state,
  document,
}: {
  state: PublicStage;
  document?: PDFDocumentProxy;
}) {
  if (state.kind === "break")
    return (
      <div className="break-stage">
        <span className="stage-symbol">
          <Coffee size={34} />
        </span>
        <span className="eyebrow">HACEMOS UNA PAUSA</span>
        <h2>{state.phaseTitle}</h2>
        <div className="break-countdown">{formatTime(state.remaining)}</div>
        <p>
          {state.remaining < 0
            ? "Terminó el descanso. Es momento de volver."
            : "Un momento para recargar ideas. Ya volvemos."}
        </p>
        <span className="pill">
          {state.running ? "DESCANSO EN CURSO" : "CRONÓMETRO EN PAUSA"}
        </span>
      </div>
    );
  if (state.kind === "question")
    return (
      <div className="question-stage">
        <span className="eyebrow">
          <MessageCircle size={14} /> MOMENTO DE PARTICIPAR
        </span>
        <h2>{state.question || "¿Qué ideas te llevás de esta parte?"}</h2>
        <div className="question-options">
          {state.options.map((option, i) =>
            option.trim() ? (
              <div
                key={i}
                className={
                  state.revealedAnswer === i ? "answer correct" : "answer"
                }
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {option}
                {state.revealedAnswer === i && <strong>Correcta</strong>}
              </div>
            ) : null,
          )}
        </div>
        {!state.options.some((option) => option.trim()) && (
          <p>Compartí tu respuesta con el grupo.</p>
        )}
      </div>
    );
  return document ? (
    <PdfCanvas
      document={document}
      page={Math.min(Math.max(1, state.page), document.numPages)}
    />
  ) : (
    <div className="document-empty">
      <span className="stage-symbol">
        <FileText size={36} />
      </span>
      <h2>Tu contenido, en el centro</h2>
      <p>
        Cargá un PDF para acompañar la sesión.
        <br />
        Intercalá preguntas y descansos sin salir de la presentación.
      </p>
      <span className="pill">PDF · DIAPOSITIVAS · CONVERSACIONES</span>
    </div>
  );
}
