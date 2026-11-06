// Future adapters: SQLite stays in Electron's main process behind validated IPC.
// PDF.js stays in the renderer with a bundled worker; do not expose Node to PDFs.
export interface Presentation {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
  phases: Phase[];
}
export interface Phase {
  id: string;
  title: string;
  duration: number;
  notes: string;
  completed: boolean;
  kind?: "content" | "question" | "break";
  page?: number;
  question?: string;
  options?: string[];
  correctAnswer?: number;
}
export interface PresentationRepository {
  list(): Promise<Presentation[]>;
  save(presentation: Presentation): Promise<void>;
  remove(id: string): Promise<void>;
}
export interface PdfRenderer {
  pageCount(file: File): Promise<number>;
  renderPage(
    file: File,
    page: number,
    canvas: HTMLCanvasElement,
  ): Promise<void>;
}
