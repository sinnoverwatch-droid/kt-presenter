# KT Presenter

Aplicación de escritorio orientada a Windows para presentaciones, clases, capacitaciones y sesiones de Knowledge Transfer (KT), organizadas en fases. Base inicial con React 19, TypeScript, Vite y Electron, en español, con tema oscuro y diseño adaptable.

El alcance de esta primera entrega y las próximas funciones están documentados en [el plan incremental](docs/ROADMAP.md).

## Versión web para tablet

El proyecto puede publicarse en GitHub Pages con el workflow de GitHub Actions incluido. Consultar [publicación y pruebas desde una tablet](docs/WEB-PREVIEW.md) para habilitar Pages y obtener el enlace HTTPS. El guardado sigue siendo local a cada navegador.

## Desarrollo

Requiere Node.js 22.12 o superior y npm. Usá el checkout existente; cada tarea de nube ya está aislada y no necesita otro worktree.

```sh
npm ci
npm run dev             # interfaz web, puerto 5173
npm run dev:desktop     # Vite + Electron, requiere una sesión gráfica
npm run build           # verificación de tipos y compilación de la interfaz
npm start               # Electron con dist/ ya compilado
```

En Windows, ejecutar estos comandos desde PowerShell o una terminal en la carpeta del proyecto. `npm run dev:desktop` abre Electron; `npm run dev` abre únicamente el servidor de la interfaz web. La distribución como instalador queda para una próxima etapa.

Electron usa un preload mínimo, aislamiento de contexto, sandbox y Node deshabilitado en el renderer. Las ventanas externas y la navegación se bloquean. No hay empaquetado/distribución de instaladores todavía.

## Funciones iniciales

- Inicio con resumen y presentaciones recientes.
- Panel con búsqueda y creación de presentaciones.
- Vista de fases con nombre, duración, notas, estado y nuevas fases.
- Modo de presentación con notas ampliadas; Escape vuelve a la edición. Aún no hay una ventana independiente para audiencia ni cronómetros activos.
- Persistencia local en `localStorage`, con una presentación de ejemplo en el primer inicio. Los datos de navegador y Electron son independientes. Sin sincronización ni backend.

## Validación

Con Vite o `npm run preview -- --port 5173` ejecutándose:

```sh
npm test
```

Para ejecutar las pruebas en PowerShell con Chrome instalado, por ejemplo: `$env:KT_CHROMIUM_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"`.

La prueba usa Playwright con Chromium del sistema (`/usr/bin/chromium`). Para otra instalación, definir `KT_CHROMIUM_PATH`. `KT_TEST_URL` permite cambiar la URL. Cubre creación, edición, avance, persistencia al recargar, búsqueda y diseño móvil. En Linux, Electron necesita una sesión gráfica o Xvfb y las bibliotecas del sistema correspondientes.

## Próximas integraciones

`src/services/contracts.ts` define los contratos `PresentationRepository` y `PdfRenderer`. Son puntos de extensión, no integraciones ya implementadas:

- **SQLite:** implementar el repositorio en el proceso principal de Electron; almacenar la base en `app.getPath('userData')`, incorporar migraciones y validar cada operación IPC. Seleccionar el driver y reconstruirlo para la ABI de Electron si es nativo.
- **PDF.js:** instalar `pdfjs-dist`, empaquetar su worker con Vite y renderizar archivos locales en canvas. Agregar navegación de páginas y asociación del documento a una fase.

No se necesitan credenciales ni servicios externos para este flujo inicial.
