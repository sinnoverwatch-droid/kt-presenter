import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  FolderOpen,
  Home,
  LayoutGrid,
  MonitorPlay,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  X,
} from "lucide-react";
import type { Presentation, Phase } from "./services/contracts";
const initial: Presentation[] = [
  {
    id: "demo",
    title: "Una idea que merece ser compartida",
    description:
      "Una presentación de ejemplo para descubrir tu espacio de trabajo.",
    updatedAt: new Date().toISOString(),
    phases: [
      {
        id: "1",
        title: "Apertura",
        duration: 5,
        notes:
          "Conectá con tu audiencia. Presentá el tema y contá por qué es importante.",
        completed: false,
      },
      {
        id: "2",
        title: "Desarrollo",
        duration: 15,
        notes:
          "Compartí las ideas principales, acompañalas con ejemplos y dejá espacio para preguntas.",
        completed: false,
      },
      {
        id: "3",
        title: "Cierre",
        duration: 5,
        notes:
          "Recapitulá los puntos clave e invitá a la audiencia a dar el próximo paso.",
        completed: false,
      },
    ],
  },
];
function load(): Presentation[] {
  try {
    const data = JSON.parse(localStorage.getItem("kt-presentations") || "null");
    if (
      Array.isArray(data) &&
      data.every(
        (p) =>
          typeof p.id === "string" &&
          typeof p.title === "string" &&
          typeof p.description === "string" &&
          typeof p.updatedAt === "string" &&
          Array.isArray(p.phases) &&
          p.phases.every(
            (f: Phase) =>
              typeof f.id === "string" &&
              typeof f.title === "string" &&
              typeof f.notes === "string" &&
              typeof f.duration === "number" &&
              typeof f.completed === "boolean",
          ),
      )
    )
      return data;
  } catch {
    /* Invalid local data falls back to the sample. */
  }
  return initial;
}
export default function App() {
  const dialog = useRef<HTMLElement>(null);
  const [items, setItems] = useState(load);
  const [view, setView] = useState<"home" | "library" | "detail">("home");
  const [selected, setSelected] = useState("demo");
  const [phaseId, setPhaseId] = useState("1");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [presenting, setPresenting] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem("kt-presentations", JSON.stringify(items));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [items]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPresenting(false);
        setModal(false);
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLInputElement>("input")?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const controls = dialog.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled), input",
      );
      if (!controls?.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [modal]);
  const current = items.find((p) => p.id === selected);
  const phase =
    current?.phases.find((p) => p.id === phaseId) || current?.phases[0];
  const open = (p: Presentation) => {
    setSelected(p.id);
    setPhaseId(p.phases[0]?.id || "");
    setView("detail");
  };
  const updatePhase = (changes: Partial<Phase>) =>
    setItems(
      items.map((p) =>
        p.id === selected
          ? {
              ...p,
              updatedAt: new Date().toISOString(),
              phases: p.phases.map((f) =>
                f.id === phase?.id ? { ...f, ...changes } : f,
              ),
            }
          : p,
      ),
    );
  const create = () => {
    if (!title.trim()) return;
    const p: Presentation = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: "Tu próxima gran presentación empieza acá.",
      updatedAt: new Date().toISOString(),
      phases: initial[0].phases.map((f) => ({ ...f, completed: false })),
    };
    setItems([...items, p]);
    setModal(false);
    setTitle("");
    open(p);
  };
  const total = (p: Presentation) =>
    p.phases.reduce((n, f) => n + f.duration, 0);
  const phaseIndex = current?.phases.findIndex((f) => f.id === phase?.id) ?? 0;
  const cards =
    view === "home"
      ? items
      : items.filter((p) =>
          p.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
        );
  return (
    <div className={presenting ? "app presenting" : "app"}>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setView("home");
          }}
        >
          <span className="brand-icon">
            <MonitorPlay size={24} />
          </span>
          <span>
            KT<span className="brand-light"> Presenter</span>
            <small>IDEAS EN MOVIMIENTO</small>
          </span>
        </a>
        <div className="workspace-label">ESPACIO DE TRABAJO</div>
        <nav>
          <button
            className={view === "home" ? "active" : ""}
            onClick={() => setView("home")}
          >
            <Home size={19} />
            Inicio
          </button>
          <button
            className={view !== "home" ? "active" : ""}
            onClick={() => setView("library")}
          >
            <LayoutGrid size={19} />
            Presentaciones<span className="count">{items.length}</span>
          </button>
        </nav>
        <div className="sidebar-tip">
          <span className="tiny-dot" /> Tu próxima gran idea
          <p>
            Organizá el contenido.
            <br />
            Conectá con tu audiencia.
          </p>
        </div>
        <div className="profile">
          <div className="avatar">KT</div>
          <div>
            Mi espacio<small>Almacenamiento local</small>
          </div>
          <span className="online" />
        </div>
      </aside>
      <div className="workspace">
        <header>
          <div className="breadcrumb">
            Mi espacio <ChevronRight size={14} />
            <span>{view === "home" ? "Inicio" : "Presentaciones"}</span>
            {view === "detail" && (
              <>
                <ChevronRight size={14} />
                <span className="truncate">{current?.title}</span>
              </>
            )}
          </div>
          <span className="local-badge">
            <span className="tiny-dot" /> Modo local
          </span>
        </header>
        <main>
          {storageError && (
            <p role="alert" className="notice">
              No se pudieron guardar los cambios en este navegador. Tu sesión
              sigue disponible hasta cerrar la página.
            </p>
          )}
          {view === "home" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    TU ESPACIO PARA COMPARTIR CONOCIMIENTO
                  </div>
                  <h1>
                    Las grandes ideas
                    <br />
                    empiezan con una presentación
                    <span className="accent">.</span>
                  </h1>
                  <p>Prepará cada momento. Presentá con confianza.</p>
                </div>
              </div>
              <section className="hero">
                <div>
                  <span className="pill">DE LA IDEA AL ESCENARIO</span>
                  <h2>
                    Dale forma a tu
                    <br />
                    próxima presentación.
                  </h2>
                  <p>
                    Un espacio para organizar tus ideas en fases
                    <br className="desktop-break" /> y enfocarte en lo que
                    querés transmitir.
                  </p>
                  <button className="primary" onClick={() => setModal(true)}>
                    <Plus size={18} />
                    Crear presentación
                  </button>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="orbit" />
                  <div className="art-card back" />
                  <div className="art-card front">
                    <div className="art-top">
                      <span />
                      <MoreHorizontal size={19} />
                    </div>
                    <div className="art-bars">
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="art-line" />
                    <div className="art-line short" />
                    <div className="art-bottom">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                  <div className="art-check">
                    <Check size={22} />
                  </div>
                  <span className="spark">✦</span>
                </div>
              </section>
              <div className="stats">
                <div>
                  <span className="stat-icon">
                    <FolderOpen size={20} />
                  </span>
                  <div>
                    <strong>{items.length}</strong>
                    <p>Presentaciones</p>
                  </div>
                </div>
                <div>
                  <span className="stat-icon violet">
                    <LayoutGrid size={20} />
                  </span>
                  <div>
                    <strong>
                      {items.reduce((n, p) => n + p.phases.length, 0)}
                    </strong>
                    <p>Fases organizadas</p>
                  </div>
                </div>
                <div>
                  <span className="stat-icon green">
                    <Check size={20} />
                  </span>
                  <div>
                    <strong>
                      {items.reduce(
                        (n, p) =>
                          n + p.phases.filter((f) => f.completed).length,
                        0,
                      )}
                    </strong>
                    <p>Fases completadas</p>
                  </div>
                </div>
              </div>
            </>
          )}
          {view !== "detail" ? (
            <section className="library">
              <div className="section-heading">
                <div>
                  <h2>
                    {view === "home"
                      ? "Presentaciones recientes"
                      : "Tus presentaciones"}
                  </h2>
                  <p>
                    {view === "home"
                      ? "Retomá tus ideas donde las dejaste."
                      : "Todo listo para tu próximo momento de compartir."}
                  </p>
                </div>
                {view === "home" ? (
                  <button
                    className="text-button"
                    onClick={() => setView("library")}
                  >
                    Ver todas <ArrowRight size={16} />
                  </button>
                ) : (
                  <button className="primary" onClick={() => setModal(true)}>
                    <Plus size={17} />
                    Nueva presentación
                  </button>
                )}
              </div>
              {view === "library" && (
                <label className="search">
                  <Search size={18} />
                  <input
                    placeholder="Buscar presentaciones…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              )}
              <div className="cards">
                {(view === "home" ? cards.slice(0, 3) : cards).map((p, i) => (
                  <button
                    className="presentation-card"
                    key={p.id}
                    onClick={() => open(p)}
                  >
                    <div className={"thumbnail tone-" + (i % 3)}>
                      <div className="thumb-pattern" />
                      <span className="thumb-label">KT / PRESENTACIÓN</span>
                      <MonitorPlay size={38} strokeWidth={1} />
                      <span className="thumb-footer">
                        COMPARTÍ LO QUE SABÉS <ArrowRight size={15} />
                      </span>
                    </div>
                    <div className="card-content">
                      <span className="status">
                        {p.phases.every((f) => f.completed)
                          ? "Completada"
                          : "En preparación"}
                      </span>
                      <h3>{p.title}</h3>
                      <p>{p.description}</p>
                      <div className="card-meta">
                        <span>
                          <LayoutGrid size={13} />
                          {p.phases.length} fases
                        </span>
                        <span>
                          <Clock3 size={13} />
                          {total(p)} min
                        </span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </button>
                ))}
                {view === "home" && (
                  <button className="new-card" onClick={() => setModal(true)}>
                    <span>
                      <Plus size={24} />
                    </span>
                    <strong>Una nueva idea</strong>
                    <p>
                      Convertí lo que sabés
                      <br />
                      en algo para compartir.
                    </p>
                  </button>
                )}
              </div>
              {!cards.length && (
                <div className="empty">
                  <FolderOpen size={32} />
                  <h3>
                    {search
                      ? "No encontramos presentaciones"
                      : "Tu espacio está listo"}
                  </h3>
                  <p>
                    {search
                      ? "Probá con otro nombre."
                      : "Creá tu primera presentación para empezar."}
                  </p>
                  <button className="primary" onClick={() => setModal(true)}>
                    Crear presentación
                  </button>
                </div>
              )}
            </section>
          ) : (
            current &&
            phase && (
              <>
                <button
                  className="text-button back-button"
                  onClick={() => setView("library")}
                >
                  <ArrowLeft size={16} />
                  Volver a presentaciones
                </button>
                <div className="section-heading detail-heading">
                  <div>
                    <div className="eyebrow">TU PRESENTACIÓN</div>
                    <h1>{current.title}</h1>
                    <p>
                      {current.phases.filter((f) => f.completed).length} de{" "}
                      {current.phases.length} fases completadas ·{" "}
                      {total(current)} minutos
                    </p>
                  </div>
                  <button
                    className="primary"
                    onClick={() => setPresenting(!presenting)}
                  >
                    <Play size={17} />
                    {presenting ? "Salir de presentación" : "Presentar"}
                  </button>
                </div>
                <div className="phase-layout">
                  <section className="phase-list">
                    <div className="section-heading">
                      <h2>Fases</h2>
                      <span className="count">{current.phases.length}</span>
                    </div>
                    {current.phases.map((f, i) => (
                      <button
                        className={phase.id === f.id ? "phase active" : "phase"}
                        onClick={() => setPhaseId(f.id)}
                        key={f.id}
                      >
                        <span
                          className={
                            f.completed ? "phase-number done" : "phase-number"
                          }
                        >
                          {f.completed ? (
                            <Check size={16} />
                          ) : (
                            String(i + 1).padStart(2, "0")
                          )}
                        </span>
                        <span>
                          <strong>{f.title}</strong>
                          <small>{f.duration} min</small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                    <button
                      className="text-button add-phase"
                      onClick={() => {
                        const id = crypto.randomUUID();
                        setItems(
                          items.map((p) =>
                            p.id === current.id
                              ? {
                                  ...p,
                                  updatedAt: new Date().toISOString(),
                                  phases: [
                                    ...p.phases,
                                    {
                                      id,
                                      title: "Nueva fase",
                                      duration: 5,
                                      notes: "",
                                      completed: false,
                                    },
                                  ],
                                }
                              : p,
                          ),
                        );
                        setPhaseId(id);
                      }}
                    >
                      <Plus size={17} />
                      Agregar fase
                    </button>
                  </section>
                  <section className="phase-editor">
                    <div className="editor-top">
                      <span className="eyebrow">
                        FASE {String(phaseIndex + 1).padStart(2, "0")}
                      </span>
                      <label className="duration">
                        <Clock3 size={15} />
                        <input
                          aria-label="Duración en minutos"
                          type="number"
                          min="1"
                          max="240"
                          value={phase.duration}
                          onChange={(e) =>
                            updatePhase({
                              duration: Math.max(
                                1,
                                Math.min(240, Number(e.target.value) || 1),
                              ),
                            })
                          }
                        />
                        min
                      </label>
                    </div>
                    <input
                      className="phase-title"
                      aria-label="Nombre de la fase"
                      value={phase.title}
                      onChange={(e) => updatePhase({ title: e.target.value })}
                    />
                    <label className="notes-label" htmlFor="notes">
                      NOTAS DEL PRESENTADOR
                    </label>
                    <textarea
                      id="notes"
                      placeholder="¿Qué querés compartir en esta fase?"
                      value={phase.notes}
                      onChange={(e) => updatePhase({ notes: e.target.value })}
                    />
                    <div className="future-pdf">
                      <FolderOpen size={20} />
                      <div>
                        <strong>Documentos PDF</strong>
                        <p>
                          La integración con PDF.js llegará en una próxima
                          etapa.
                        </p>
                      </div>
                      <span className="pill">PRÓXIMAMENTE</span>
                    </div>
                    <div className="editor-footer">
                      <button
                        className={
                          phase.completed ? "secondary completed" : "secondary"
                        }
                        onClick={() =>
                          updatePhase({ completed: !phase.completed })
                        }
                      >
                        <Check size={17} />
                        {phase.completed
                          ? "Completada"
                          : "Marcar como completada"}
                      </button>
                      <button
                        className="text-button"
                        disabled={phaseIndex === current.phases.length - 1}
                        onClick={() =>
                          setPhaseId(current.phases[phaseIndex + 1].id)
                        }
                      >
                        Siguiente fase <ArrowRight size={17} />
                      </button>
                    </div>
                  </section>
                </div>
              </>
            )
          )}
          <footer>
            KT Presenter{" "}
            <span>Hecho para que tus ideas lleguen más lejos.</span>
            <span>v0.1.0</span>
          </footer>
        </main>
      </div>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <section
            ref={dialog}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              aria-label="Cerrar"
              onClick={() => setModal(false)}
            >
              <X size={20} />
            </button>
            <span className="brand-icon">
              <MonitorPlay size={25} />
            </span>
            <h2 id="modal-title">Una nueva presentación</h2>
            <p>Poné un nombre a tu próxima gran idea.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                create();
              }}
            >
              <label htmlFor="new-title">Nombre de la presentación</label>
              <input
                id="new-title"
                maxLength={120}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Por ejemplo: Introducción a React"
              />
              <p className="form-hint">
                Empezá con tres fases. Después podés adaptarlas a tu ritmo.
              </p>
              <button
                className="primary"
                disabled={!title.trim()}
                type="submit"
              >
                Crear presentación <ArrowRight size={17} />
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
