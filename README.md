# KT Presenter

Aplicación de escritorio orientada a Windows para conducir presentaciones, clases, capacitaciones y sesiones de Knowledge Transfer. React 19, TypeScript, Vite y Electron, con tema oscuro e interfaz adaptable. La versión web permite probarla desde una tablet.

## Conducir una KT

1. Crear una presentación o abrir una existente.
2. Pulsar **Cargar PDF** y seleccionar un documento de hasta 30 MB, válido y sin contraseña. PDF.js renderiza sus páginas localmente. Para PowerPoint, exportar primero a PDF; la importación directa de PPTX sigue pendiente.
3. Navegar con los botones de página o las flechas del teclado cuando no se está editando. En cada fase de contenido, usar **Comenzar esta fase en página…** para vincular su página inicial.
4. Intercalar fases de contenido, preguntas y descansos. Se insertan después de la fase actual; **Mover antes / Mover después** cambia el orden. Editar duración, título y notas privadas.
5. Usar **Iniciar / Pausar cronómetro** para controlar la sesión. El tiempo total acumula todas las fases, incluidos los descansos. Cada fase conserva su tiempo consumido al navegar. Un tiempo excedido se muestra con `+`. Se puede sumar un minuto, reiniciar una fase o reiniciar todos los cronómetros.
6. Agregar una pregunta, escribir hasta seis opciones y elegir la respuesta correcta. **Revelar respuesta** la muestra al grupo. También se admiten preguntas abiertas sin opciones. La participación es oral; todavía no se recopilan respuestas desde otros dispositivos.
7. Pulsar **Abrir audiencia** para mostrar solo el contenido y los tiempos en otra ventana. En PC, moverla al proyector o segundo monitor y activar pantalla completa desde esa ventana. En tablet puede abrirse como pestaña; permitir ventanas emergentes si el navegador las bloquea.
8. **Presentar** amplía el espacio de conducción; Escape vuelve a su tamaño habitual. Las notas siguen siendo privadas y no se envían a la ventana de audiencia.

La configuración se guarda en `localStorage` y el PDF en IndexedDB, asociados a la presentación. Los tiempos transcurridos pertenecen a la sesión en curso: se reinician al volver al panel o recargar. Cada navegador y la aplicación Electron tienen almacenamiento independiente. No hay sincronización entre dispositivos. Borrar los datos del sitio elimina los datos locales.

La ventana de audiencia se sincroniza mediante BroadcastChannel en el mismo dispositivo y perfil del navegador. No es un enlace para que otras personas se conecten ni una implementación de participación por QR. Si la tablet suspende la pestaña del presentador, la audiencia puede dejar de recibir actualizaciones hasta reactivarla.

## Versión web para tablet

[Publicación con GitHub Pages y pruebas desde una tablet](docs/WEB-PREVIEW.md). El workflow publica únicamente la interfaz y los recursos de PDF.js; no incluye Electron ni envía tus documentos a un servidor.

## Desarrollo

Requiere Node.js 22.13 o superior y npm. Usar el checkout existente: cada tarea de nube ya está aislada y no necesita otro worktree.

```sh
npm ci
npm run dev             # interfaz web, puerto 5173
npm run dev:desktop     # Vite + Electron, requiere sesión gráfica
npm run build           # copia recursos de PDF.js, verifica tipos y compila
npm start               # Electron con dist/ compilado
```

En Windows se ejecutan desde PowerShell o una terminal en la carpeta del proyecto. `npm run dev` inicia solo el servidor web; `npm run dev:desktop` abre Electron. Los scripts `predev`, `predev:desktop` y `prebuild` copian fuentes, CMaps y decodificadores de la dependencia local a `public/pdfjs/`; estos archivos generados no se versionan. El worker se empaqueta con Vite. No se usan CDNs para renderizar documentos.

Electron mantiene Node deshabilitado en el renderer, sandbox y aislamiento de contexto. El preload expone únicamente la plataforma y una solicitud validada para abrir la ventana de audiencia. La ventana de audiencia no tiene controles de edición ni recibe notas privadas.

La interfaz está verificada con Chromium en Linux. Las ventanas de Electron y el funcionamiento en Windows siguen pendientes de validación en una sesión gráfica. No se ha generado un instalador.

## Validación

Con Vite o el sitio compilado ejecutándose:

```sh
npm test
```

Usa Playwright con Chromium en `/usr/bin/chromium`. `KT_CHROMIUM_PATH` permite seleccionar otro ejecutable y `KT_TEST_URL` otra URL. En PowerShell, por ejemplo:

```powershell
$env:KT_CHROMIUM_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$env:KT_TEST_URL = "http://127.0.0.1:5173"
npm test
```

Las pruebas cubren creación y guardado de presentaciones, edición de fases, PDF inválido y válido con render real, navegación y persistencia del documento, cronómetros con pausa y tiempo excedido, preguntas y revelado, audiencia sin notas privadas y ausencia de desbordamiento a 1024, 768 y 390 píxeles. `tests/fixtures/kt-demo.pdf` es un documento de prueba propio con dos páginas.

## Próximas etapas

Consultar [el plan incremental](docs/ROADMAP.md). SQLite será el almacenamiento definitivo de escritorio; siguen pendientes PPTX directo, recopilación de respuestas, QR y distribución para Windows. No se necesitan credenciales ni servicios externos para el flujo local actual.
