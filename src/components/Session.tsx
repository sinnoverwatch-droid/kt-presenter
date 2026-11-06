import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  FileText,
  Maximize2,
  MessageCircle,
  MonitorPlay,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Upload,
} from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { Presentation, Phase } from "../services/contracts";
import {
  readDocument,
  saveDocument,
  type StoredDocument,
} from "../services/documents";
import { useSessionClock, formatTime } from "../hooks/useSessionClock";
import { openPdf } from "./PdfCanvas";
import { Stage, type PublicStage } from "./Stage";
interface Props {
  presentation: Presentation;
  onChange(p: Presentation): void;
  onBack(): void;
}
const kinds = {
  content: "Contenido",
  question: "Pregunta",
  break: "Descanso",
} as const;
export function Session({ presentation, onChange, onBack }: Props) {
  const [phaseId, setPhaseId] = useState(presentation.phases[0].id);
  const index = Math.max(
    0,
    presentation.phases.findIndex((p) => p.id === phaseId),
  );
  const phase = presentation.phases[index];
  const kind = phase.kind || "content";
  const clock = useSessionClock(phase.id);
  const [document, setDocument] = useState<PDFDocumentProxy>();
  const [stored, setStored] = useState<StoredDocument>();
  const [page, setPage] = useState(phase.page || 1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  const channel = useRef<BroadcastChannel | undefined>(undefined);
  const importGeneration = useRef(0);
  const state: PublicStage = {
    title: presentation.title,
    phaseTitle: phase.title,
    kind,
    phaseNumber: index + 1,
    phaseCount: presentation.phases.length,
    remaining: phase.duration * 60 - clock.phaseElapsed,
    elapsed: clock.elapsed,
    running: clock.running,
    page,
    question: phase.question || "",
    options: phase.options || [],
    revealedAnswer: revealed ? phase.correctAnswer : undefined,
  };
  const latest = useRef({ state, blob: stored?.blob });
  latest.current = { state, blob: stored?.blob };
  const update = (changes: Partial<Phase>) =>
    onChange({
      ...presentation,
      updatedAt: new Date().toISOString(),
      phases: presentation.phases.map((f) =>
        f.id === phase.id ? { ...f, ...changes } : f,
      ),
    });
  useEffect(() => {
    setPage(phase.page || 1);
    setRevealed(false);
    setStatus("");
  }, [phase.id, phase.page]);
  useEffect(() => {
    let cancelled = false;
    const generation = importGeneration.current;
    readDocument(presentation.id)
      .then(async (file) => {
        if (!file || cancelled || generation !== importGeneration.current)
          return;
        const pdf = await openPdf(file.blob);
        if (cancelled || generation !== importGeneration.current) {
          void pdf.loadingTask.destroy();
          return;
        }
        setDocument(pdf);
        setStored(file);
      })
      .catch(() => {
        if (!cancelled && generation === importGeneration.current)
          setError(
            "No se pudo recuperar el PDF guardado. Podés volver a cargarlo.",
          );
      });
    return () => {
      cancelled = true;
      importGeneration.current++;
    };
  }, [presentation.id]);
  useEffect(
    () => () => {
      void document?.loadingTask.destroy();
    },
    [document],
  );
  useEffect(() => {
    const handle = new BroadcastChannel(`kt-audience-${presentation.id}`);
    channel.current = handle;
    handle.onmessage = ({ data }) => {
      if (data.type === "ready") {
        handle.postMessage({ type: "state", state: latest.current.state });
        if (latest.current.blob)
          handle.postMessage({ type: "document", blob: latest.current.blob });
      }
    };
    const end = () => handle.postMessage({ type: "ended" });
    window.addEventListener("pagehide", end);
    return () => {
      window.removeEventListener("pagehide", end);
      handle.postMessage({ type: "ended" });
      handle.close();
      channel.current = undefined;
    };
  }, [presentation.id]);
  useEffect(() => {
    channel.current?.postMessage({ type: "state", state });
  }, [
    presentation,
    phase.id,
    page,
    clock.elapsed,
    clock.phaseElapsed,
    clock.running,
    revealed,
  ]);
  useEffect(() => {
    if (stored)
      channel.current?.postMessage({ type: "document", blob: stored.blob });
  }, [stored]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setImmersive(false);
      if (
        (event.target as HTMLElement)?.closest("input,textarea,select,button")
      )
        return;
      if (event.key === "ArrowRight" && document) {
        event.preventDefault();
        setPage((p) => Math.min(document.numPages, p + 1));
      }
      if (event.key === "ArrowLeft" && document) {
        event.preventDefault();
        setPage((p) => Math.max(1, p - 1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [document]);
  async function importPdf(file: File) {
    const generation = ++importGeneration.current;
    setError("");
    setStatus("");
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError(
        "Por ahora podés cargar PDF. Exportá tu PowerPoint a PDF para usarlo en esta versión.",
      );
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setError("El PDF debe pesar menos de 30 MB.");
      return;
    }
    setBusy(true);
    try {
      const pdf = await openPdf(file);
      if (generation !== importGeneration.current) {
        void pdf.loadingTask.destroy();
        return;
      }
      const next = { name: file.name, blob: file };
      setDocument(pdf);
      setStored(next);
      setPage(1);
      try {
        await saveDocument(presentation.id, next);
        if (generation === importGeneration.current)
          setStatus("PDF guardado en este dispositivo.");
      } catch {
        if (generation === importGeneration.current)
          setError(
            "PDF cargado, pero no se pudo guardar. Volvé a seleccionarlo al reabrir la sesión.",
          );
      }
    } catch {
      if (generation === importGeneration.current)
        setError(
          "No se pudo abrir el PDF. Verificá que sea válido y que no tenga contraseña.",
        );
    } finally {
      if (generation === importGeneration.current) setBusy(false);
    }
  }
  function addPhase(type: Phase["kind"]) {
    const next: Phase = {
      id: crypto.randomUUID(),
      title:
        type === "break"
          ? "Descanso"
          : type === "question"
            ? "Pregunta al grupo"
            : "Nueva fase",
      duration: type === "break" ? 10 : 5,
      notes: "",
      completed: false,
      kind: type,
      ...(type === "question"
        ? {
            question: "¿Cuál es la mejor forma de compartir este conocimiento?",
            options: [
              "Explicar el contexto y dejar documentación",
              "Depender de la memoria del equipo",
              "Enviar solo el resultado",
            ],
            correctAnswer: 0,
          }
        : {}),
    };
    onChange({
      ...presentation,
      updatedAt: new Date().toISOString(),
      phases: [
        ...presentation.phases.slice(0, index + 1),
        next,
        ...presentation.phases.slice(index + 1),
      ],
    });
    setPhaseId(next.id);
  }
  function movePhase(direction: number) {
    const target = index + direction;
    if (target < 0 || target >= presentation.phases.length) return;
    const phases = [...presentation.phases];
    [phases[index], phases[target]] = [phases[target], phases[index]];
    onChange({ ...presentation, updatedAt: new Date().toISOString(), phases });
  }
  useEffect(() => {
    if (document)
      setPage((value) => Math.max(1, Math.min(value, document.numPages)));
  }, [document, page]);
  async function audience() {
    setStatus("");
    try {
      if (window.ktDesktop?.openAudience)
        await window.ktDesktop.openAudience(presentation.id);
      else {
        const url = new URL(window.location.href);
        url.hash = `audience=${encodeURIComponent(presentation.id)}`;
        const tab = window.open(url.toString(), "kt-audience");
        if (!tab) throw new Error("popup");
      }
      setStatus(
        "Audiencia abierta en otra ventana. En PC podés moverla al proyector. En tablet puede abrirse como pestaña.",
      );
    } catch {
      setError(
        "No se pudo abrir la audiencia. Permití las ventanas emergentes para este sitio.",
      );
    }
  }
  return (
    <section className={immersive ? "session immersive" : "session"}>
      <div className="session-heading">
        <div>
          <button className="text-button" onClick={onBack}>
            <ArrowLeft size={15} />
            Volver a presentaciones
          </button>
          <h1>{presentation.title}</h1>
          <p>Tu centro de control para compartir conocimiento.</p>
        </div>
        <div className="session-heading-actions">
          <button className="secondary" onClick={audience}>
            <MonitorPlay size={16} />
            Abrir audiencia
          </button>
          <button className="primary" onClick={() => setImmersive(!immersive)}>
            <Maximize2 size={15} />
            {immersive ? "Salir de presentación" : "Presentar"}
          </button>
        </div>
      </div>
      <div className="session-strip">
        <span className="live-label">
          <span className={clock.running ? "live-dot on" : "live-dot"} />
          {clock.running
            ? "SESIÓN EN CURSO"
            : clock.elapsed > 0
              ? "SESIÓN EN PAUSA"
              : "LISTO PARA COMENZAR"}
        </span>
        <span>
          Fase {index + 1} de {presentation.phases.length}
        </span>
        <div className="session-total">
          <Clock3 size={15} />
          Tiempo total{" "}
          <strong data-testid="total-time">{formatTime(clock.elapsed)}</strong>
        </div>
        <button
          className="icon-button"
          aria-label="Reiniciar sesión"
          title="Reinicia todos los cronómetros"
          onClick={clock.resetAll}
        >
          <RotateCcw size={15} />
        </button>
      </div>
      <div className="phase-timeline" aria-label="Secuencia de la sesión">
        {presentation.phases.map((f, i) => (
          <button
            key={f.id}
            className={
              f.id === phase.id ? "timeline-item selected" : "timeline-item"
            }
            onClick={() => setPhaseId(f.id)}
          >
            <span>
              {f.completed ? (
                <Check size={13} />
              ) : f.kind === "break" ? (
                <Coffee size={13} />
              ) : f.kind === "question" ? (
                <MessageCircle size={13} />
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
            <strong>{f.title}</strong>
            <small>{f.duration} min</small>
          </button>
        ))}
      </div>
      <div className="session-grid">
        <div className="session-main">
          <div className="stage-toolbar">
            <div>
              <span className="eyebrow">{kinds[kind].toUpperCase()}</span>
              <strong>{phase.title}</strong>
            </div>
            <span
              className={
                state.remaining < 0 ? "stage-time overtime" : "stage-time"
              }
              data-testid="phase-time"
            >
              {formatTime(state.remaining)}
            </span>
          </div>
          <div className="stage-screen">
            <Stage state={state} document={document} />
          </div>
          <div className="document-controls">
            <button
              className="secondary"
              onClick={() => upload.current?.click()}
              disabled={busy}
            >
              <Upload size={15} />
              {busy ? "Abriendo PDF…" : document ? "Cambiar PDF" : "Cargar PDF"}
            </button>
            <input
              ref={upload}
              className="visually-hidden"
              type="file"
              accept=".pdf,application/pdf"
              aria-label="Seleccionar PDF"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importPdf(file);
                e.target.value = "";
              }}
            />
            <span className="document-name" title={stored?.name}>
              {stored?.name || "PDF hasta 30 MB · PPTX: exportar a PDF"}
            </span>
            {document && (
              <div className="page-navigation">
                <button
                  className="icon-button"
                  aria-label="Página anterior"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={18} />
                </button>
                <span data-testid="page-count">
                  {page} / {document.numPages}
                </span>
                <button
                  className="icon-button"
                  aria-label="Página siguiente"
                  disabled={page >= document.numPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
          {error && (
            <p className="notice" role="alert">
              {error}
            </p>
          )}
          {status && (
            <p className="session-status" role="status">
              {status}
            </p>
          )}
          <div className="transport">
            <button
              className="secondary"
              disabled={index === 0}
              onClick={() => setPhaseId(presentation.phases[index - 1].id)}
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
            <button className="primary clock-toggle" onClick={clock.toggle}>
              {clock.running ? <Pause size={18} /> : <Play size={18} />}{" "}
              {clock.running ? "Pausar" : "Iniciar"} cronómetro
            </button>
            <button
              className="secondary"
              disabled={index === presentation.phases.length - 1}
              onClick={() => setPhaseId(presentation.phases[index + 1].id)}
            >
              Siguiente fase
              <ChevronRight size={16} />
            </button>
          </div>
          <p className="session-hint">
            El cronómetro continúa al cambiar de fase. Al volver al panel o
            recargar, la sesión se detiene y los tiempos se reinician.
          </p>
        </div>
        <aside className="conductor-panel">
          <div className="conductor-title">
            <span className="eyebrow">SOLO PARA VOS</span>
            <span className="pill">PRESENTADOR</span>
          </div>
          <label>
            Nombre de la fase
            <input
              aria-label="Nombre de la fase"
              value={phase.title}
              maxLength={120}
              onChange={(e) => update({ title: e.target.value })}
            />
          </label>
          <div className="phase-settings">
            <label>
              Tipo
              <select
                aria-label="Tipo de fase"
                value={kind}
                onChange={(e) => {
                  update({ kind: e.target.value as Phase["kind"] });
                  setRevealed(false);
                }}
              >
                <option value="content">Contenido</option>
                <option value="question">Pregunta</option>
                <option value="break">Descanso</option>
              </select>
            </label>
            <label>
              Minutos
              <input
                aria-label="Duración en minutos"
                type="number"
                min="1"
                max="240"
                value={phase.duration}
                onChange={(e) =>
                  update({
                    duration: Math.min(
                      240,
                      Math.max(1, Number(e.target.value) || 1),
                    ),
                  })
                }
              />
            </label>
          </div>
          <div className="timer-tools phase-order">
            <button
              className="text-button"
              disabled={index === 0}
              onClick={() => movePhase(-1)}
            >
              <ArrowLeft size={13} />
              Mover antes
            </button>
            <button
              className="text-button"
              disabled={index === presentation.phases.length - 1}
              onClick={() => movePhase(1)}
            >
              Mover después
              <ArrowRight size={13} />
            </button>
          </div>
          {kind === "content" && document && (
            <button
              className="text-button"
              onClick={() => {
                update({ page });
                setStatus(`Página ${page} vinculada a esta fase.`);
              }}
            >
              <FileText size={14} />
              Comenzar esta fase en página {page}
            </button>
          )}
          {kind === "question" && (
            <div className="question-editor">
              <label>
                Pregunta
                <textarea
                  aria-label="Pregunta al grupo"
                  value={phase.question || ""}
                  onChange={(e) => {
                    update({ question: e.target.value });
                    setRevealed(false);
                  }}
                  placeholder="¿Qué harías en esta situación?"
                />
              </label>
              <label>
                Opciones (una por línea)
                <textarea
                  aria-label="Opciones de respuesta"
                  value={(phase.options || []).join("\n")}
                  onChange={(e) => {
                    update({
                      options: e.target.value.split("\n").slice(0, 6),
                      correctAnswer: undefined,
                    });
                    setRevealed(false);
                  }}
                  placeholder={"Primera opción\nSegunda opción"}
                />
              </label>
              <label>
                Respuesta correcta
                <select
                  aria-label="Respuesta correcta"
                  value={phase.correctAnswer ?? ""}
                  onChange={(e) => {
                    update({
                      correctAnswer:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    });
                    setRevealed(false);
                  }}
                >
                  <option value="">Pregunta abierta / sin respuesta</option>
                  {(phase.options || []).map((_, i) => (
                    <option value={i} key={i}>
                      Opción {String.fromCharCode(65 + i)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="secondary"
                disabled={
                  phase.correctAnswer === undefined ||
                  !phase.options?.[phase.correctAnswer]?.trim()
                }
                onClick={() => setRevealed(!revealed)}
              >
                {revealed ? "Ocultar respuesta" : "Revelar respuesta"}
              </button>
              <p className="session-hint">
                La audiencia participa de forma oral. Las respuestas por QR
                vendrán en otra etapa.
              </p>
            </div>
          )}
          <label htmlFor="session-notes" className="private-notes-label">
            NOTAS DEL PRESENTADOR
          </label>
          <textarea
            id="session-notes"
            value={phase.notes}
            placeholder="Recordatorios, ejemplos y preguntas de apoyo. Solo vos los ves."
            onChange={(e) => update({ notes: e.target.value })}
          />
          <div className="timer-tools">
            <button
              className="text-button"
              onClick={() =>
                update({ duration: Math.min(240, phase.duration + 1) })
              }
            >
              <Plus size={14} />1 minuto
            </button>
            <button className="text-button" onClick={clock.resetPhase}>
              <RotateCcw size={13} />
              Reiniciar fase
            </button>
          </div>
          <button
            className="secondary mark-complete"
            onClick={() => update({ completed: !phase.completed })}
          >
            <Check size={15} />
            {phase.completed ? "Completada" : "Marcar como completada"}
          </button>
          <div className="add-segment">
            <span className="eyebrow">AMPLIAR LA SESIÓN</span>
            <button onClick={() => addPhase("content")}>
              <Plus size={15} />
              Agregar fase
            </button>
            <button onClick={() => addPhase("question")}>
              <MessageCircle size={15} />
              Agregar pregunta
            </button>
            <button onClick={() => addPhase("break")}>
              <Coffee size={15} />
              Agregar descanso
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
