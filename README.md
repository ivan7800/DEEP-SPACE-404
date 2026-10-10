# DEEP SPACE 404 — AURORA v0.8.6 QA-RC

Simulador de exploración espacial local-first en HTML, CSS y JavaScript nativo. 24 sistemas conectados, cinco tripulantes, expediciones planetarias, tres arcos narrativos, ingeniería de nave, mejoras, investigación, temas, audio opcional y guardado local.

## Iniciar (Windows)
1. Extrae la carpeta `DEEP-SPACE-404` del ZIP.
2. Entra en ella y ejecuta `py -m http.server 8000` (o `python -m http.server 8000`).
3. Abre `http://localhost:8000/` desde Chrome, Edge o Firefox.
4. No abras `index.html` directamente con `file://`: los módulos ES y PWA necesitan servidor HTTP.

## Cómo jugar
Selecciona una estrella conectada, salta, escanea, extrae recursos y despliega un equipo a los enclaves. Cuida combustible, oxígeno, comida, repuestos, estado del casco, tripulación y moral. Reparte 100 unidades de energía en ingeniería. Reúne ocho mundos y 95 datos para transmitir el atlas.

## Persistencia y privacidad
Partida y preferencias en `localStorage` del navegador, sin servidores ni telemetría. Usa EXPORTAR periódicamente: limpiar los datos del navegador borra la partida. IMPORTAR valida estructura y requiere confirmación; exporta antes una copia porque la importación reemplaza el progreso actual. Las versiones antiguas (esquemas 1–4) se migran al esquema 5 si tienen datos válidos.

## PWA
`manifest.webmanifest`, icono SVG y `sw.js` para cachear recursos propios. Instala desde la opción del navegador cuando esté disponible. La precarga offline y la actualización en producción **aún no han sido probadas en navegador**; conexión inicial necesaria. El cache SW está acotado al scope de despliegue y las rutas son relativas para `/DEEP-SPACE-404/`.

## Verificación
```
node --test tests/*.test.mjs
node --check src/engine.mjs
node --check src/app.mjs
node --check sw.js
```
52 pruebas automáticas PASS a fecha 2026-10-10 (v0.8.3). Comprobaciones E2E, interacción de botones, responsive, accesibilidad, audio, guardado en navegador y offline PWA pendientes. **No declarar STABLE hasta probarlos.**

## Estado y límites
RC (release candidate), sin backend, sincronización, cuentas ni publicación automática a GitHub. El mundo y los eventos son deterministas por semilla; la experiencia no incluye simulación 3D ni exploración planetaria en tiempo real.

## Corrección 0.8.1
Si un evento no ofrece ninguna opción pagable, se habilita un protocolo de emergencia con penalización de casco, moral y estrés. No permite eludir opciones asequibles. La simulación de 40 universos con una estrategia codiciosa produjo 6 victorias; no constituye un estudio de equilibrio definitivo. Chromium E2E sigue bloqueado por ERR_BLOCKED_BY_ADMINISTRATOR.

## v0.8.2 — Equilibrio FTL (QA-RC)

- **RECUPERAR PLASMA (+18 FTL):** acción opcional después de escanear un sector, usable solo una vez por sector. Aporta 18 de combustible a cambio de 5 de oxígeno, 9 puntos de casco y 5 puntos de motor **más** el desgaste diario normal del motor. Avanza un día y consume suministros habituales. No está disponible si el casco está a 15 o menos o el oxígeno está por debajo de 8.
- La acción es un recurso estratégico de emergencia, no un botón de repostaje ilimitado. Debes seguir gestionando reparaciones, oxígeno y rutas.
- Los guardados antiguos se actualizan con un indicador de recuperación no utilizada por sector, sin reiniciar la partida.
- 48 pruebas Node pasan. En 40 universos de prueba con una política automática de exploración inmediata, 24 terminan con victoria (frente a 6/40 con la política anterior sin recuperación); **esto no equivale a una tasa general de victoria humana**.
- E2E en navegador, instalación offline y contraste siguen sin validación real. No etiquetar STABLE.

## v0.8.3 — Navegación inteligente (QA-RC)

- Al seleccionar un sistema, el mapa calcula la ruta de **menor combustible** (Dijkstra sobre las 24 conexiones FTL), incluidos trayectos que requieren varios saltos. El salto efectivo sigue siendo **manual y solo a sistemas adyacentes**: no hay piloto automático.
- Estimación del retorno más barato desde el destino hasta un sistema **ya visitado**, con avisos de insuficiencia de combustible o falta de reserva de regreso.
- Cálculo de ruta estimativo: utiliza la eficiencia actual del motor; **no** pronostica averías, eventos, desgaste posterior, oxígeno/comida, ni garantiza supervivencia o disponibilidad de plasma. Las bonificaciones de un sector sin escanear no son seguras.
- Se mantienen `schemaVersion=5` y las partidas v0.8.2 sin migración adicional. No se modifica la economía ni el balance: el aviso reduce errores de planificación, pero no garantiza mejorar la tasa de victoria.
- 52 pruebas Node PASS, incluidas cuatro pruebas adicionales de rutas y alertas. E2E visual, PWA offline y pruebas reales de navegador continúan pendientes.

## Versión 0.8.4 — QA RC
Se ha reforzado la validación de los efectos de eventos pendientes importados, añadiendo seis pruebas de seguridad e integridad de partidas. No modifica el esquema de guardado (v5) ni la dinámica de navegación; las partidas 0.8.3 se mantienen compatibles. Para verificar localmente: `node --test tests/*.test.mjs`. No se ha certificado el recorrido E2E, la PWA offline ni la jugabilidad humana completa.

