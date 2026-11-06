import type { PageEnrichment } from "../services/contracts";
export function EnrichmentEditor({
  value,
  onChange,
  revealed,
  onReveal,
}: {
  value: PageEnrichment;
  onChange(changes: Partial<PageEnrichment>): void;
  revealed: boolean;
  onReveal(): void;
}) {
  return (
    <section className="enrichment-editor">
      <div className="conductor-title">
        <span className="eyebrow">ACTIVIDAD · PÁGINA {value.page}</span>
        <span className="pill">DENTRO DE LA APP</span>
      </div>
      <p className="session-hint">
        El PDF original no cambia. Este contenido se guarda con tu presentación
        y se muestra también a la audiencia.
      </p>
      <label>
        Título de la situación
        <input
          aria-label="Título de la interacción"
          value={value.title}
          maxLength={100}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </label>
      <label>
        Situación o contexto público
        <textarea
          aria-label="Contexto de la interacción"
          value={value.context}
          maxLength={1800}
          onChange={(e) => onChange({ context: e.target.value })}
        />
      </label>
      <label>
        Pregunta para esta página
        <textarea
          aria-label="Pregunta de la interacción"
          value={value.question}
          maxLength={400}
          onChange={(e) => onChange({ question: e.target.value })}
        />
      </label>
      <label>
        Opciones (una por línea)
        <textarea
          aria-label="Opciones de la interacción"
          value={value.options.join("\n")}
          onChange={(e) =>
            onChange({
              options: e.target.value.split("\n").slice(0, 6),
              correctAnswer: undefined,
            })
          }
        />
      </label>
      <label>
        Respuesta correcta
        <select
          aria-label="Respuesta correcta de la interacción"
          value={value.correctAnswer ?? ""}
          onChange={(e) =>
            onChange({
              correctAnswer:
                e.target.value === "" ? undefined : Number(e.target.value),
            })
          }
        >
          <option value="">Pregunta abierta</option>
          {value.options.map(
            (option, i) =>
              option.trim() && (
                <option key={i} value={i}>
                  Opción {String.fromCharCode(65 + i)}
                </option>
              ),
          )}
        </select>
      </label>
      <div className="enrichment-actions">
        <button
          className="secondary"
          onClick={() => onChange({ visible: !value.visible })}
        >
          {value.visible ? "Ocultar actividad" : "Mostrar actividad"}
        </button>
        <button
          className="primary"
          disabled={
            value.correctAnswer === undefined ||
            !value.options[value.correctAnswer]?.trim()
          }
          onClick={onReveal}
        >
          {revealed ? "Ocultar solución" : "Revelar solución"}
        </button>
      </div>
    </section>
  );
}
