# Issues #69 + #68 — Microcopy de Loading y Empty States · Aprobación del Copywriter

> **Documento de copy final.** Define todos los strings visibles (y accesibles) que salen de #69 (loading states) y #68 (empty states). Frontend implementa estos textos **tal cual**; no se aprueba ningún copy fuera de esta lista. Reemplaza la sección 5 (placeholders) de la spec de UX `loading-empty-states-spec.md` v1.1.0 — la estructura (title / description / labels de acción) es de UX; **el texto es de Copy y está acá**.

| Campo | Valor |
|---|---|
| Issues | [#69 — loading states](https://github.com/ShopMGR/ShopMGR/issues/69) · [#68 — empty states](https://github.com/ShopMGR/ShopMGR/issues/68) |
| Fuente | `docs/design-system/loading-empty-states-spec.md` v1.1.0 (leída completa; secciones 1–10) · **revisión sync v1.2.0**: Q3b (§6.5.2 / E-AC16) y confirmación de C3 integradas |
| Fecha | 2026-10-07 |
| Estado | **Final — aprobado por Copywriter** (satisface E-AC10) |
| Auditoría de voz | `Frontend/src` completo (español rioplatense, sin i18n, strings inline) |
| Orden de implementación | Igual que la spec: **#69 primero → #68 después** |

---

## 1. Decisiones de tono y reglas de consistencia

Reglas que definen todos los strings de este documento. Cualquier string futuro de loading/empty debe seguir estas mismas reglas.

### 1.1 Voz

1. **Voseo rioplatense en imperativos e instrucciones** — "Creá", "Volvé", "Revisá", "Registrá", "Probá". Consistente con la app existente (`Login.tsx`, `Perfil.tsx`, `PasskeySection.tsx`). **Cero tuteo** en copy nuevo (ver inconsistencias corregidas §3).
2. **Títulos = fragmento nominal, sin punto final** ("Todavía no hay trabajos"). Consistente con el estilo ya usado en la app ("Sin fotos", "Sin trabajos activos").
3. **Descripciones = oración completa en voseo, con punto final.** ("Creá el primer trabajo para empezar a llevar el registro del taller.")
4. **Sin emojis, sin signos decorativos.** Iconos: solo Lucide, decorativos (`aria-hidden`).
5. **Longitud**: botones ≤ ~20 caracteres (excepción única §1.3.4), títulos ≤ ~50, descripciones ≤ ~75.

### 1.2 Casing de botones (regla unificada)

| Tipo de acción | Casing | Ejemplos |
|---|---|---|
| **CTA de creación** (`.btn-primary`, abre un form) | **Title Case** | "Crear Trabajo", "Crear Presupuesto", "Crear Cliente" |
| **Acción secundaria** (`.btn-secondary` o link accent en `compact`) | **sentence case** | "Quitar filtro", "Limpiar búsqueda", "Ver todos", "Registrar passkey" |

El Title Case de los CTAs **no es una decisión estética nueva**: es el casing que ya usan el FAB (`FAB.tsx:40/45/50`), los submits de los forms (`ClienteForm.tsx:415`, `PresupuestoForm.tsx:709`) y los tests existentes (`PresupuestoForm.test.tsx` espera `'Crear Presupuesto'`). Los empty states nuevos **adoptan** el label existente → la misma acción se dice igual en todos lados (FAB, empty, modal). Detalle en §3.5.

### 1.3 Vocabulario y formatting

1. **Elipsis tipográfica `…` (U+2026)** en todos los labels de carga. Nunca `...`. (Arregla "Cargando passkeys..." — ver §3.6.)
2. **Crear ≠ cargar ≠ registrar**: "Crear" es la acción de alta de entidades (botones); "registrar" es el vocabulario de datos históricos ("No hay horas registradas", "Todavía no registraste…"). No se mezclan verbos para la misma acción.
3. **"passkey" en minúscula** (jerga ya usada en la app: título del modal "Registrar passkey", sección "Passkeys").
4. **Excepción al límite de 20 chars**: "Limpiar búsqueda y filtros" (26). La acción limpia search **y** pill, así que el label debe nombrar ambas cosas; "Limpiar todo" se descartó por ambigua y "Quitar filtros" por incompleta.

### 1.4 Sistema semántico de títulos (regla fuerte — distingue vacío vs. sin resultados, E4)

La variación de frase **no es ruido**: marca en qué caso está el usuario.

| Situación | Fórmula | Ejemplo |
|---|---|---|
| Recurso entero vacío (invita a crear) | **"Todavía no hay {plural}"** | "Todavía no hay trabajos" |
| Vacío contextual de un cliente | **"Este cliente todavía no tiene {plural}"** | "Este cliente todavía no tiene presupuestos" |
| Segmento/sección vacío (estado, no creación) | **"Sin {segmento}"** | "Sin trabajos activos", "Sin presupuestos todavía" |
| Sin resultados (filtro/búsqueda activa → acción limpiar) | **"No hay {plural} con {contexto}"** o impersonal **"No se encontraron {plural}"** | "No hay trabajos con este filtro", "No se encontraron clientes" |

El impersonal "No se encontraron…" se usa cuando el contexto activo puede ser búsqueda **o** filtro (Clientes, `PresupuestoForm`); "No hay … con {contexto}" cuando el contexto es conocido y único (pills de estado en Trabajos/Presupuestos; búsqueda en `HoursModal`).

### 1.5 Labels accesibles (carga)

- Todos los labels nuevos terminan en `…` y describen **qué** se carga ("Cargando trabajos…"), no solo "Cargando".
- `sr-only` = anunciado por lector de pantalla, invisible. `visible` = se muestra en pantalla (`text-sm`, `--color-muted`).
- **Los skeletons no llevan texto visible**: solo un `span.sr-only` por contenedor; el interior es `aria-hidden` (confirmado contra spec 3.3 — barras `.skeleton` sin copy).

---

## 2. Tabla de strings — Issue #69 (LOADING) · 8 strings

| # | Key lógica | Texto final | Visibilidad | Aplica en (archivo) | Nota |
|---|---|---|---|---|---|
| L1 | `loading.default` | **Cargando…** | `sr-only` (default del componente) | `components/LoadingState.tsx` (default `label`) → páginas-detalle `ClienteDetalle.tsx` / `TrabajoDetalle.tsx` / `PresupuestoDetalle.tsx`, `App.tsx` Suspense ×2, `TrabajoForm.tsx` / `HorasTrabajoModal.tsx` / `MovimientosClienteModal.tsx` (`block`), `Dashboard.tsx` laterales ×2 (`inline`) | Hereda el texto que hoy tiene `App.tsx` (`message="Cargando…"`); los modales/laterales pasan de spinner mudo a este label anunciado |
| L2 | `loading.trabajos` | **Cargando trabajos…** | `sr-only` (`SkeletonList label`) | `pages/Trabajos.tsx` | |
| L3 | `loading.presupuestos` | **Cargando presupuestos…** | `sr-only` | `pages/Presupuestos.tsx` | |
| L4 | `loading.clientes` | **Cargando clientes…** | `sr-only` | `pages/Clientes.tsx` | |
| L5 | `loading.metricas` | **Cargando métricas…** | `sr-only` | `components/Skeleton.tsx` (`SkeletonHero`/`SkeletonMetricGrid`) → `pages/Dashboard.tsx` hero+grid, `pages/Metricas.tsx` hero+grid | |
| L6 | `loading.usuarios` | **Cargando usuarios…** | **visible** (`text-sm`, muted) | `pages/Perfil.tsx` (inline) | Spec 6.2 lo marca explícitamente como "label visible"; reemplaza el spinner mudo `--color-muted` |
| L7 | `loading.passkeys` | **Cargando passkeys…** | **visible** (confirmado por spec v1.2.0 — ver Conflicto C3) | `components/PasskeySection.tsx` (inline) | Hoy visible como "Cargando passkeys..." → unifica `...` → `…` (§3.6) |
| L8 | `loading.periodos` | **Cargando períodos disponibles…** | `sr-only` (`span[role="status"]`) | `pages/Metricas.tsx` (junto al selector deshabilitado) | |

**Confirmaciones:**
- **Skeletons: 0 strings visibles** — solo `sr-only` (L2–L5) + barras; interior `aria-hidden="true"` (spec 3.3).
- **Botones de mutación (L5 de la spec): 0 cambios** — "Ingresando…", "Creando…", "Eliminando…", "Aceptando…" etc. quedan canónicos, fuera de alcance (L-AC11).
- **Pills de filtro: 0 cambios de copy** — siguen "Todos / Activos / Pend. / Termin." y "Todos / Pend. / Acept. / Rechaz."; Q5 solo oculta el conteo `(n)` durante loading (markup, no copy).

---

## 3. Tabla de strings — Issue #68 (EMPTY) · 23 keys → 35 strings únicos

Tipos: **[CTA]** = CTA de creación (btn-primary) · **[SEC]** = acción secundaria (btn-secondary / link accent) · **[EST]** = texto de estado (título/descripción).

### 3.1 P0 — Páginas (13 keys)

| # | Key lógica | Variante · size | Título [EST] | Descripción [EST] | Acción | Secundaria | Aplica en |
|---|---|---|---|---|---|---|---|
| E1 | `empty.trabajos.default` | `default` | Todavía no hay trabajos | Creá el primer trabajo para empezar a llevar el registro del taller. | **Crear Trabajo** [CTA] → abre `TrabajoForm` sin preselección | — | `pages/Trabajos.tsx` |
| E2 | `empty.trabajos.contextualCliente` | `contextual` | Este cliente todavía no tiene trabajos | Creá el primer trabajo para este cliente. | **Crear Trabajo** [CTA] → abre `TrabajoForm` **con cliente preseleccionado** (Q3, mecánica spec 6.5) | — | `pages/Trabajos.tsx` (`?cliente=X`) |
| E3 | `empty.trabajos.noResults` | `no-results` | No hay trabajos con este filtro | Volvé a "Todos" o probá con otro filtro. | — | **Quitar filtro** [SEC] → `setFilter('todos')`, foco a la pill "Todos" | `pages/Trabajos.tsx` |
| E4 | `empty.presupuestos.default` | `default` | Todavía no hay presupuestos | Creá el primer presupuesto para enviarle una cotización a un cliente. | **Crear Presupuesto** [CTA] | — | `pages/Presupuestos.tsx` |
| E5 | `empty.presupuestos.contextualCliente` | `contextual` | Este cliente todavía no tiene presupuestos | Creá el primer presupuesto para cotizarle un trabajo. | **Crear Presupuesto** [CTA] → **con cliente preseleccionado** (Q3b **resuelto**: preselección igual que en `TrabajoForm` — mecánica spec v1.2.0 **§6.5.2**, verificación AC **E-AC16**) | — | `pages/Presupuestos.tsx` (`?cliente=X`) |
| E6 | `empty.presupuestos.noResults` | `no-results` | No hay presupuestos con este filtro | Volvé a "Todos" o probá con otro filtro. | — | **Quitar filtro** [SEC] → foco a la pill "Todos" | `pages/Presupuestos.tsx` |
| E7 | `empty.clientes.default` | `default` | Todavía no hay clientes | Creá un cliente para registrar sus trabajos y presupuestos. | **Crear Cliente** [CTA] | — | `pages/Clientes.tsx` |
| E8 | `empty.clientes.noResults` | `no-results` | No se encontraron clientes | Revisá lo que escribiste o quitá los filtros. | — | **Limpiar búsqueda y filtros** [SEC] → `setSearch('')` + `setFilter('todos')`, foco al input | `pages/Clientes.tsx` |
| E9 | `empty.dashboard.trabajosActivos` | `contextual` `compact` | Sin trabajos activos | — | — | — | `pages/Dashboard.tsx` (lateral izq.) |
| E10 | `empty.dashboard.presupuestosPendientes` | `contextual` `compact` | Sin presupuestos pendientes | — | — | — | `pages/Dashboard.tsx` (lateral der.) |
| E11 | `empty.dashboard.verTodos` | acción de E9/E10 **(Q4 — relabel)** | — | — | **Ver todos** [SEC, link accent] → navega a `/trabajos` / `/presupuestos` (sin cambio de comportamiento) | — | `pages/Dashboard.tsx` **×2** (hoy "Crear uno", líneas 238 y 329) |
| E12 | `empty.clienteDetalle.trabajosRecientes` | `contextual` `compact` | Sin trabajos todavía | — | — (Q2: la sección se muestra con su header; la FAB ofrece crear) | — | `pages/ClienteDetalle.tsx` |
| E13 | `empty.clienteDetalle.presupuestosRecientes` | `contextual` `compact` | Sin presupuestos todavía | — | — | — | `pages/ClienteDetalle.tsx` |

### 3.2 P1 — Componentes/modales (10 keys)

| # | Key lógica | Variante · size | Título [EST] | Descripción [EST] | Acción | Secundaria | Aplica en |
|---|---|---|---|---|---|---|---|
| E14 | `empty.hoursModal.default` | `default` | **Sin trabajos activos** | — | — (la superficie no tiene creación → sin CTA, E2) | — | `components/HoursModal.tsx` |
| E15 | `empty.hoursModal.noResults` | `no-results` | No hay trabajos activos con esa búsqueda | — | — | **Limpiar búsqueda** [SEC] → `setSearch('')`, foco al input | `components/HoursModal.tsx` |
| E16 | `empty.horasTrabajoModal` | `contextual` `compact` | No hay horas registradas | — | — | — | `components/HorasTrabajoModal.tsx` |
| E17 | `empty.movimientosClienteModal` | `contextual` `compact` | No hay movimientos registrados | — | — | — | `components/MovimientosClienteModal.tsx` |
| E18 | `empty.presupuestoForm.sinClientes` | `default` | No hay clientes registrados | — | — | — | `components/PresupuestoForm.tsx` (selector de cliente; copy actual, referencia E4 de la app) |
| E19 | `empty.presupuestoForm.noResults` | `no-results` | No se encontraron clientes | — | — | **Limpiar búsqueda** [SEC] ⚠ **ver Conflicto C2** | `components/PresupuestoForm.tsx` |
| E20 | `empty.trabajoForm.presupuestos` | `contextual` `compact` | No hay presupuestos disponibles para este cliente | — | — | — | `components/TrabajoForm.tsx` |
| E21 | `empty.trabajoDetalle.fotos` | `contextual` `compact` (+ `children={<ImageUpload/>}`) | Sin fotos todavía | — | — (la acción de subir ya está visible debajo) | — | `pages/TrabajoDetalle.tsx` |
| E22 | `empty.passkeys.default` | `contextual` `compact` | Todavía no registraste ningún passkey | — | **Registrar passkey** [SEC, link accent] → reutiliza el handler del `+` actual | — | `components/PasskeySection.tsx` |
| E23 | `empty.passkeys.noSoportado` | `contextual` `compact` | (mismo título que E22) | Tu navegador no soporta passkeys. Probá con otro dispositivo o navegador. | **— sin acción** (navegador no soporta) | — | `components/PasskeySection.tsx` |

**Descripción de E23 = string existente, conservado carácter por carácter** — `PasskeySection.test.tsx:110` lo asserta; ver C-AC13.

### 3.3 Conteo y reutilización

- **23 keys → 35 strings únicos** (19 títulos + 8 descripciones + 8 labels de acción).
- Strings reutilizados en más de una superficie: "Crear Trabajo" (E1/E2) · "Crear Presupuesto" (E4/E5) · "Quitar filtro" (E3/E6) · "Volvé a "Todos" o probá con otro filtro." (E3/E6) · "Ver todos" (E11 ×2, + 2 headers preexistentes) · "Sin trabajos activos" (E9/E14) · "No se encontraron clientes" (E8/E19) · "Limpiar búsqueda" (E15/E19).
- **Key única Q4**: `empty.dashboard.verTodos` cubre las 2 ocurrencias de "Crear uno" (E11).

---

## 4. Inconsistencias de copy existente corregidas

| # | Antes (dónde) | Después | Por qué |
|---|---|---|---|
| 1 | **"Crear uno"** (`Dashboard.tsx:238, 329`) — el botón **navega** a la lista, no crea | **"Ver todos"** (E11) | Label engañoso (decide Q4) + unifica con el "Ver todos" que ya tienen los headers de las mismas cards (`Dashboard.tsx:170, 257`) |
| 2 | **"Crea uno desde un cliente"** (`Trabajos.tsx:171`) — tuteo + sin salida clickeable | reemplazado por E1 (voseo + CTA "Crear Trabajo") | Único tuteo del copy de listas en una app voseo; y un estado sin acción viola E2 |
| 3 | **"No se encontraron clientes" siempre** (`Clientes.tsx:162`), incluso sin búsqueda | separado en E7 (vacío real, "Todavía no hay clientes" + CTA) vs E8 (sin resultados + "Limpiar…") | Copy de "búsqueda" usado como vacío por defecto (E4 violado) |
| 4 | **"No hay trabajos"/"No hay presupuestos" repetido** en la rama de filtro (`Trabajos.tsx:189`, `Presupuestos.tsx:136–148`) — idéntico al vacío real | E3/E6 "No hay … con este filtro" + "Quitar filtro" | El usuario no podía distinguir "no tengo datos" de "filtré mal" (E4 violado) |
| 5 | Casing de creación **potencialmente dividido**: spec decía "Crear trabajo" (minúscula) vs FAB/forms/tests "Crear Trabajo" | **"Crear Trabajo" / "Crear Presupuesto" / "Crear Cliente"** en todos lados | Misma acción = mismo label; evita "Crear trabajo" en el empty vs "Crear Trabajo" en el FAB (§1.2). Cero churn en tests |
| 6 | **"Cargando passkeys..."** (3 puntos, `PasskeySection.tsx:84`) | **"Cargando passkeys…"** (E-AC/L7) | El resto de la app usa `…` ("Cargando…", "Eliminando…") |
| 7 | **"Todavía no registraste ningún passkey."** (con punto final) | título **sin punto** (E22) | Regla §1.1.2: títulos son fragmentos (la descripción E23 sí conserva sus puntos) |
| 8 | **"No hay trabajos activos"** (`HoursModal.tsx:198`) vs **"Sin trabajos activos"** (`Dashboard.tsx:232`) — mismo hecho, dos frases | vacío real unificado a **"Sin trabajos activos"** (E9 = E14); "No hay trabajos activos con esa búsqueda" solo cuando hay búsqueda (E15) | Una frase por hecho; y la diferencia "Sin…" vs "No hay… con…" ahora **marca** vacío real vs. sin resultados (sistema §1.4) |

**Auditado y sin cambios (correcto hoy):** "Ver todos" de los headers · "Ingresando…"/"Creando…" (Login, L5) · "Registrar Horas"/"Registrar Movimiento" (FAB) · "No hay horas registradas" / "No hay movimientos registrados" / "No hay presupuestos disponibles para este cliente" / "No hay clientes registrados" / "No se encontraron clientes" (`PresupuestoForm` — golden reference) · labels de pills y badges.

---

## 5. Conflictos con la spec de UX (reporte — NO se modificó la spec)

| ID | Conflicto | Detalle | Recomendación / estado |
|---|---|---|---|
| **C1** | **Casing de CTA vs. AC de QA** | La spec pone "Crear trabajo" (minúscula) en 5.1 y en los ejemplos de **E-AC7** (`getByRole('button', { name: 'Crear trabajo' })`) y **E-AC14** ("el CTA 'Crear trabajo'"). El copy final usa **"Crear Trabajo"** para unificar con FAB + forms + tests existentes (§1.2) | No bloqueante: la propia spec (E7/E-AC10) dice que la sección 5 es placeholder y que el copy final manda. **QA debe ajustar el matcher a `'Crear Trabajo'`**. UX puede actualizar la spec cuando lo considere |
| **C2** | **`PresupuestoForm` no-results sin `secondaryAction`** | El union type de la spec (4.1) hace **obligatorio** `secondaryAction` en `no-results` ("no existe pantalla 'sin resultados' sin salida"), pero 5.2/6.3 marcan `PresupuestoForm` con Action "—" | Recomendación Copy: usar **"Limpiar búsqueda"** (E19), coherente con E3/E15 y con el foco de vuelta al input. Si UX/PM prefiere sin acción, hay que relajar la spec/type — **decisión de UX, no mía** |
| **C3** | **Visibilidad del `label` en `LoadingState` `inline`/`block`** | 3.2 decía "sr-only, **o visible** si se pasa `label`", pero solo la fila de `Perfil` en 6.2 aclaraba "label visible"; la fila de `PasskeySection` no | ✅ **Resuelto en spec v1.2.0** (regla dura): `label` presente ⇒ **visible**; sin `label` ⇒ `sr-only`. Se confirmó la recomendación del Copywriter (hoy `PasskeySection` ya muestra texto visible; hacerlo `sr-only` sería una regresión visual). Visible en `Perfil.tsx` ("Cargando usuarios…") y `PasskeySection.tsx` ("Cargando passkeys…"); los laterales de Dashboard quedan sr-only. Verificación: **L-AC14** |

**Desviaciones respecto de los placeholders de la spec §5** (todas permitidas por E7 — el placeholder no es string final; la estructura no cambió): "No encontramos clientes" → **"No se encontraron clientes"** (golden reference + E8) · "Cargá un cliente…" → **"Creá un cliente…"** (§1.2.2: mismo verbo que el CTA "Crear Cliente") · descripción contextual de Trabajos reescrita ("Creá el primer trabajo para este cliente." — el placeholder "…registrar **sus** ingresos" era ambiguo sobre de quién son los ingresos) · "Creá un presupuesto…" → **"Creá el primer presupuesto…"** (simetría con la contextual de Trabajos) · título de `HoursModal` default unificado a "Sin trabajos activos" (§4.8) · `Sin fotos` → **"Sin fotos todavía"** (paralelismo con "Sin trabajos todavía").

---

## 6. Gaps detectados, FUERA de alcance de #69/#68 (no se tocaron)

1. **`HoursModal.tsx:339` "Cargando costo hora..."** y **`MovimientoModal.tsx:133/157` "Cargando..."** (en `<option>`): textos de loading **no listados en la tabla 6.2 de la spec** → falta fila en la spec; recomiendo agregarlos a un follow-up (unificar `...` → `…`).
2. **`ClienteDetalle.tsx:231/276` "Sin teléfonos. Haz clic en + para agregar." / "Sin dirección.…"**: tuteo ("Haz clic") y no están en las tablas 6.2/6.3 → follow-up de copy.
3. **Estados de error**: 6 variantes + `Dashboard.tsx` sin manejo de error (spec sección 9) — ya pautado como issue nuevo.
4. **Placeholders de inputs** con `...` ("Buscar cliente...", "Buscar trabajo...") no son loading/empty → fuera de alcance, pero entran en la misma pasada de formato cuando se haga un issue de tipografía/elipses.

---

## 7. "Listo para Frontend" — AC de copy para QA

Frontend implementa `Frontend/src` con estos strings **textuales**. Todos los AC pasan **además** de los AC funcionales de la spec (L-AC*, E-AC*).

### 7.1 #69 — Loading

| # | Criterio | Verificación |
|---|---|---|
| **C-AC1** | Se unificó la elipsis en el label de passkeys | `grep -rn "Cargando passkeys\.\.\." Frontend/src` → **0** · `grep -rn "Cargando passkeys…" Frontend/src` → **1** |
| **C-AC2** | Default "Cargando…" (U+2026) existe como label del componente | `grep -rn "Cargando…" Frontend/src/components/LoadingState.tsx` → **≥1** |
| **C-AC3** | Los 7 labels restantes de la tabla §2 (el default "Cargando…" está en C-AC2) están presentes con al menos 1 ocurrencia: "Cargando trabajos…", "Cargando presupuestos…", "Cargando clientes…", "Cargando métricas…", "Cargando usuarios…", "Cargando passkeys…", "Cargando períodos disponibles…" | `grep -rn "Cargando trabajos…" Frontend/src` (→≥1) y análogos para cada string; **0 misses** |
| **C-AC4** | Skeletons sin texto visible: por cada `role="status"` de skeleton hay exactamente un `span.sr-only` y el resto del interior es `aria-hidden` | Revisión de markup (spec 3.3) + `getByRole('status')` devuelve **solo** el label sr-only |
| **C-AC5** | Cero `...` nuevos en labels de carga de query | `grep -rn "Cargando[^\"]*\.\.\." Frontend/src --include=*.tsx` → solo los 3 matches **documentados como gap** (§6.1: `HoursModal.tsx`, `MovimientoModal.tsx` ×2) |

### 7.2 #68 — Empty

| # | Criterio | Verificación |
|---|---|---|
| **C-AC6** | Relabel Q4 completo: "Crear uno" no existe | `grep -rn "Crear uno" Frontend/src` → **0** |
| **C-AC7** | "Ver todos" ×4 en Dashboard (2 headers preexistentes + 2 empties) | `grep -rn "Ver todos" Frontend/src/pages/Dashboard.tsx` → **4** |
| **C-AC8** | CTAs de creación con casing unificado (Title Case) | `grep -rnE "Crear (Trabajo\|Presupuesto\|Cliente)" Frontend/src/pages/Trabajos.tsx Frontend/src/pages/Presupuestos.tsx Frontend/src/pages/Clientes.tsx` → **5** (Trabajos 2, Presupuestos 2, Clientes 1). Y `grep -rnE "Crear (trabajo\|presupuesto\|cliente)" Frontend/src --include=*.tsx` → **0** en strings (ignorar comentarios, si los hubiera). *Ojo: los tests usan `'Crear Trabajo'`, no `'Crear trabajo'` (Conflicto C1)* |
| **C-AC9** | "No se encontraron clientes" = solo en no-results | `grep -rn "No se encontraron clientes" Frontend/src` → **2** (`Clientes.tsx` E8 + `PresupuestoForm.tsx` E19) |
| **C-AC10** | Vacíos por defecto de las 3 listas | `grep -rn "Todavía no hay" Frontend/src/pages` → **3** (trabajos / presupuestos / clientes) |
| **C-AC11** | Los strings viejos ambiguos ya no existen como título suelto | `grep -rn ">No hay trabajos<\|>No hay presupuestos<\|>No se encontraron clientes<" Frontend/src/pages` → **0** (aparecen solo como prefijo de los títulos nuevos: "No hay trabajos con este filtro", etc.) |
| **C-AC12** | Cero tuteo en el copy de #68 | `grep -rn "Crea uno" Frontend/src` → **0**; `grep -rn "Haz clic" Frontend/src/pages/Trabajos.tsx Frontend/src/pages/Presupuestos.tsx Frontend/src/pages/Clientes.tsx Frontend/src/pages/Dashboard.tsx` → **0** (`ClienteDetalle.tsx` queda con su gap documentado §6.2) |
| **C-AC13** | Passkeys: título sin punto final **y** descripción no-soportada intacta (test) | `grep -rn "Todavía no registraste ningún passkey\." Frontend/src` → **0** (sin punto). `grep -rn "Tu navegador no soporta passkeys. Probá con otro dispositivo o navegador." Frontend/src` → **1** (string exacto; `PasskeySection.test.tsx:110` debe pasar) |
| **C-AC14** | Sin regresiones de tests por copy | `cd Frontend && npm run test && npm run build` → pasan. Auditoría previa: **ningún test** asserta el copy viejo de empty/loading salvo la descripción de passkeys no soportada (conservada exacta) |
| **C-AC15** | Sign-off (E-AC10): este documento es la aprobación | Frontend usa los strings **textuales** de §2/§3; cualquier texto nuevo o distinto → volver al Copywriter antes de merge |

---

*Documento de Copy — Sprint 5. Spec de UX sin modificar. Ningún commit hasta aprobación del usuario.*