### v0.8.5 (QA de accesibilidad)
El control **Importar** es ahora un botón accesible mediante teclado. Los guardados y las reglas de juego se mantienen respecto a v0.8.4. Las verificaciones automatizadas no sustituyen la validación E2E en navegador.

## v0.8.6 — Auditoría de foco y navegación por teclado
- Al elegir estrellas con teclado, se conserva el foco tras reconstruir el mapa. Se añade un identificador estable para restaurarlo.
- La interfaz E2E sigue sin verificarse: Chromium headless no devolvió DOM bajo el entorno de ejecución.
- No se ha certificado PWA offline ni una partida humana completa; **no STABLE**.

## v0.8.7 — PWA cache QA-RC
- Se actualiza el identificador de Cache Storage a `deep-space-404-v0.8.7`, para permitir purgar la versión antigua durante `activate`.
- Cuatro pruebas de comportamiento simulan `install`, `activate`, respuesta offline y peticiones externas mediante un entorno simulado Node. **No son pruebas E2E de navegador ni una instalación PWA real.**
- Se mantienen pendientes: verificación en Chrome/Edge de instalación, actualización y arranque offline; controles E2E; campaña humana completa.
- Verificación: `node --test tests/*.test.mjs`.

## v0.9.0 — Auditoría y GitHub Pages
Versión candidata corregida, no certificada como estable: 68 pruebas de Node superadas. Se refuerza validación de partidas y se limita la caché offline a archivos del juego. Véase `QA-FINAL.md` para verificaciones de navegador pendientes.

### Publicación en GitHub Pages
Sube **el contenido de esta carpeta** a la raíz del repositorio `DEEP-SPACE-404` (sin carpeta anidada) y habilita Pages desde la rama y directorio raíz. Los enlaces son relativos y el Service Worker utiliza el scope del repositorio. No se ha publicado automáticamente.

## Revisión 0.9.1 — servicio offline

Se ha corregido el reconocimiento de los recursos dentro de `src/` en el Service Worker usando el ámbito del propio repositorio, evitando errores de caché en GitHub Pages. Pruebas automatizadas: 70/70 PASS. Las pruebas E2E en Chromium siguen pendientes porque el entorno de auditoría bloquea las conexiones locales.

Para ejecutar pruebas de navegador en Windows, instala Python y Playwright (`py -m pip install playwright` y `py -m playwright install chromium`). Inicia el servidor con `py -m http.server 8000` desde esta carpeta y, en otra terminal, ejecuta `py tests/browser-e2e.py`. Revisa `QA-v0.9.1.md` para conocer los límites de esta suite.

## Auditoría v0.9.2
La caché PWA está aislada por ruta de instalación y los guardados corruptos se respaldan localmente cuando es posible. Véase `QA-v0.9.2.md`.


## Corrección v0.9.3 — botones inactivos en apertura local
El archivo `index.html` ahora carga `game.js` como script clásico diferido. Por ello se puede abrir directamente con doble clic (`file://`) sin bloqueo CORS de módulos ES; también funciona servido mediante HTTP y GitHub Pages. Se conserva `src/engine.mjs` y `src/app.mjs` como fuentes para mantenimiento y pruebas. Si se modifican las fuentes, regenerar `game.js` concatenando el motor sin sus declaraciones `export` y la aplicación sin su línea `import`. Para actualizaciones publicadas, recargar la página y cerrar pestañas antiguas si una versión previa del Service Worker permanece activa.


## Release candidate v0.9.4 — control de distribución
- Ejecutar `node tests/build-bundle.mjs --check` antes de subir a GitHub Pages. Si el bundle no coincide con los módulos, regenerarlo mediante `node tests/build-bundle.mjs`.
- Comprobar `node --test tests/*.test.mjs`. Las pruebas de Node NO sustituyen las pruebas de interfaz en navegador.
- `index.html` presenta ahora un aviso visible si ocurre un error JavaScript al iniciar, en lugar de mostrar botones inactivos sin explicación.
- La caché de la PWA se ha versionado a v0.9.4.
- Publicar el contenido de esta carpeta en la raíz del repositorio GitHub Pages. No hay que subir el ZIP como archivo sin descomprimir.

## v0.9.6 — Puente Cinematic Command y guía de inicio

- Pantalla de bienvenida con objetivo y cuatro pasos para iniciar la misión.
- Manual del comandante accesible desde la cabecera, disponible en cualquier momento.
- Asistente AURORA contextual: su recomendación se actualiza al escanear, extraer y escoger una ruta.
- Botón de acción orientativa que desplaza el foco visual a la estación adecuada; no ejecuta acciones peligrosas automáticamente.
- Animación del ventanal y del horizonte, controlada por EFECTOS y por `prefers-reduced-motion`.
- No se han eliminado mecánicas. Los guardados anteriores siguen utilizando el mismo esquema.

**Nota de QA:** 85 pruebas automatizadas PASS; no se ha certificado el recorrido de clics en navegador gráfico. Para prueba local basta extraer todo el ZIP y abrir `index.html`, o servir el directorio con `python -m http.server 8000`. Para GitHub Pages, publicar el contenido de esta carpeta en la raíz del repositorio.

## Guía rápida de publicación v1.0.2

Consulta [RELEASE-v1.0.2.md](./RELEASE-v1.0.2.md) para instrucciones de juego, despliegue en GitHub Pages y estado de QA. Versión **release candidate**, pendiente de verificación interactiva en navegador real.
