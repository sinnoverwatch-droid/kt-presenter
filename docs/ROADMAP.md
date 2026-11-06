# KT Presenter: alcance y evolución

## Producto

Aplicación de escritorio para Windows destinada a presentaciones, clases, capacitaciones y sesiones de Knowledge Transfer (KT). Interfaz en React y TypeScript, desarrollo con Vite y contenedor de escritorio Electron. SQLite será el almacenamiento local definitivo y PDF.js el visor de PDF ya incorporado.

## Primera etapa: base inicial

Implementada en el checkout actual:

- Pantalla de inicio con acceso a creación, resumen y presentaciones recientes.
- Panel con búsqueda y creación de presentaciones.
- Vista de presentación organizada en fases: nombre, duración prevista, notas, estado y navegación.
- Tema oscuro y diseño adaptable a distintas resoluciones.
- Guardado provisional local para reutilizar presentaciones.

## Segunda etapa: espacio de conducción (v0.2)

- Visor PDF con PDF.js, navegación, página inicial por fase y guardado del archivo en IndexedDB.
- Secuencia de contenido, preguntas y descansos, insertables y reordenables.
- Cronómetro general y por fase: inicio, pausa, reanudación, reinicio y extensión de duración.
- Cuenta regresiva de descanso y visualización del tiempo excedido.
- Preguntas abiertas o con opciones y revelado de respuesta correcta. La participación es oral.
- Audiencia en otra ventana del mismo dispositivo, sincronizada sin enviar notas privadas. El preload de Electron solicita esa ventana mediante un canal IPC específico y validado.

Las pruebas web verifican los flujos anteriores y la privacidad del contenido enviado a la audiencia. La configuración y los documentos se conservan; los tiempos transcurridos se reinician al cerrar la sesión o recargar.

La interfaz y el flujo de guardado se verificaron con Chromium en Linux. La validación de la ventana Electron y las pruebas en Windows están pendientes. No se ha generado un instalador de Windows.

## Tercera etapa: interacciones por página (v0.3)

La app agrega contexto, preguntas y opciones junto a la página del PDF. Las actividades se guardan en la presentación y se vinculan a la huella del documento, sin modificar el original. Selección de opciones, revelado, ocultación y audiencia sincronizada están implementados. La extracción de texto es una ayuda de edición, no generación semántica con IA.

## Iteraciones previstas

1. **Almacenamiento SQLite.** Implementar `PresentationRepository` en el proceso principal de Electron, migraciones y operaciones IPC validadas. Usar `app.getPath('userData')` para la base. Migrar los datos provisionales antes de retirar localStorage y comprobar que sobrevivan al reinicio.
2. **Documentos y diapositivas.** PDF ya implementado en web y renderer, con navegación y asociación a fases. Pendiente mover la persistencia de escritorio a almacenamiento administrado, ampliar documentos admitidos y validar fidelidad con documentos complejos en Windows.
3. **PowerPoint.** Definir el mecanismo de conversión de PPTX a un formato renderizable y sus requisitos en Windows. PDF.js no abre PPTX. Evaluar fidelidad, funcionamiento sin conexión y disponibilidad de un conversor antes de elegir una dependencia.
4. **Sesiones y cronómetros.** Controles básicos implementados. Pendientes historial de sesiones, recuperación de una sesión interrumpida y avisos configurables.
5. **Presentador y audiencia.** Ventanas separadas y sincronización implementadas. Pendientes selector de monitor automático y validación de las ventanas en Electron/Windows. Las notas se mantienen en el presentador.
6. **Cuestionarios y actividades.** Preguntas y revelado básico implementados. Pendientes envío de respuestas de participantes, resultados y otras dinámicas.
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
