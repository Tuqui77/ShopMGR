# Issues #69 + #68 — Loading States y Empty States · Spec de Diseño

> **Documento de referencia para los subagentes Copywriter y Frontend.** Contiene la auditoría del estado actual, los patrones decididos por UX, la especificación visual/accesible, el contrato de componentes, la tabla página→patrón y los criterios de aceptación por issue. Si algo falta o contradice una decisión listada en la sección 1, detener y consultar antes de implementar.

| Campo | Valor |
|---|---|
| Issues | [#69 — fix: estandarizar loading states en todas las páginas](https://github.com/ShopMGR/ShopMGR/issues/69) · [#68 — feat: implementar empty states en listas vacías](https://github.com/ShopMGR/ShopMGR/issues/68) |
| Fecha | 2026-10-07 |
| Estado | **Q1–Q5 + Q3b respondidas por el dueño** (sección 1.4) · **copy final aprobado** en `loading-empty-states-copy.md` (E-AC10 satisfecha; conflictos C1–C3 integrados en v1.2.0) |
| Consumidor | Subagente Frontend (React 18 + TS + Tailwind v4) · Copywriter (`loading-empty-states-copy.md` es la fuente del texto) |
| Orden | **#69 primero → #68 después** (tocan los mismos archivos: `Trabajos.tsx`, `Presupuestos.tsx`, `Clientes.tsx`; además `Dashboard.tsx`, `store/index.ts`, `TrabajoForm.tsx`) |
| Alcance | **P0 (páginas) + P1 (modales/componentes) en los mismos issues** — decide Q1, sección 1.4 |
| Decisiones | UX (este documento) · Dueño: Q1–Q5 + Q3b (sección 1.4) · Copy: **final** en `loading-empty-states-copy.md` — ese documento prevalece sobre cualquier string de la sección 5 |
| Versionado | **v1.2.0** (semver) — historial: v1.0.0 (auditoría + patrones) · v1.1.0 (Q1–Q5) · **v1.2.0** (Q3b + conflictos C1/C2/C3 con el copy) |

---

## 1. Resumen y decisiones de diseño

### 1.1 Principios

1. **Un patrón por tipo de superficie**, no por página. La superficie define el patrón: lista, métrica, página-detalle, sección-chica, botón.
2. **El chrome de la página nunca desaparece por una carga.** Header, filtros y búsqueda permanecen en el DOM durante el loading (hoy desaparecen en las 3 listas → salto de layout + pérdida de contexto).
3. **Vacío ≠ Sin resultados.** Una lista vacía "por defecto" invita a crear; una lista vacía por búsqueda/filtro invita a limpiar el filtro. Nunca muestran el mismo copy ni las mismas acciones.
4. **Accesibilidad no opcional:** todo estado asíncrono anuncia su cambio a lectores de pantalla (`role="status"`), los degradados de carga respetan `prefers-reduced-motion`, y todo el copy nuevo respeta contraste AA con las CSS vars del proyecto.
5. **Sin dependencias nuevas, solo Lucide, solo utilities/clases existentes** más dos bloques de CSS propios (`.skeleton`) que se agregan a `index.css`.

### 1.2 Decisiones de diseño — LOADING

| ID | Decisión | Justificación (2 líneas) |
|---|---|---|
| **L1** | **Skeleton para listas y cards** (`SkeletonList`, `SkeletonHero`, `SkeletonMetricGrid`) en Trabajos, Presupuestos, Clientes, Dashboard (hero + grid) y Métricas. | El contenido de destino es repetitivo y con forma conocida: el skeleton mantiene la geometría (cero salto de layout al llegar los datos) y reduce la percepción de espera vs. un spinner. Además permite **mantener header/filtros visibles**, que hoy desaparecen con el early return. |
| **L2** | **Spinner centrado (`LoadingState variant="page"`) para páginas-detalle** (ClienteDetalle, TrabajoDetalle, PresupuestoDetalle) y **`variant="block"` para el contenido de modales**. | El detalle es una entidad única con layout complejo (fotos, progreso, secciones): un skeleton fiel sería caro y se desincronizaría del contenido real. El spinner es honesto, barato y ya es el patrón vigente en detalle (cambio visual nulo, solo componentización). |
| **L3** | **Spinner chico (`variant="inline"`)** para secciones pequeñas dentro de una card (Dashboard "Trabajos activos" / "Presupuestos pendientes", Perfil "Administrar usuarios", Passkeys). | La sección no tiene contrato de forma conocido (lista de 0 a N filas cortas): un skeleton ahí adivina el layout. El spinner chico ya es el patrón vigente en esos 4 lugares → estandarizar = unificar tamaño/color/aria, no rediseñar. |
| **L4** | **Spinners standalone: color `var(--color-accent)`, tamaños fijos (w-8 / w-6 / w-5).** El spinner **dentro de un botón** conserva el color heredado del botón. | Hoy hay spinners `--color-accent` y `--color-muted` mezclados sin regla (Perfil y Passkeys usan muted, el resto accent). Una sola regla = verificable por grep por QA. El caso botón es un patrón de mutación distinto (ver L5) y ya es consistente. |
| **L5** | **Botones en mutación (Login, "Eliminando…", "Aceptando…", etc.) NO cambian.** Se documentan como patrón canónico: `Loader2` hereda el color, `disabled`, label con "…". | Ya son consistentes en toda la app (icono + label + disabled). Tocarlos agregaba riesgo sin beneficio; queda documentado para que futuros issues lo sigan. |

### 1.3 Decisiones de diseño — EMPTY

| ID | Decisión | Justificación (2 líneas) |
|---|---|---|
| **E1** | **`EmptyState` con `variant`: `default` \| `no-results` \| `contextual`** (semántica) y **`size`: `default` \| `compact`** (visual). | La variante controla *qué acciones corresponden* (crear vs. limpiar) y el size controla *cómo se ve* (card en página, texto suelto dentro de otra card). Separarlos evita duplicar markup por recurso. |
| **E2** | **`default` (lista vacía real): CTA de creación primaria obligatoria** cuando la superficie tiene creación (`.btn-primary`). | La lista vacía es el mejor momento para la primera acción del producto ("Crear primer trabajo"). Sin CTA, el usuario muere en una pantalla sin salida. |
| **E3** | **`no-results` (búsqueda/filtro sin resultados): sin CTA de creación, con acción secundaria "Limpiar…".** | El problema del usuario no es "no tengo datos", es "filtré mal". Ofrecer crear un trabajo ahí confunde; ofrecer limpiar resuelve en 1 clic. |
| **E4** | **Regla dura para elegir variante:** `totalItems === 0` → `default`/`contextual` **sin importar los filtros**; `totalItems > 0 && filteredItems === 0` → `no-results`. | Si no hay datos en absoluto, "limpiar filtros" no ayuda (queda igual). Si sí hay datos y el filtro los escondió, limpiar es la única salida. Hoy Trabajos/Presupuestos/Clientes no distinguen estos casos. |
| **E5** | **Icono Lucide decorativo** (`aria-hidden`, color `var(--color-muted)` **sin** `opacity: 0.5`), **título en `--color-text`, descripción en `--color-muted`**. El tamaño `default` se monta sobre **`.card`**. | Jerarquía: texto principal legible (AA verificado en E-AC8), icono = decoración (no necesita contraste, pero el `opacity 0.5` actual los hace casi invisibles en tema claro). La `.card` hace que el empty ocupe el mismo slot visual que un item de la lista. |
| **E6** | **`role="status"` en `LoadingState`, `SkeletonList*` y `EmptyState`.** | Anuncia "Cargando trabajos…" al entrar en loading y "Todavía no hay trabajos" al resolver vacío, sin mover el foco. Verificable por QA con un lector de pantalla o con `getByRole('status')`. |
| **E7** | **Copy en voseo rioplatense** (como el resto de la app: "Creá", "Probá", "Registrá"). La estructura (title / description / acciones) es de UX; **el texto es del Copywriter** → final en `loading-empty-states-copy.md`. | El sign-off ya ocurrió (E-AC10): la sección 5 quedó alineada al copy final en v1.2.0. Cualquier string nuevo o distinto pasa por el Copywriter antes de merge. |

### 1.4 Decisiones del dueño (Q1–Q5 + Q3b — respondidas)

| ID | Decisión del dueño | Efecto en la spec |
|---|---|---|
| **Q1** | **P0 + P1 todo junto**: páginas Y modales/componentes en el mismo esfuerzo. El alcance de #69 y #68 incluye las tablas P0 y P1 de la auditoría. | Filas P1 de la tabla 6.3 → filas concretas en alcance de #68 (tabla 5.2); loading de modales en 6.2 → alcance de #69. Nuevos AC: **L-AC13**, **E-AC15**. |
| **Q2** | **Mostrar empty contextual `compact`** en ClienteDetalle (decisión **contraria** a la recomendación UX): las secciones "Recientes" vacías se muestran en vez de ocultarse. | Fila de ClienteDetalle actualizada en 2.3, 5.1 y 6.3; nuevo AC **E-AC13**. |
| **Q3** | **Sí preseleccionar el cliente**: desde `Trabajos?cliente=X` el CTA "Crear Trabajo" abre `TrabajoForm` con el cliente preseleccionado. Alcance extra aprobado → cae en **#68** (el CTA vive en el empty state). | Mecánica exacta (store, no prop) especificada en **6.5.1**; nuevo AC **E-AC14**. `PresupuestoForm` se resuelve por separado → **Q3b** (fila de abajo). |
| **Q4** | **Relabel "Crear uno" → "Ver todos"** en Dashboard: es cambio de **copy**, no de comportamiento (sigue navegando a la lista). **Invalida** la recomendación UX original (abrir el form directo). Key `empty.dashboard.verTodos`, **copy: Copywriter**. Verificado: "Crear uno" existe solo en `Dashboard.tsx` (2 usos: líneas 238, 329) → se relabelan ambos. | Filas de Dashboard en 5.1 actualizadas; **E-AC4** ajustada (Dashboard navega, no abre modal). |
| **Q5** | **Sí ocultar los pills "(0)"** durante loading en Trabajos/Presupuestos → AC de #69 con markup. | L-AC3 + markup explícito en **6.2**. `Clientes.tsx` no aplica: sus pills no muestran conteo (líneas 140–144). |
| **Q3b** | **Sí preseleccionar el cliente en `PresupuestoForm`** (por simetría con Q3): desde `Presupuestos?cliente=X` el CTA "Crear Presupuesto" abre el form **con el cliente preseleccionado** y en el paso `datos`. | Mecánica en **6.5.2** — más compleja que 6.5.1: hay que resolver el objeto `Cliente` completo y saltar de paso (2 fases). Filas de **5.1** y **6.3** actualizadas; nuevo AC **E-AC16**. **Q3b queda resuelta** (sección 10 sin preguntas abiertas). |

---

## 2. Auditoría del estado actual

Metodología: revisión completa de `Frontend/src/pages/*.tsx`, `Frontend/src/components/*.tsx`, `App.tsx`, `ErrorBoundary.tsx`, `index.css` y grep de `isLoading|Loader2|animate-spin|No hay|No se encontraron|role="status"|prefers-reduced-motion`.

### 2.1 Hallazgos principales

1. **Existe `LoadingSpinner.tsx` y `EmptyState.tsx` y casi no se usan.** `LoadingSpinner` solo como fallback de `<Suspense>` en `App.tsx` (2 usos). `EmptyState.tsx` tiene **0 importaciones en toda la app** (código muerto) — por eso se evoluciona su contrato en vez de crear un tercer componente.
2. **10 páginas con su propio `if (isLoading)`**, 5 markup distintos para la misma idea (ver tabla 2.2). Las 3 listas hacen **early return del header y los filtros** durante la carga → layout salta y el usuario pierde el contexto de filtro.
3. **Cero accesibilidad en los estados asíncronos:** en todo `Frontend/src` hay **0** `role="status"`, **0** `aria-busy`, **1** `aria-live` (el sr-only de períodos en Metricas) y **0** `prefers-reduced-motion` (el shimmer/rotación actual no está contemplado).
4. **Empty states inline repetidos a mano**: `<div className="text-center py-12"> + Lucide + <p style={{color:'var(--color-muted)'}}>` con copy inconsistente (ver 2.3) y **ninguna distingue búsqueda/filtro de vacío real**, salvo `PresupuestoForm.tsx` (único buen ejemplo, se toma como referencia).
5. **Errores: 6 variantes distintas** (auditiado, fuera de alcance de #69/#68 — ver sección 9). **`Dashboard.tsx` no maneja error de ningún query**: si la API falla, muestra "Sin trabajos activos" y métricas "—" **como si estuviera vacío** → confunde error con ausencia de datos (flagged como follow-up).
6. **`Login.tsx` ya cumple** el patrón canónico de botón (L5) → no cambia en #69.

### 2.2 Tabla de auditoría — LOADING

| Archivo | Líneas hoy | Qué muestra hoy | Problema |
|---|---|---|---|
| `pages/Trabajos.tsx` | 45–51 | Early return: `Loader2 w-8 animate-spin` centrado en `min-h-screen` (sin padding) | Pierde header + filtros; variante de container distinta al resto |
| `pages/Presupuestos.tsx` | 54–60 | Early return: mismo spinner con `min-h-screen pb-24 lg:pb-8` | Pierde header + filtros; markup duplicado |
| `pages/Clientes.tsx` | 90–96 | Early return: idéntico al de Presupuestos | Pierde header + search + filtros |
| `pages/ClienteDetalle.tsx` | 96–102 | Early return: spinner centrado | Patrón aceptable (ver L2), pero duplicado y sin aria |
| `pages/TrabajoDetalle.tsx` | 286–292 | Early return: idéntico | Ídem |
| `pages/PresupuestoDetalle.tsx` | 168–174 | Early return: idéntico | Ídem (el test `PresupuestoDetalle.test.tsx:246` exige `.animate-spin` — ver 6.2) |
| `pages/Dashboard.tsx` | 93–99, 123–132 | Card hero con spinner `w-6` + grid de 4 cards **cada una con su spinner `w-4`** | 5 spinners parpadeando a la vez; salto de layout al llegar datos; sin aria |
| `pages/Dashboard.tsx` | 174–177, 261–264 | Spinner `w-5` inline en listas laterales | Sin aria; color OK (queda `inline` estándar) |
| `pages/Metricas.tsx` | 153–169 | Card hero con spinner `w-6` + 4 cards con spinner `w-4` (mismo duplicado que Dashboard) | Ídem Dashboard; **además ya tiene el mejor manejo de error de la app (170–180, con "Reintentar")** |
| `pages/Perfil.tsx` | 408–411 | Spinner `w-5` **`--color-muted`** | Color fuera de regla (L4) |
| `pages/Perfil.tsx` | 378, 480, 539, 584 | Spinners dentro de botones de mutación | ✅ Cumple L5, no cambia |
| `pages/Login.tsx` | 245–261, 286 | Botón con `Loader2 w-5` + label "Ingresando…"/"Creando…" + disabled; `PasskeyButton` ídem | ✅ Cumple L5, no cambia (issue lo lista pero es loading de mutación) |
| `pages/Configuracion.tsx` | 210–211 | Solo spinner de mutación en botón | ✅ Sin query con loading propio → no aplica |
| `App.tsx` | 89, 128 | `<Suspense fallback={<LoadingSpinner message="Cargando…" />}>` (`py-12`, no full-height) | Fallback distinto al loading de página |
| `components/TrabajoForm.tsx` | 227–230 | Spinner `w-8` `py-12` en contenido del modal | Tamaño fuera de regla (debería ser `block` w-6) |
| `components/HorasTrabajoModal.tsx` | 136–139 | Spinner `w-6` `py-12` | ✅ Prácticamente `block`, falta aria |
| `components/MovimientosClienteModal.tsx` | 155–158 | Spinner `w-6` `py-12` | Ídem |
| `components/PasskeySection.tsx` | 81–85 | Spinner `w-4` + texto visible "Cargando passkeys..." (`mt-4`) | Tamaño/margin fuera de regla, sin aria |
| `components/PasskeyRegisterModal.tsx` | 75 | Spinner `w-5` **`--color-muted`** en estado `awaiting-native` ("Confirmá en tu dispositivo…") | Hallazgo agregado al integrar Q1: color fuera de regla (L4). **No es loading de query** (espera de UI nativa), pero sí spinner standalone → 1 línea: muted → accent |
| `components/LoadingSpinner.tsx` | todo | Spinner `w-8` `py-12` + label | Solo usado por Suspense; se reemplaza por `LoadingState` |
| Botones de mutación (12+ archivos) | — | `Loader2 w-3.5/w-4/w-5` + label "…" + disabled | ✅ Consistente → patrón documentado (L5), fuera de alcance |

### 2.3 Tabla de auditoría — EMPTY STATES

| Archivo | Líneas | Copy hoy | Problema |
|---|---|---|---|
| `pages/Trabajos.tsx` | 159–164 | "No hay trabajos para este cliente" (contextual, sin CTA) | Markup ad-hoc; sin CTA de creación |
| `pages/Trabajos.tsx` | 166–174 | "No hay trabajos" + "Crea uno desde un cliente" (sin CTA, tono "tú" vs voseo) | Sin CTA; copy inconsistente; **no distingue filtro activo** |
| `pages/Trabajos.tsx` | 186–191 | "No hay trabajos" (rama de filtro ≠ todos) | **Confunde filtro sin resultados con lista vacía** (E4 violado) |
| `pages/Presupuestos.tsx` | 136–148 | "No hay presupuestos para este cliente" / "No hay presupuestos" | Mismos problemas; ramas duplicadas |
| `pages/Clientes.tsx` | 159–164 | "No se encontraron clientes" **siempre** (aunque no haya búsqueda) | Copy de "búsqueda" usado como vacío por defecto; sin CTA; sin distinción (E4 violado) |
| `pages/Dashboard.tsx` | 230–241 | "Sin trabajos activos" + botón texto "Crear uno" | "Crear uno" navega a la lista (`/trabajos`), no crea → label engañoso. **Decidido (Q4):** relabel a **"Ver todos"** (key `empty.dashboard.verTodos`, copy: Copywriter); comportamiento (navigate) **sin cambio** — ya coincide con el botón "Ver todos" del header de la card (168–170) |
| `pages/Dashboard.tsx` | 321–332 | "Sin presupuestos pendientes" + "Crear uno" | Ídem Q4 (relabel; header "Ver todos" en 255–257) |
| `pages/ClienteDetalle.tsx` | 315, 340 | Secciones "Recientes" **se ocultan** si están vacías | **Decidido (Q2, contrario a la recomendación UX):** mostrarlas con `EmptyState contextual compact` en vez de ocultarlas |
| `pages/TrabajoDetalle.tsx` | 540–547 | "Sin fotos" dentro de `.card` + `ImageUpload` | Ad-hoc; la acción (subir) ya está visible debajo → caso `contextual` sin action |
| `components/HoursModal.tsx` | 196–200 | "No hay trabajos activos" **aunque el usuario haya buscado** (hay `search-input` en 156–174) | E4 violado: search ≠ vacío |
| `components/PresupuestoForm.tsx` | 422–428 | `search ? 'No se encontraron clientes' : 'No hay clientes registrados'` | ✅ **Único que respeta E4** → se toma como referencia |
| `components/TrabajoForm.tsx` | 493–495 | "No hay presupuestos disponibles para este cliente" | Ad-hoc, sin acción (contextual, aceptable) |
| `components/HorasTrabajoModal.tsx` | 140–143 | "No hay horas registradas" | Ad-hoc |
| `components/MovimientosClienteModal.tsx` | 166–169 | "No hay movimientos registrados" | Ad-hoc |
| `components/PasskeySection.tsx` | 90–95 | "Todavía no registraste ningún passkey." / "Tu navegador no soporta passkeys…" | Copy bueno, pero ad-hoc y sin CTA de registro |

---

## 3. Patrón LOADING — especificación

### 3.1 Matriz superficie → patrón

| Superficie | Patrón | Componente |
|---|---|---|
| Lista de cards (Trabajos, Presupuestos, Clientes) | Skeleton de cards | `SkeletonList` |
| Bloques de métricas (Dashboard hero, grid 2x2; Métricas) | Skeleton con forma de card | `SkeletonHero` / `SkeletonMetricGrid` |
| Página-detalle (Cliente/Trabajo/Presupuesto Detalle) + Suspense de rutas | Spinner full-page | `LoadingState variant="page"` |
| Contenido de modal reemplazado entero (TrabajoForm, HorasTrabajo, Movimientos) | Spinner de bloque | `LoadingState variant="block"` |
| Sección chica dentro de una card (Dashboard laterales, Perfil usuarios, Passkeys) | Spinner chico | `LoadingState variant="inline"` |
| Botón en mutación (Login, Eliminar, Aceptar…) | Spinner en botón | *sin componente: patrón L5 documentado* |

### 3.2 `LoadingState` — estructura HTML

```tsx
// src/components/LoadingState.tsx
type LoadingVariant = 'page' | 'block' | 'inline';

interface LoadingStateProps {
  variant: LoadingVariant;      // obligatorio: la elección debe ser consciente
  label?: string;               // default 'Cargando…'
  className?: string;
}
```

| `variant` | Contenedor (Tailwind) | Spinner | Label |
|---|---|---|---|
| `page` | `flex flex-col items-center justify-center min-h-screen px-4 pb-24 lg:pb-8` | `Loader2 w-8 h-8 animate-spin`, `color: var(--color-accent)` | **siempre sr-only** (default "Cargando…") |
| `block` | `flex flex-col items-center justify-center py-12` | `Loader2 w-6 h-6 animate-spin`, accent | **`label` presente ⇒ visible** (`text-sm`, `--color-muted`); sin `label` ⇒ sr-only (default "Cargando…") |
| `inline` | `flex flex-col items-center justify-center py-4 gap-2` | `Loader2 w-5 h-5 animate-spin`, accent | igual que `block` |

```html
<!-- Markup raíz (todas las variantes) -->
<div role="status" aria-live="polite" class="{clases de variante}" {className}>
  <svg aria-hidden="true" focusable="false" class="{tamaño} animate-spin" style="color: var(--color-accent)">…</svg>
  <span class="{label ? 'text-sm' : 'sr-only'}" style="color: var(--color-muted)">{label ?? 'Cargando…'}</span>
</div>
```

Reglas:
- El `Loader2` **nunca** lleva texto propio: la descripción va en el `<span>`.
- **Visibilidad del `label` (decisión C3 — regla dura, v1.2.0):** `label` presente ⇒ **visible**; sin `label` ⇒ **sr-only** con el default "Cargando…". Nunca se pasa `label` para ocultarlo. Mapping de #69 por instancia: `page` → sr-only (siempre) · `block` sin label (TrabajoForm, HorasTrabajoModal, MovimientosClienteModal) → sr-only · `inline` **con** label visible: `Perfil.tsx` "Cargando usuarios…" y `PasskeySection.tsx` "Cargando passkeys…" (**confirmado** la recomendación del Copywriter: hoy PasskeySection ya muestra texto visible → hacerlo `sr-only` sería regresión visual) · `inline` **sin** label: Dashboard laterales ×2 → sr-only. Verificación: **L-AC14**.
- `variant="page"` conserva exactamente las clases del loading actual de detalle (`min-h-screen pb-24 lg:pb-8 flex items-center justify-center`) → **cambio visual nulo** en las 3 páginas-detalle; solo se gana aria y la reutilización en Suspense.
- `prefers-reduced-motion`: el giro del spinner **se mantiene** (es la señal funcional de "trabajando", no es movimiento espacial decorativo; decisión documentada). Los skeletons sí se detienen (3.4).

### 3.3 `Skeleton` — estructura HTML

```tsx
// src/components/Skeleton.tsx  (exports: Skeleton, SkeletonList, SkeletonHero, SkeletonMetricGrid)
interface SkeletonListProps { count?: number; label: string; className?: string }  // count default 4
```

**`SkeletonList`** (reemplaza el `<section>` de contenido de las 3 listas):

```html
<div role="status" aria-live="polite" aria-busy="true" class="space-y-3 {className}">
  <span class="sr-only">{label}</span>   <!-- p. ej. "Cargando trabajos…" -->
  <!-- count ×: -->
  <div class="card" aria-hidden="true">
    <div class="flex items-start gap-3">
      <div class="skeleton w-12 h-12 rounded-full shrink-0"></div>
      <div class="flex-1 space-y-2">
        <div class="skeleton h-4 w-2/3 rounded"></div>
        <div class="skeleton h-3 w-1/2 rounded"></div>
        <div class="skeleton h-3 w-1/3 rounded"></div>
      </div>
    </div>
  </div>
</div>
```

Justificación de la forma: los 3 tipos de item de lista (TrabajoCard, ClienteListItem, card de presupuesto) son todos una card con avatar/icono + 2–3 líneas de texto → una forma genérica los representa a los tres sin adivinar.

**`SkeletonHero`** (Dashboard 93–99 / Métricas): `.card !p-5` con `skeleton h-3 w-28 rounded` (label), `skeleton h-8 w-44 rounded` (valor) y fila de 2 × `skeleton h-3 w-20 rounded` (sublabels "Este mes"/"Mes anterior").

**`SkeletonMetricGrid`** (Dashboard 123–132 / Métricas): `grid grid-cols-2 gap-2 lg:grid-cols-4` con 4 × `.card !p-3` → `skeleton h-3 w-16 rounded` + `skeleton h-6 w-24 rounded mt-2`.

Ambos envueltos en `role="status" aria-live="polite" aria-busy="true"` + sr-only "Cargando métricas…"; todo el interior `aria-hidden="true"`.

### 3.4 CSS a agregar en `Frontend/src/index.css`

```css
/* Skeletons (issues #69/#68 — loading states) */
.skeleton {
  background-color: var(--color-surface);
  position: relative;
  overflow: hidden;
  display: block;
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--color-text) 8%, transparent) 50%,
    transparent 100%
  );
  animation: skeleton-shimmer 1.6s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  100% { transform: translateX(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton::after { animation: none; }
}
```

Notas de implementación (ojo con estos 2 detalles):
- **`.skeleton` NO define `border-radius`**: el redondeo va siempre con utilities Tailwind (`rounded` / `rounded-full` en el avatar). Como `index.css` se define *después* del `@import "tailwindcss"`, una regla propia ganaría por orden sobre `.rounded-full` y rompería el avatar.
- **`color-mix(in srgb, var(--color-text) 8%, transparent)`** hace que el shimmer sea visible tanto en tema oscuro (barrido claro) como en `[data-theme="claro"]` (barrido oscuro). No usar `rgba(255,255,255,…)`, que es invisible en tema claro.
- La app tiene 2 temas (`index.css:4–37`): todos los tokens de esta spec son `var(--color-*)` → ambos temas quedan cubiertos.

---

## 4. Patrón EMPTY — especificación

### 4.1 Contrato de componentes

**Archivo: `Frontend/src/components/EmptyState.tsx` (evolución del existente — 0 usos actuales, contrato libre de breaking changes).**

```tsx
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type Action = { label: string; onClick: () => void; icon?: LucideIcon };

type EmptyStatePropsBase = {
  icon: LucideIcon;          // obligatorio, Lucide (sin emojis, sin SVG propios)
  title: string;             // --color-text, font-medium
  description?: string;      // --color-muted
  size?: 'default' | 'compact';   // default: 'default'
  children?: ReactNode;      // slot extra (p. ej. ImageUpload bajo "Sin fotos")
};

type EmptyStateProps = EmptyStatePropsBase &
  (
    | { variant?: 'default'; action?: Action; secondaryAction?: never }       // lista vacía real → CTA crear
    | { variant: 'no-results'; action?: never; secondaryAction: Action }      // filtro/búsqueda → limpiar (obligatorio)
    | { variant: 'contextual'; action?: Action; secondaryAction?: never }     // vacío propio de un recurso/segmento
  );
```

Reglas duras:
- `no-results` **no acepta `action`** (el union type lo impide): jamás se ofrece "Crear" cuando el problema es el filtro (E3/E4).
- `secondaryAction` es **obligatorio** en `no-results`: no existe pantalla "sin resultados" sin salida.
- **Decisión C2 (v1.2.0): el type NO se relaja — `PresupuestoForm` sí lleva `secondaryAction`.** Se acepta la recomendación del Copywriter ("Limpiar búsqueda") en vez de aflojar el union type, porque (a) el type es la encodeación del principio E3/E4: relajarlo haría la API más débil que el principio y abriría la puerta a futuros `no-results` sin salida, y (b) el `no-results` de `PresupuestoForm` solo aparece cuando `search ≠ ''` (línea 425) → "Limpiar búsqueda" es semánticamente exacto y la superficie ya tiene el mecanismo (el `search-input`). Costo: 1 handler (`setSearch('')` + foco de vuelta al input). Efecto: tablas **5.2** y **6.3** actualizadas, **E-AC15** extendida. Cero churn para los otros 6 usuarios de `no-results`.
- La elección de variante la resuelve la página con la **regla E4** (no el componente).

### 4.2 Markup y dimensiones

```html
<!-- size="default" (página) -->
<div role="status" aria-live="polite" class="card text-center py-10 px-6 {className}">
  <Icon aria-hidden="true" focusable="false" class="w-12 h-12 mx-auto mb-3" style="color: var(--color-muted)" />
  <p class="text-base font-medium" style="color: var(--color-text)">{title}</p>
  <p class="text-sm mt-1" style="color: var(--color-muted)">{description}</p>

  <!-- default/contextual: CTA primario -->
  <button type="button" class="btn-primary mt-4">{action.label}</button>

  <!-- no-results: acción secundaria (btn-secondary) -->
  <button type="button" class="btn-secondary mt-4">{secondaryAction.label}</button>
</div>
```

```html
<!-- size="compact" (dentro de otra card o modal — NUNCA card dentro de card) -->
<div role="status" aria-live="polite" class="text-center py-6 {className}">
  <Icon aria-hidden="true" class="w-8 h-8 mx-auto mb-2" style="color: var(--color-muted)" />
  <p class="text-sm font-medium" style="color: var(--color-text)">{title}</p>
  <p class="text-xs mt-1" style="color: var(--color-muted)">{description}</p>
  <button type="button" class="text-sm font-medium mt-1.5 hover:bg-[var(--color-hover)] px-2 py-1 rounded-lg transition-colors duration-200" style="color: var(--color-accent)">
    {action.label}
  </button>
</div>
```

- El action-link de `compact` es exactamente el botón "Ver todos" que Dashboard ya usa hoy (líneas 170/257; el empty de lado pasa de "Crear uno" a "Ver todos" por Q4) → continuidad visual.
- `size="default"` **siempre** lleva `.card` (ocupa el slot que ocuparía el primer item de la lista); `size="compact"` **nunca** (evita card-in-card).
- **Jerarquía:** título `--color-text` > descripción `--color-muted` > acción en accent/botón. El icono va sin `opacity` (el `0.5` actual se elimina).
- Iconos obligatoriamente `aria-hidden="true" focusable="false"` (decorativos: el mensaje lo carga el texto).

### 4.3 Accesibilidad y foco

- `role="status"` + `aria-live="polite"` → al reemplazar el skeleton por el empty, el lector anuncia el `title` sin robar el foco.
- Los `action`/`secondaryAction` son `<button>` reales (tabulables, con foco visible heredado de `.btn-primary`/`.btn-secondary`).
- **Foco tras limpiar (criterio de aceptación):** al clickear `secondaryAction`, la página limpia estado **y devuelve el foco al control** (input de búsqueda en Clientes; pill "Todos" en Trabajos/Presupuestos). Sin esto, el foco cae a `<body>` y el usuario de teclado pierde su lugar.
- Contraste: verificado en E-AC8; QA lo re-verifica en ambos temas con DevTools.

---

## 5. Variantes por página/componente (estructura de UX — el texto final vive en el copy doc)

> ✅ **Copy final aprobado en `docs/design-system/loading-empty-states-copy.md` (E-AC10 satisfecha).** Ese documento **prevalece** sobre cualquier string de esta sección: títulos, descripciones y labels se toman de ahí, textual. En **v1.2.0** las tablas de abajo se alinearon al copy final (ya no hay placeholders): si en el futuro divergen, manda el copy doc. Los matchers de los AC de la sección 8 usan este mismo copy.
>
> **Casing unificado (conflicto C1, integrado en v1.2.0):** CTA de creación en **Title Case** — "Crear Trabajo" / "Crear Presupuesto" / "Crear Cliente" (consistente con FAB, forms y tests existentes) — y acciones secundarias en sentence case — "Quitar filtro", "Limpiar búsqueda", "Ver todos". El casing minúscula anterior quedó corregido en las tablas de abajo y en E-AC7/E-AC14.

### 5.1 Variantes por página (#68)

| Superficie | Variante | Title | Description | Action | secondaryAction |
|---|---|---|---|---|---|
| Trabajos (global) | `default` | Todavía no hay trabajos | Creá el primer trabajo para empezar a llevar el registro del taller. | **Crear Trabajo** → `setShowTrabajoForm(true)` | — |
| Trabajos `?cliente=X` | `contextual` | Este cliente todavía no tiene trabajos | Creá el primer trabajo para este cliente. | **Crear Trabajo** → `setTrabajoFormClienteInicial(clienteId)` + `setShowTrabajoForm(true)` — **cliente preseleccionado** (mecánica 6.5.1, decide Q3) | — |
| Trabajos (filtro ≠ todos, >0 items) | `no-results` | No hay trabajos con este filtro | Volvé a "Todos" o probá con otro filtro. | — | **Quitar filtro** → `setFilter('todos')` |
| Presupuestos (global) | `default` | Todavía no hay presupuestos | Creá el primer presupuesto para enviarle una cotización a un cliente. | **Crear Presupuesto** → `setShowPresupuestoForm(true)` | — |
| Presupuestos `?cliente=X` | `contextual` | Este cliente todavía no tiene presupuestos | Creá un presupuesto para cotizarle un trabajo. | **Crear Presupuesto** → `setPresupuestoFormClienteInicial(clienteId)` + `setShowPresupuestoForm(true)` — **cliente preseleccionado** (mecánica 6.5.2, decide Q3b) | — |
| Presupuestos (filtro ≠ todos, >0 items) | `no-results` | No hay presupuestos con este filtro | Volvé a "Todos" o probá con otro filtro. | — | **Quitar filtro** → `setFilter('todos')` |
| Clientes (sin búsqueda ni filtro) | `default` | Todavía no hay clientes | Creá un cliente para registrar sus trabajos y presupuestos. | **Crear Cliente** → `setShowClienteForm(true)` | — |
| Clientes (con búsqueda y/o filtro "con deuda", >0 items) | `no-results` | No se encontraron clientes | Revisá lo que escribiste o quitá los filtros. | — | **Limpiar búsqueda y filtros** → `setSearch('')` + `setFilter('todos')` + foco al input |
| Dashboard "Trabajos activos" | `contextual` `compact` | Sin trabajos activos | — | **Ver todos** — key `empty.dashboard.verTodos` (copy final) → `navigate('/trabajos')`. **Comportamiento sin cambio** (decide Q4): mismo label y destino que el "Ver todos" del header (168–170) | — |
| Dashboard "Presupuestos pendientes" | `contextual` `compact` | Sin presupuestos pendientes | — | **Ver todos** — key `empty.dashboard.verTodos` (copy final) → `navigate('/presupuestos')` (header 255–257) | — |
| ClienteDetalle "Trabajos Recientes" | `contextual` `compact` | Sin trabajos todavía | — | — (decide Q2: se muestra la sección con su header; la FAB de la página ofrece crear) | — |
| ClienteDetalle "Presupuestos Recientes" | `contextual` `compact` | Sin presupuestos todavía | — | — (ídem Q2) | — |

### 5.2 Variantes por componente (#68 — alcance P1, decide Q1)

| Superficie | Variante | Title | Action |
|---|---|---|---|
| `HoursModal` (tiene search) | `no-results` si `search ≠ ''` / `default` si no | No hay trabajos activos con esa búsqueda / Sin trabajos activos | secondary: **Limpiar búsqueda** |
| `HorasTrabajoModal` | `contextual` `compact` | No hay horas registradas | — |
| `MovimientosClienteModal` | `contextual` `compact` | No hay movimientos registrados | — |
| `PresupuestoForm` (selector de cliente) | `default` si `search=''` / `no-results` si `search≠''` (ya cumple E4 → solo migrar a `EmptyState`) | No hay clientes registrados / No se encontraron clientes | — (default) · secondary: **Limpiar búsqueda** → `setSearch('')` + foco de vuelta al input (**C2: aceptada la recomendación Copy** — ver 4.1) |
| `TrabajoForm` (presupuestos del cliente) | `contextual` `compact` | No hay presupuestos disponibles para este cliente | — |
| `TrabajoDetalle` (fotos) | `contextual` `compact` + `children={<ImageUpload/>}` | Sin fotos todavía | — (la acción visible debajo) |
| `PasskeySection` | `contextual` `compact` | Todavía no registraste ningún passkey | **Registrar passkey** (reutiliza el `+` actual) — si el navegador no soporta: `description` "Tu navegador no soporta passkeys. Probá con otro dispositivo o navegador." y sin action |

---

## 6. Contrato de implementación

### 6.1 Archivos nuevos/modificados

| Archivo | Acción |
|---|---|
| `src/components/LoadingState.tsx` | **NUEVO** — spinner `page`/`block`/`inline` (sección 3.2) |
| `src/components/Skeleton.tsx` | **NUEVO** — `Skeleton`, `SkeletonList`, `SkeletonHero`, `SkeletonMetricGrid` (sección 3.3) |
| `src/components/EmptyState.tsx` | **MODIFICADO** — nuevo contrato de props (sección 4.1). Hoy tiene 0 usos → sin breaking changes |
| `src/components/LoadingSpinner.tsx` | **ELIMINADO en #69** tras migrar sus 2 usos de `App.tsx` (grep 0 antes de borrar) |
| `src/store/index.ts` | **MODIFICADO en #68** — + campos `trabajoFormClienteInicial` (6.5.1) y `presupuestoFormClienteInicial` (6.5.2). Nada más |
| `src/index.css` | **MODIFICADO** — + bloque `.skeleton` (sección 3.4). Nada más |
| Páginas/componentes de tabla 6.2/6.3 | **MODIFICADOS** — solo su bloque de loading/empty |

### 6.2 Tabla página → patrón (#69 LOADING)

| Página | Patrón | Reemplaza (líneas actuales) | Cambio visible |
|---|---|---|---|
| `Trabajos.tsx` | `SkeletonList count={4} label="Cargando trabajos…"` dentro de `<section>`, **eliminando el early return de isLoading** | 45–51 | Header + pills **permanecen**; los conteos `(n)` se ocultan mientras `isLoading` (evita flash "(0)") |
| `Presupuestos.tsx` | `SkeletonList count={4} label="Cargando presupuestos…"` en `<section>`, sin early return | 54–60 | Header + pills permanecen; conteos ocultos en loading |
| `Clientes.tsx` | `SkeletonList count={4} label="Cargando clientes…"` en `<section>`, sin early return | 90–96 | Header + search + pills permanecen |
| `ClienteDetalle.tsx` | `<LoadingState variant="page" />` (early return) | 96–102 | Nulo (mismas clases) + aria |
| `TrabajoDetalle.tsx` | `<LoadingState variant="page" />` | 286–292 | Nulo + aria |
| `PresupuestoDetalle.tsx` | `<LoadingState variant="page" />` | 168–174 | Nulo + aria (mantiene `.animate-spin` → test vigente pasa) |
| `Dashboard.tsx` hero | `<SkeletonHero />` | 93–99 | Spinner → skeleton con forma de card |
| `Dashboard.tsx` grid | `<SkeletonMetricGrid />` | 123–132 | 4 spinners → 4 skeletons |
| `Dashboard.tsx` laterales ×2 | `<LoadingState variant="inline" />` (**sin `label`** → sr-only "Cargando…", L1) | 174–177, 261–264 | Nulo + aria |
| `Metricas.tsx` | `<SkeletonHero /> + <SkeletonMetricGrid />` dentro del wrapper existante | 153–169 | Spinner → skeletons |
| `Perfil.tsx` | `<LoadingState variant="inline" label="Cargando usuarios…" />` | 408–411 | Color muted → accent + aria + label visible |
| `App.tsx` Suspense ×2 | `<LoadingState variant="page" />`; **borrar** `LoadingSpinner.tsx` | 89, 128 | Fallback pasa a full-height |
| `TrabajoForm.tsx` | `<LoadingState variant="block" />` (sin `label` → sr-only) | 227–230 | w-8 → w-6 + aria |
| `HorasTrabajoModal.tsx` | `<LoadingState variant="block" />` (sin `label` → sr-only) | 136–139 | Solo aria |
| `MovimientosClienteModal.tsx` | `<LoadingState variant="block" />` (sin `label` → sr-only) | 155–158 | Solo aria |
| `PasskeySection.tsx` | `<LoadingState variant="inline" label="Cargando passkeys…" />` (**`label` visible**, C3 — hoy ya es visible) | 81–85 | w-4 → w-5 + aria + elipsis `...` → `…` |
| `PasskeyRegisterModal.tsx` | Spinner de `awaiting-native` (75): solo color `--color-muted` → `--color-accent` (L4) | 75 | Solo color (hallazgo al integrar Q1; ver 2.2) |
| `Metricas.tsx` (`isLoadingPeriodos`) | + `<span role="status" class="sr-only">Cargando períodos disponibles…</span>` junto al selector deshabilitado | 54, 146 | Solo aria (incluido porque es 1 línea) |
| `Login.tsx`, botones de mutación (12 archivos), `Configuracion.tsx` | **SIN CAMBIOS** (L5) | — | — |

> **Alcance (Q1):** todas las filas en alcance de #69 — páginas (P0) **y** modales/componentes (P1) en el mismo issue — salvo la fila "SIN CAMBIOS (L5)".

**Markup de los pills — ocultar conteos durante loading (Q5, L-AC3):** en `Trabajos.tsx:96–98` y `Presupuestos.tsx:100–102` (misma estructura en ambas; `isLoading` ya existe en el scope, `Trabajos.tsx:20`):

```tsx
<button
  key={f.key}
  onClick={() => setFilter(f.key)}
  className={clsx('filter-pill', filter === f.key && 'active')}
>
  {f.label}
  {!isLoading && ` (${counts[f.key]})`}   {/* ← conteo solo cuando hay datos: sin flash "(0)" */}
</button>
```

`Clientes.tsx` **no aplica**: sus pills (140–144) no muestran conteo.

### 6.3 Tabla página → patrón (#68 EMPTY)

| Página/componente | Patrón (variante · size) | Reemplaza | Regla E4 aplicada |
|---|---|---|---|
| `Trabajos.tsx` | 3 `EmptyState`: `default` global / `contextual` con `?cliente=` / `no-results` con filtro | 159–174, 186–191 | `trabajos.length===0` → default|contextual (aunque filtro activo); `trabajos.length>0 && filtered.length===0` → no-results |
| `Presupuestos.tsx` | 3 `EmptyState` (mismo espejo) | 136–148 | idem con `presupuestos` |
| `Clientes.tsx` | 2 `EmptyState`: `default` / `no-results` (search≠'' o `conDeuda`) | 159–164 | `clientes.length===0` → default; `>0 && filtered.length===0` → no-results |
| `Dashboard.tsx` laterales ×2 | `EmptyState variant="contextual" size="compact"` | 230–241, 321–332 | Sin search/filtro → siempre contextual |
| `ClienteDetalle.tsx` recientes ×2 | `EmptyState variant="contextual" size="compact"` — la sección **siempre se muestra** con su header (`hasTrabajos`/`hasPresupuestos` solo condiciona la lista) | 315–338, 340–364 | Sin search/filtro → siempre contextual (decide Q2) |
| `HoursModal.tsx` | `no-results` si `search ≠ ''` / `default` si no | 196–200 | `trabajosActivos.length===0` → default (aunque search); `>0 && filtered===0` → no-results |
| `HorasTrabajoModal.tsx` | `contextual` `compact` | 140–143 | — |
| `MovimientosClienteModal.tsx` | `contextual` `compact` | 166–169 | — |
| `PresupuestoForm.tsx` (selector de cliente) | migrar a `EmptyState`: `no-results` **con `secondaryAction` "Limpiar búsqueda"** (C2) / `default` sin acción | 422–428 | Ya cumple E4 (única referencia): `no-results` solo con `search≠''` (línea 425) → la acción es exacta |
| `TrabajoForm.tsx` (presupuestos del cliente) | `contextual` `compact` | 493–495 | — |
| `TrabajoDetalle.tsx` "Sin fotos" | `contextual` `compact` + `children={<ImageUpload/>}` | 540–547 | — |
| `PasskeySection.tsx` | `contextual` `compact` | 90–95 | — (sin action cuando el navegador no soporta) |

> **Alcance (Q1):** las 7 filas de componentes + la fila de ClienteDetalle de la tabla 6.3 están en alcance de #68 (antes marcadas "P1 — ver Q1").

### 6.4 Dependencias entre issues

- **#69 se mergea primero.** #68 toca los mismos bloques de `Trabajos/Presupuestos/Clientes` (la rama de contenido del `<section>` que #69 envuelve con skeleton) → el subagente de #68 parte del código post-#69.
- `EmptyState` no se usa en #69 y `LoadingState/Skeleton` no se usan en #68: los PRs no compiten por los mismos componentes, solo por el alrededor en 3 páginas.
- #68 (con Q1) **sí** toca `Dashboard.tsx` (copy Q4), `store/index.ts` + `TrabajoForm.tsx` (preselección, 6.5.1) + `PresupuestoForm.tsx` (preselección, 6.5.2 — además es fila P1 de 6.3) y los 7 componentes P1 de la tabla 6.3 — ninguno de esos archivos lo toca #69 salvo `PasskeySection/TrabajoForm/HorasTrabajoModal/MovimientosClienteModal` (bloques de loading ≠ bloques de empty).

### 6.5 Preselección de cliente desde empty contextual (decide Q3 + Q3b, alcance #68)

**Mecanismo base (ambos forms): Zustand store — NO prop.** Justificación: la instancia que abre el CTA es la **global** montada en `App.tsx:99–100`, que se abre con los flags `showPresupuestoForm` / `showTrabajoForm` del store; una prop del CTA (que vive en la página) no puede alcanzarla. Las instancias inline (`TrabajoDetalle.tsx:885`, `PresupuestoDetalle.tsx:478/488`) son modo edición/duplicado y no aplican (guards en cada subsección). Regla común: el campo del store solo se setea **inmediatamente antes** de abrir el form, nunca suelto.

#### 6.5.1 `TrabajoForm` (Q3)

**1. Store (`src/store/index.ts`)** — 3 líneas, siguiendo el patrón existente de `showTrabajoForm` (interface ~línea 18, defaults ~línea 60, setter ~línea 87):

```ts
// interface
trabajoFormClienteInicial: number | null;
setTrabajoFormClienteInicial: (clienteId: number | null) => void;

// default
trabajoFormClienteInicial: null,          // null = SIN preselección (es el default)

// setter
setTrabajoFormClienteInicial: (clienteId) => set({ trabajoFormClienteInicial: clienteId }),
```

**2. Quién la pasa — `Trabajos.tsx`, solo en la rama contextual** (`clienteId !== undefined`, líneas 12–14), en el `onClick` del `action` del `EmptyState`:

```ts
const handleCrearTrabajoContextual = () => {
  setTrabajoFormClienteInicial(clienteId);   // number: en esta rama clienteId está definido
  setShowTrabajoForm(true);                  // set + open en el mismo handler (batch de React)
};
```

El CTA **global** (sin `?cliente=`) sigue siendo solo `setShowTrabajoForm(true)` → default sin preselección.

**3. Quién la consume — `TrabajoForm.tsx`, efecto al abrir** (NO el initializer de `useState`: la instancia global ya está montada al arrancar la app, su initializer corrió una sola vez con `null`):

```ts
/* eslint-disable react-hooks/set-state-in-effect */   // mismo par que usa el efecto de edición (líneas 47–57)
// Preselección desde empty contextual (?cliente=) — issue #68 (Q3)
useEffect(() => {
  if (!isOpen || isEditing) return;                    // edición: manda trabajoOriginal, no aplica
  const inicial = useStore.getState().trabajoFormClienteInicial;
  if (inicial !== null) {
    setClienteId(inicial);
    useStore.getState().setTrabajoFormClienteInicial(null);  // consumir UNA sola vez
  }
}, [isOpen, isEditing]);
/* eslint-enable react-hooks/set-state-in-effect */
```

**4. Garantías que debe verificar QA:**

| Escenario | Resultado esperado |
|---|---|
| CTA desde `Trabajos?cliente=X` (empty contextual) | Form abierto con el cliente ya seleccionado; `usePresupuestosPorCliente(clienteId)` se dispara solo (TrabajoForm.tsx:65) |
| FAB / CTA global (sin `?cliente=`) | **Sin** preselección (`clienteId` null) |
| Reabrir el form después de usar la preselección | Sin cliente stale (el valor se **consumió** al abrir) |
| Cerrar sin crear y reabrir | `onCloseCallback` (líneas 76–87) ya resetea `clienteId` a `null` → doble protección |
| Editar trabajo existente (instancia inline de TrabajoDetalle) | Manda `trabajoOriginal.clienteId` (guard `isEditing`) |
| Validación | `validate()` (línea 134) pide cliente → con preselección ya pasa |

#### 6.5.2 `PresupuestoForm` (Q3b)

**Por qué es más complejo que 6.5.1** (3 diferencias — documentado para que Frontend no improvise):

1. **No guarda un id, guarda un objeto:** `clienteSeleccionado: Cliente | null` (línea 45) → hay que resolver el objeto desde la lista de `useClientes()` (línea 38: `const { data: clientes = [] }`).
2. **Es un wizard de 2 pasos:** `step: 'cliente' | 'datos'` arranca en `'cliente'` (línea 44) → hay que saltar a `'datos'` (mismo efecto que `handleSelectCliente`, líneas 169–172), donde queda el resumen "Cliente seleccionado" con el botón `Cambiar` (444–453) para volver al selector.
3. **La lista de clientes puede no estar cargada al abrir** (cache fría: navegación directa a `/presupuestos?cliente=X`) → **no cabe en un solo efecto**: consumir el store sin encontrar el objeto perdería la preselección; no consumir hasta poder resolverla dejaría el valor en el store si el id nunca existe → aplicaría **stale** en una apertura futura. Por eso: **2 fases con pendiente local**.

**1. Store (`src/store/index.ts`)** — patrón idéntico a 6.5.1 (mismas líneas de referencia):

```ts
// interface
presupuestoFormClienteInicial: number | null;
setPresupuestoFormClienteInicial: (clienteId: number | null) => void;

// default
presupuestoFormClienteInicial: null,        // null = SIN preselección (es el default)

// setter
setPresupuestoFormClienteInicial: (clienteId) => set({ presupuestoFormClienteInicial: clienteId }),
```

**2. Quién la pasa — `Presupuestos.tsx`** (hoy **no** importa `useStore` → sumarlo), solo en la rama contextual (`clienteId !== undefined`, líneas 13–15), en el `onClick` del `action` del `EmptyState`:

```ts
const handleCrearPresupuestoContextual = () => {
  setPresupuestoFormClienteInicial(clienteId);   // number: en esta rama clienteId está definido
  setShowPresupuestoForm(true);                  // la instancia global (App.tsx:99) abre
};
```

El CTA **global** (FAB: `App.tsx:78–79`, y el `default` de 5.1) sigue siendo solo `setShowPresupuestoForm(true)` → sin preselección.

**3. Quién la consume — `PresupuestoForm.tsx`, estado local + 2 efectos** (NO el initializer de `useState`: la instancia global ya está montada al arrancar la app). El estado nuevo va junto a `step`/`clienteSeleccionado`/`search` (líneas 44–46):

```ts
const [clienteInicial, setClienteInicial] = useState<number | null>(null);

/* eslint-disable react-hooks/set-state-in-effect */   // mismo par que usan los efectos de edición/duplicado (90–105, 110–125)
// Fase 1: capturar y consumir el valor del store al abrir (UNA sola vez)
useEffect(() => {
  if (!isOpen || isEditing || esDuplicado) return;      // edición/duplicado: manda presupuestoOriginal / presupuestoDuplicado
  const inicial = useStore.getState().presupuestoFormClienteInicial;
  if (inicial !== null) {
    setClienteInicial(inicial);
    useStore.getState().setPresupuestoFormClienteInicial(null);  // consumir: el store nunca retiene el valor
  }
}, [isOpen, isEditing, esDuplicado]);

// Fase 2: resolver el objeto Cliente y saltar a 'datos' cuando la lista esté disponible
useEffect(() => {
  if (!isOpen) { setClienteInicial(null); return; }     // al cerrar: limpiar pendiente (anti-stale)
  if (clienteInicial === null) return;
  const encontrado = clientes.find((c) => c.id === clienteInicial);
  if (!encontrado) return;                             // lista aún no cargó → re-intenta cuando `clientes` cambie
  setClienteSeleccionado(encontrado);
  setStep('datos');
  setClienteInicial(null);                             // aplicar UNA sola vez
}, [isOpen, clientes, clienteInicial]);
/* eslint-enable react-hooks/set-state-in-effect */
```

**Orden de efectos (por qué no hay carreras):** fase 1 está declarada **antes** que fase 2 → en el commit de apertura fase 2 ve el `clienteInicial` viejo (`null`, limpiado al cerrar en la apertura anterior) y no hace nada; la resolución corre en el re-render siguiente, cuando fase 1 ya seteó el pendiente.

**Limpieza al cerrar:** `handleClose` (líneas 137–150) ya resetea `step='cliente'`, `clienteSeleccionado=null` y `search=''`; el efecto 2 agrega la limpieza del pendiente → doble protección (mismo argumento que la tabla de 6.5.1).

**4. Garantías que debe verificar QA:**

| Escenario | Resultado esperado |
|---|---|
| CTA desde `Presupuestos?cliente=X` (empty contextual) | Form abierto en `step='datos'` con `clienteSeleccionado` = objeto de ese cliente; `Cambiar` (444–453) vuelve al selector |
| FAB / CTA default (sin `?cliente=`) | `step='cliente'`, **sin** preselección |
| Clientes con query en curso (cache fría) | Fase 2 aplica cuando `clientes` resuelve: sin perder el valor ni aplicarlo doble |
| Id de cliente inexistente | Fallback a `step='cliente'` (comportamiento actual), sin bloqueo; el pendiente se limpia al cerrar |
| Reabrir después de usar la preselección | Sin stale: valor consumido en fase 1 + pendiente limpiado al cerrar |
| Editar presupuesto (inline de `PresupuestoDetalle`: `editingPresupuestoId` → prop `presupuestoId`) | Guard `isEditing` → manda `presupuestoOriginal.cliente` (89–106) |
| Duplicar presupuesto (`presupuestoDuplicadoId`) | Guard `esDuplicado` → manda `presupuestoDuplicado.cliente` (109–126) |
| Validación | `validate()` (177) pide `clienteSeleccionado` → con preselección ya pasa |

---

## 7. Criterios de aceptación — Issue #69 (LOADING) · QA

| # | Criterio | Cómo verificarlo |
|---|---|---|
| L-AC1 | Trabajos, Presupuestos y Clientes **no hacen early return por `isLoading`**: header, filtros (y search en Clientes) permanecen en el DOM durante la carga | DevTools: throttling "Slow 3G", cargar la lista → header visible con spinner/skeleton debajo |
| L-AC2 | Durante la carga de una lista se ve `SkeletonList` (cards grises con shimmer), **no** un spinner centrado full-screen | Inspección visual + `getByRole('status')` contiene el label de carga |
| L-AC3 | En **Trabajos y Presupuestos** no se muestra "(0)" en los pills durante la carga: el conteo se renderiza solo cuando `!isLoading` (markup en 6.2 — Q5). Clientes no aplica (sus pills no tienen conteo) | Throttling → los pills muestran label sin conteo hasta que llegan datos; `grep -n "!isLoading &&" Frontend/src/pages/Trabajos.tsx Frontend/src/pages/Presupuestos.tsx` → 1 resultado por archivo |
| L-AC4 | Detalle (Cliente/Trabajo/Presupuesto), Suspense de rutas y modales usan `LoadingState`; ninguna página importa `Loader2` para estados de query | `grep -n "Loader2" Frontend/src/pages/Trabajos.tsx Frontend/src/pages/Presupuestos.tsx Frontend/src/pages/Clientes.tsx Frontend/src/pages/Metricas.tsx` → **0 resultados**. En páginas-detalle: `grep -n "animate-spin" …/ClienteDetalle.tsx` → **0** (el spinner vive en `LoadingState`) |
| L-AC5 | Cada estado de carga es anunciado: existe exactamente un `[role="status"]` con texto de carga por superficie y `aria-busy="true"` en los contenedores de skeleton | `getByRole('status')` en tests; lector de pantalla (NVDA/VoiceOver) anuncia "Cargando trabajos…" al navegar |
| L-AC6 | Los spinners standalone son `w-8`/`w-6`/`w-5` con `color: var(--color-accent)`; no queda ningún spinner `--color-muted` fuera de botones | `grep -rn "animate-spin" Frontend/src \| grep muted` → 0 |
| L-AC7 | Con `prefers-reduced-motion: reduce` activo, el shimmer de `.skeleton` **no se anima**; el resto de la UI no se rompe | DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion" → barrido estático |
| L-AC8 | Sin salto de layout al terminar la carga en Dashboard y Métricas (skeleton tiene la forma final: hero card + grid 2x2/4 cols) | Throttling: comparar posición del hero antes/después de llegar datos |
| L-AC9 | **Sin regresiones**: `npm run test` y `npm run build` en `Frontend/` pasan; específicamente `PresupuestoDetalle.test.tsx:246` (`.animate-spin`) y `Dashboard.test.tsx:118` (isLoading sin hero/grid) | `cd Frontend && npm run test && npm run build` |
| L-AC10 | `LoadingSpinner.tsx` eliminado y `grep -rn "LoadingSpinner" Frontend/src` → 0 | grep |
| L-AC11 | Botones de mutación intactos: Login "Ingresando…", "Eliminando…", "Aceptando…" etc. con su spinner y `disabled` originales | Comparación visual / grep de no-cambios en esas líneas |
| L-AC12 | Cero dependencias nuevas (`package.json` sin diffs) y cero emojis/SVG propios (solo Lucide) | `git diff package.json` vacío; revisión de código |
| L-AC13 | **Alcance P1 (Q1):** los loading de contenido de `components/` de la tabla 6.2 usan `LoadingState` (`block`/`inline`): `TrabajoForm.tsx:227–230`, `HorasTrabajoModal.tsx:136–139`, `MovimientosClienteModal.tsx:155–158`, `PasskeySection.tsx:81–85`. Los `animate-spin` restantes en `components/` son solo mutaciones/botones (L5) o el spinner `awaiting-native` de `PasskeyRegisterModal` ya en accent (2.2) | `grep -n "animate-spin" Frontend/src/components/*.tsx` → esos 4 bloques ya **no** aparecen (los matches restantes de esos archivos son solo líneas de botón; `PasskeySection` queda en 0); `grep -rn "animate-spin" Frontend/src \| grep muted` → **0** |
| L-AC14 | **Visibilidad del `label` (decisión C3, regla en 3.2):** `label` presente ⇒ **visible** solo en `Perfil.tsx` ("Cargando usuarios…") y `PasskeySection.tsx` ("Cargando passkeys…"); el resto de `block`/`inline` (Dashboard laterales ×2, TrabajoForm, HorasTrabajoModal, MovimientosClienteModal) corre **sin `label`** → sr-only "Cargando…". En PasskeySection el texto sigue visible como hoy (sin regresión visual) y con elipsis `…` | `grep -n "label=" Frontend/src/pages/Perfil.tsx Frontend/src/components/PasskeySection.tsx` → exactamente 1 por archivo; `grep -n "label=" Frontend/src/pages/Dashboard.tsx Frontend/src/components/TrabajoForm.tsx Frontend/src/components/HorasTrabajoModal.tsx Frontend/src/components/MovimientosClienteModal.tsx` → **0**; inspección visual: el texto solo se ve en Perfil y Passkeys |

## 8. Criterios de aceptación — Issue #68 (EMPTY) · QA

| # | Criterio | Cómo verificarlo |
|---|---|---|
| E-AC1 | Toda lista vacía de Trabajos/Presupuestos/Clientes renderiza `<EmptyState>`; **cero** bloques `<div className="text-center py-12">` + `<p style…>` ad-hoc en `pages/` | `grep -n "text-center py-12" Frontend/src/pages/*.tsx` → 0 |
| E-AC2 | **Distinción vacío vs. sin resultados:** con datos cargados y filtro/búsqueda activos que no matchean → variante `no-results` **sin** CTA de creación y **con** "Limpiar…"; con la lista realmente vacía → variante `default`/`contextual` **con** CTA de creación | QA funcional en las 3 listas: poblar datos → filtrar a 0 → verificar variantes; vaciar la base → verificar CTA |
| E-AC3 | "Limpiar…" restaura la lista **y el foco del teclado no cae a `<body>`** (va al search de Clientes / `HoursModal` / `PresupuestoForm` o a la pill "Todos" de Trabajos/Presupuestos) | Test con teclado: Tab hasta el botón, Enter, verificar `document.activeElement` |
| E-AC4 | Los CTA de creación de Trabajos/Presupuestos/Clientes abren el modal correspondiente (`setShowTrabajoForm` / `setShowClienteForm` / `setShowPresupuestoForm`). **Dashboard es la excepción decidida (Q4):** sus CTAs (label "Ver todos", key `empty.dashboard.verTodos`, copy Copywriter) **navegan** a `/trabajos` / `/presupuestos` — comportamiento actual sin cambio | Click funcional en cada lista → modal abierto; click en Dashboard → navega a la lista (mismo destino que el "Ver todos" del header de la card) |
| E-AC5 | Con `?cliente=X`, el empty es la variante `contextual` con copy que nombra al cliente/segmento ("Este cliente…") | Abrir `/trabajos?cliente=1` sin trabajos |
| E-AC6 | `no-results` **nunca** ofrece crear (tipado: la rama del union lo impide) | Compilación + revisión: `grep -n "action" src/components/EmptyState.tsx` respeta el union type |
| E-AC7 | A11y: `EmptyState` expone `role="status"`; iconos `aria-hidden`; CTAs son `<button>` reales con foco visible | `getByRole('status')`, `getByRole('button', { name: 'Crear Trabajo' })` (casing final — C1); tabulación |
| E-AC8 | Contraste AA en ambos temas: título `--color-text` y descripción `--color-muted` sobre `--color-card` (≥4.5:1); verificado en dark **y** `[data-theme="claro"]` | DevTools Contrast checker sobre `.card` en ambos temas |
| E-AC9 | Iconos solo Lucide, sin emojis, sin SVG propios, sin `opacity: 0.5` sobre el icono | `grep -n "opacity: 0.5" Frontend/src/components/EmptyState.tsx` → 0 |
| E-AC10 | Copy final **aprobado por el Copywriter** — ✅ **satisfecho**: `loading-empty-states-copy.md` está en estado "Final — aprobado" (incluye `empty.dashboard.verTodos` y los empty de ClienteDetalle); la sección 5 quedó alineada al copy final en v1.2.0 | Sign-off en el issue #68 |
| E-AC11 | `npm run test && npm run build` pasan; ningún test depende del copy viejo | `cd Frontend && npm run test && npm run build` |
| E-AC12 | Cero dependencias nuevas | `git diff package.json` vacío |
| E-AC13 | **ClienteDetalle (Q2):** con cliente sin trabajos y/o presupuestos, las secciones "Trabajos Recientes"/"Presupuestos Recientes" **se muestran** con su header + `EmptyState contextual compact` (no se ocultan) | Abrir detalle de cliente sin datos → `getByRole('status')` ×2; las secciones `<h3>` están en el DOM |
| E-AC14 | **Preselección de cliente (Q3, mecánica 6.5.1):** desde `/trabajos?cliente=X` con empty contextual, el CTA "Crear Trabajo" abre `TrabajoForm` con el cliente preseleccionado. Sin regresiones: FAB/global → **sin** preselección; tras cerrar y reabrir → sin cliente stale (`trabajoFormClienteInicial` vuelve a `null` tras consumirse); editar trabajo → manda `trabajoOriginal`; `store/index.ts` solo tiene los campos nuevos | QA funcional de los 5 escenarios de la tabla de la sección 6.5.1; `grep -n "trabajoFormClienteInicial" Frontend/src` → solo `store/index.ts`, `Trabajos.tsx`, `TrabajoForm.tsx` |
| E-AC15 | **Componentes P1 (Q1):** los 7 componentes de la tabla 6.3 (`HoursModal`, `HorasTrabajoModal`, `MovimientosClienteModal`, `PresupuestoForm`, `TrabajoForm`, `TrabajoDetalle` fotos, `PasskeySection`) renderizan `EmptyState` en sus bloques vacíos; `HoursModal` distingue `search ≠ ''` (no-results + "Limpiar búsqueda") de vacío real; `PresupuestoForm` **idem con `secondaryAction` "Limpiar búsqueda"** en `no-results` y sin acción en `default` (decisión C2 — 4.1); `PasskeySection` sin action cuando el navegador no soporta passkeys | `grep -ln "EmptyState" Frontend/src/components/{HoursModal,HorasTrabajoModal,MovimientosClienteModal,PresupuestoForm,TrabajoForm,PasskeySection}.tsx Frontend/src/pages/TrabajoDetalle.tsx` → 7/7 archivos; `grep -n "text-center py-8\|text-center py-12" ` en esos bloques vacíos → migrados (los `py-8` restantes solo en estados de éxito `animate-scale-in`, fuera de alcance); QA funcional de HoursModal y de PresupuestoForm con search → "Limpiar búsqueda" limpia y devuelve el foco al `search-input` |
| E-AC16 | **Preselección de cliente en `PresupuestoForm` (Q3b, mecánica 6.5.2):** desde `/presupuestos?cliente=X` con empty contextual, el CTA "Crear Presupuesto" abre el wizard **en `step='datos'`** con el cliente resuelto (objeto de `useClientes()`). Sin regresiones: FAB/CTA default → `step='cliente'` sin preselección; lista de clientes aún cargando → la fase 2 aplica cuando `clientes` resuelve (no se pierde, no se duplica); id inexistente → fallback al paso cliente; editar → manda `presupuestoOriginal`; duplicar → manda `presupuestoDuplicado`; tras cerrar → sin stale (`presupuestoFormClienteInicial` y el pendiente local vuelven a `null`) | QA funcional de los 8 escenarios de la tabla de la sección 6.5.2; `grep -n "presupuestoFormClienteInicial" Frontend/src` → solo `store/index.ts`, `Presupuestos.tsx`, `PresupuestoForm.tsx` |

---

## 9. Fuera de alcance (documentado, NO hacer en #69/#68)

1. **Estados de error** (auditiados en 2.1/2.2): hoy 6 variantes + `Dashboard.tsx` **sin manejo de error** (muestra "Sin trabajos activos" y "—" cuando la API falla = error disfrazado de vacío). → **Issue nuevo sugerido**: `feat: ErrorState unificado + Dashboard manejo de errores` (tomar como referencia el patrón de `Metricas.tsx:170–180` con "Reintentar", que es el mejor de la app).
2. **Skeleton de página-detalle** (decisión L2: se usa spinner en detalle).
3. **Loading de mutaciones/botones** (decisión L5) y cualquier cambio en `Login.tsx`.
4. **Tests existentes**: no se modifican; si un test choca con este patrón, se detiene y se consulta (único caso conocido: `PresupuestoDetalle.test.tsx:246`, resuelto porque el detalle conserva spinner → L-AC9 lo cubre).
5. **Gaps de copy detectados por el Copywriter que no son superficies `LoadingState`/`EmptyState`** (copy doc §6): `HoursModal.tsx:339` "Cargando costo hora..." y `MovimientoModal.tsx:133/157` "Cargando..." (textos en `<option>`), el tuteo de `ClienteDetalle.tsx:231/276` ("Haz clic…") y los placeholders de inputs con `...` → **follow-up documentado**, fuera de #69/#68 (C-AC5 del copy doc los contempla como matches permitidos). Si se tocan, unificar `...` → `…`.

---

## 10. Preguntas abiertas

> **Ninguna.** Q1–Q5 y **Q3b** fueron respondidas por el dueño → decisiones y efectos en la **sección 1.4**. El copy está aprobado en `loading-empty-states-copy.md` (E-AC10 satisfecha) y los conflictos C1 (casing), C2 (`PresupuestoForm` no-results) y C3 (visibilidad del `label`) quedaron resueltos e integrados en v1.2.0. Ninguna decisión pendiente bloquea #69 ni #68.

*(Histórico: Q3b —¿preseleccionar en `PresupuestoForm`?— respondida **sí** (§1.4); mecánica en 6.5.2, AC E-AC16.)*

---

*Fin de la spec. Workflow: **Q1–Q5 + Q3b respondidas** (sección 1.4) → **Copywriter aprobó** `loading-empty-states-copy.md` (E-AC10 satisfecha; C1–C3 integrados en v1.2.0) → Frontend implementa **#69** (sección 6.2 + AC de sección 7) → Frontend implementa **#68** (secciones 6.3 + 6.5 + AC de sección 8). Ningún commit/push hasta que el usuario apruebe.*
