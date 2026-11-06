# Probar KT Presenter desde una tablet

La interfaz funciona como una web estática y puede publicarse en GitHub Pages. No necesita Electron, SQLite, credenciales de aplicación ni un servidor propio para esta primera etapa.

## Publicación por GitHub Actions

El workflow `.github/workflows/pages.yml` instala con el lockfile, omite la descarga del ejecutable de Electron, comprueba TypeScript, compila con Vite y despliega únicamente `dist/` mediante el mecanismo oficial de GitHub Pages. Se ejecuta al enviar cambios a `main` o manualmente desde Actions.

Vite utiliza `base: "./"`: los recursos se resuelven relativamente y sirven tanto bajo `/kt-presenter/` en Pages como en Electron. Las pantallas usan estado de React; no requieren rutas de servidor ni una página 404 especial.

### Configuración manual de GitHub

1. Abrir el repositorio `sinnoverwatch-droid/kt-presenter` en GitHub.
2. En **Settings → Pages → Build and deployment → Source**, seleccionar **GitHub Actions**. Se requiere permiso de administración. Si GitHub no ofrece Pages para este repositorio, revisar visibilidad y plan; un repositorio privado puede requerir un plan compatible.
3. Comprobar que GitHub Actions esté habilitado en **Settings → Actions → General** y que la política permita las acciones oficiales utilizadas por el workflow.
4. Una vez que estos archivos estén en `main`, abrir **Actions → Deploy web to GitHub Pages**. Si el despliegue previo falló porque Pages no estaba habilitado, volver a ejecutarlo con **Re-run all jobs** o **Run workflow**.
5. Esperar a que los trabajos `build` y `deploy` estén verdes. El environment `github-pages` mostrará la URL definitiva. Si hay reglas de aprobación para ese environment, un administrador deberá aprobar el despliegue.

Con el nombre actual y sin dominio personalizado, la URL esperada es:

**https://sinnoverwatch-droid.github.io/kt-presenter/**

La URL solo estará disponible después de un despliegue exitoso. No debe confundirse un workflow guardado o un push exitoso con una publicación completada.

## Comprobación desde la tablet

Abrir el enlace HTTPS en Safari o Chrome, sin necesidad de estar en la misma red que una PC. Probar Inicio, crear una presentación, editar sus fases y notas, marcar avances, volver al panel y buscarla. Recargar para comprobar el guardado.

Los datos se guardan en el navegador de cada dispositivo y origen. No hay sincronización con la PC, con otros navegadores ni con la aplicación Electron. Borrar los datos del sitio elimina esas presentaciones locales. La web aún no es una aplicación offline ni ofrece importación de documentos, ventanas de audiencia o participación por QR.

## Comprobación local del sitio compilado

```sh
npm ci
npm run build
npm run preview -- --port 5174
```

En otra terminal, con Chromium disponible:

```sh
KT_TEST_URL=http://127.0.0.1:5174 npm test
```

En PowerShell, definir primero `$env:KT_TEST_URL = "http://127.0.0.1:5174"` y ejecutar `npm test`. Consultar README.md para seleccionar el ejecutable de Chrome.
