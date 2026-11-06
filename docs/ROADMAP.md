# KT Presenter: alcance y evolución

## Producto

Aplicación de escritorio para Windows destinada a presentaciones, clases, capacitaciones y sesiones de Knowledge Transfer (KT). Interfaz en React y TypeScript, desarrollo con Vite y contenedor de escritorio Electron. SQLite será el almacenamiento local definitivo y PDF.js el visor de PDF.

## Primera etapa: base inicial

Implementada en el checkout actual:

- Pantalla de inicio con acceso a creación, resumen y presentaciones recientes.
- Panel con búsqueda y creación de presentaciones.
- Vista de presentación organizada en fases: nombre, duración prevista, notas, estado y navegación.
- Tema oscuro y diseño adaptable a distintas resoluciones.
- Guardado provisional local para reutilizar presentaciones.

La duración de una fase es una planificación en minutos; todavía no es un cronómetro. El botón Presentar amplía las notas en la misma ventana; todavía no implementa ventanas separadas para presentador y audiencia. El ejemplo inicial permite explorar la interfaz sin archivos importados.

La interfaz y el flujo de guardado se verificaron con Chromium en Linux. La validación de la ventana Electron y las pruebas en Windows están pendientes. No se ha generado un instalador de Windows.

## Iteraciones previstas

1. **Almacenamiento SQLite.** Implementar `PresentationRepository` en el proceso principal de Electron, migraciones y operaciones IPC validadas. Usar `app.getPath('userData')` para la base. Migrar los datos provisionales antes de retirar localStorage y comprobar que sobrevivan al reinicio.
2. **Documentos y diapositivas.** Importar PDF con selector nativo, copiarlo al almacenamiento administrado y renderizarlo con PDF.js y su worker. Incorporar navegación entre páginas y asociación a fases. Validar archivos dañados y documentos grandes.
3. **PowerPoint.** Definir el mecanismo de conversión de PPTX a un formato renderizable y sus requisitos en Windows. PDF.js no abre PPTX. Evaluar fidelidad, funcionamiento sin conexión y disponibilidad de un conversor antes de elegir una dependencia.
4. **Sesiones y cronómetros.** Incorporar inicio, pausa, reanudación y reinicio de cronómetros generales y por fase, con estado de sesión separado de la plantilla reutilizable.
5. **Presentador y audiencia.** Crear ventanas independientes, selección de pantalla y sincronización de diapositivas. Las notas y controles deben quedar únicamente en la ventana del presentador.
6. **Cuestionarios y actividades.** Definir preguntas, respuestas, ejecución y resultados asociados a la sesión.
7. **Participación mediante QR.** Resolver conectividad entre dispositivos, URL accesible, códigos de sesión y ciclo de vida de la participación. El QR será un acceso a la sesión; por sí solo no ofrece conectividad ni sincronización.
8. **Distribución para Windows.** Configurar empaquetado, instalador, iconos y metadatos. Validar en Windows el guardado, la apertura de archivos, las ventanas y cualquier driver nativo de SQLite. Decidir firma y actualizaciones antes de distribuir.

El orden es una propuesta incremental. Cada iteración debe cerrar un flujo utilizable y sus comprobaciones antes de ampliar el alcance.

## Separación de responsabilidades

- `src/`: interfaz, navegación, presentación de documentos y contratos de servicios.
- `src/services/contracts.ts`: puntos de integración para persistencia y PDF.
- `electron/main.cjs`: ciclo de vida de ventanas y futuras operaciones locales privilegiadas.
- `electron/preload.cjs`: puente mínimo para exponer únicamente operaciones explícitas.
- `tests/`: comprobaciones funcionales de la interfaz.

Mantener Node deshabilitado en el renderer, aislamiento de contexto y sandbox. No exponer acceso genérico al sistema de archivos ni a SQL mediante el preload. Importar documentos no debe permitir ejecutar su contenido.
