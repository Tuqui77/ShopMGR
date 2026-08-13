# Feature #118 — Dashboard comparativo + Sección "Métricas" · Spec de Diseño

> **Documento de referencia para el subagente Frontend.** Esta spec es autónoma: contiene todas las decisiones del dueño (inalterables), el contrato de componentes, el contrato de datos, los wireframes, los casos de test y el checklist de a11y. Si algo falta o contradice una decisión del dueño listada en la sección 1, detener y consultar antes de implementar.

| Campo | Valor |
|---|---|
| Issue | [#118 — feat(metrics): dashboard con comparativa actual/mes anterior + sección Métricas con selector de mes](https://github.com/ShopMGR/ShopMGR/issues/118) |
| Fecha | 2026-08-11 |
| Estado | Diseño aprobado (decisiones del dueño finales) |
| Consumidor | Subagente Frontend (React 18 + Vite + TS + Tailwind v4) |
| Decisiones | Dueño (inalterables) · D3/D4 definidas por UX |
| Versionado | v1.0.0 (semver) |

---

## 1. Resumen y decisiones inalterables

### 1.1 Contexto

El dashboard actual muestra solo las métricas del **mes en curso** (`metricasService.obtenerTodas()` con fecha hardcodeada en `Frontend/src/services/metricas.ts`). La feature #118 agrega:

1. **Dashboard comparativo**: métricas del mes actual + comparación con el mes anterior, lado a lado, **sin porcentajes**.
2. **Sección nueva "Métricas"** en `/metricas`: selector de período + todas las métricas del mes elegido.

El usuario final es el **dueño del taller mecánico**: usa la app a diario, en mobile (BottomNav) y desktop (Sidebar). La tarea principal es "ver cómo viene el negocio este mes vs el mes pasado" y "consultar un mes histórico puntual". Criterio CES: ninguna de estas tareas debe superar **3 clics**.

### 1.2 Decisiones del dueño — INALTERABLES

| ID | Decisión |
|---|---|
| **D1** | Si un mes no tiene actividad → mostrar **"—"** (U+2014). **Nunca `0`, nunca `%`.** |
| **D2** | El dueño implementa `GET /api/Metricas/ObtenerMesesConDatos` → lista de períodos `{ anio, mes }` con **≥1 registro**. El selector de `/metricas` lista **solo meses con datos** (agrupados por año, orden desc). Fallback: si el endpoint falla → mostrar **últimos 50 años** (seleccionar mes actual). |
| **D3** | El hero de ingresos del Dashboard se convierte en **target de navegación**: contiene el enlace visible **"Ver historial →"** y **todo el hero es tappable/clickeable** → navega a `/metricas?periodo=AAAA-MM` (mes actual). El grid 2x2 **NO es tappable**. |
| **D4** | **Sin sublabel "en curso"** — se sobreentiende que el mes actual no terminó. El **nombre del mes** sí aparece como sublabel (recomendado; imprescindible cuando la columna anterior muestra "—"). |
| **Alcance dashboard** | Mostrar métricas del mes actual + comparación con mes anterior. **NO porcentajes, NO flechas de tendencia, NO colores de tendencia.** Solo valores "Este mes" vs "Mes anterior" lado a lado. |
| **Navegación** | **NO agregar item al BottomNav.** Acceso mobile desde el Dashboard (hero navegable, D3). Desktop: desde la Sidebar (nuevo item "Métricas"). |
| **Contrato null (Opción B)** | Los **5 endpoints** de métricas devuelven `null` (no `0`) cuando el período no tiene datos de esa métrica. El frontend muestra "—" con `null`. El tipo `MetricasMes` cambia a `number | null` en cada campo. |
| **MetricCard** | Refactor: `value: number | null` → "—" cuando `null`. **ELIMINAR la prop `change`** (código muerto, 0 usos confirmado por grep). |

### 1.3 Reglas de diseño transversal (aplican a todo el feature)

- **Prohibido**: porcentajes, `↑`/`↓`, colores success/danger para indicar tendencia en valores comparados.
- **Único color semántico permitido en valores**: `var(--color-accent)` para el valor "Este mes" **solo en el hero** (patrón actual del dashboard). En el grid, valores en `var(--color-text)`.
- La **columna "Mes anterior" siempre muted** (label de columna, valor y nombre de mes en `var(--color-muted)`).
- `null` = sin datos → "—". `0` = dato real (cero) → "0". El frontend **no** transforma `0` en "—".
- Los nombres de mes se muestran en español (`es-AR`): Enero, Febrero, …, Diciembre.

---

## 2. Arquitectura de componentes

### 2.1 Árbol (Atomic Design)

```
Atoms
├── MetricCard                          (refactorizado — value: number | null, sin change)
├── LoadingSpinner                      (existente, no se toca)

Molecules
├── MetricCardComparativo               (NUEVO — 2 columnas comparativas; internamente compone 2× MetricCard)
└── PeriodoSelector                     (NUEVO — 2 <select> nativos + botón "Este mes")

Organisms
└── MetricasGrid                        (NUEVO — grid compartido Dashboard + /metricas)

Pages
├── Dashboard                           (MODIFICADO — hero navegable + grid comparativo)
└── Metricas                            (NUEVO — ruta /metricas, lazy)

Shared (sin UI)
├── metricasGridConfig.ts               (NUEVO — config de las 4 métricas del grid: label, icono, color, formato)
└── utils/periodos.ts                   (NUEVO — helpers puros: agrupar por año, fallback 50 años, resolver E1)
```

**Principio "cero drift"**: Dashboard y `/metricas` consumen **exactamente** los mismos componentes (`MetricCardComparativo` + `MetricasGrid` + `metricasGridConfig`). Cualquier cambio visual se propaga solo. Prohibido duplicar markup de cards en las páginas (el Dashboard actual renderiza cards inline — se refactoriza para usar los componentes compartidos).

### 2.2 Contrato de props

#### `MetricCard` (átomo — refactorizado)

```ts
interface MetricCardProps {
  /** Valor del período. null → se renderiza "—" (nunca 0, nunca %). */
  value: number | null;
  /** Label visible bajo el valor (o en el header de columna). */
  label: string;
  /** Prefijo de texto opcional (mantenido por compatibilidad; hoy 0 usos). */
  prefix?: string;
  /** Tamaño visual del valor. 'sm' para grid (text-lg), 'lg' para hero (text-3xl/4xl). Default 'sm'. */
  size?: 'sm' | 'lg';
  /** true → el valor se pinta muted (columna "Mes anterior"). Default false. */
  muted?: boolean;
}
```

| Estado | Render | Detalle |
|---|---|---|
| `value: number` | valor formateado | `font-mono` bold; `sm` → `text-lg`, `lg` → `text-3xl lg:text-4xl` |
| `value: null` | `—` | `font-mono` bold, mismo tamaño que el valor numérico (alineación de columnas), `color: var(--color-muted)` |
| `value: null` + a11y | `aria-hidden="true"` + `sr-only` | Ver sección 8 — el "—" se acompaña de `<span className="sr-only">Sin datos</span>` |

- **Eliminar** la prop `change`, la lógica `isPositive/isNegative` y el render de `%`/flechas (código muerto).
- Reutiliza las clases existentes `.metric-card`, `.metric-value`, `.metric-label` (definidas en `index.css`, hoy sin uso).

#### `MetricCardComparativo` (molécula — nueva)

```ts
type FormatoValor = 'moneda' | 'horas' | 'entero';

interface MetricCardComparativoProps {
  /** Label del card: "Ingresos del mes" (hero) o "Horas trabajadas", etc. (grid). */
  label: string;
  /** Valor del período seleccionado ("Este mes"). null → "—". */
  valorActual: number | null;
  /** Valor del período anterior. null → "—". SIEMPRE muted. */
  valorAnterior: number | null;
  /** Nombre del mes del período actual, ej. "Agosto". Sublabel bajo el valor (D4). */
  mesActual: string;
  /** Nombre del mes anterior, ej. "Julio". Sublabel bajo el valor (D4). */
  mesAnterior: string;
  /** Formato de los valores. Default 'entero'. */
  formato?: FormatoValor;
  /** Icono lucide opcional (cabecera del card). */
  icono?: LucideIcon;
  /** Color del icono (CSS var). Solo aplica si `icono` está definido. */
  colorIcono?: string;
  /** Variante visual. 'grid' (card p-3, valores text-lg) | 'hero' (card p-5, borde accent, valores text-3xl). */
  variant?: 'hero' | 'grid';
}
```

**Layout interno** (idéntico en ambas variantes, cambia solo el tamaño):

```
┌─────────────────────────────────────────┐
│ [icon] LABEL (uppercase, xs, muted)     │
│ ┌────────────┬──────────────────────┐   │
│ │ Este mes   │ Mes anterior         │   │  ← headers de columna (xs, uppercase, muted)
│ ├────────────┼──────────────────────┤   │
│ │ $150.000   │ $120.000             │   │  ← valores (font-mono bold; derecha muted)
│ │ Agosto     │ Julio                │   │  ← sublabels nombre de mes (D4)
│ └────────────┴──────────────────────┘   │
└─────────────────────────────────────────┘
```

| Regla visual | Valor |
|---|---|
| Headers de columna | "Este mes" / "Mes anterior" — `text-xs uppercase tracking-wider`, `color: var(--color-muted)` |
| Valores | `font-mono font-bold` — columna izquierda: `var(--color-text)` (hero: `var(--color-accent)`); **columna derecha: siempre `var(--color-muted)`** |
| Sublabels de mes | `text-xs`, `var(--color-muted)` — **siempre visibles**, incluso con valor null (D4) |
| Grid de columnas | `grid grid-cols-2 gap-4` dentro del card |
| Prohibido | `%`, `↑/↓`, colores de tendencia, sublabel "en curso" |
| Grid variant | `card !p-3` · **sin** hover bg (no es interactivo — ver decisión en 3.3) |
| Hero variant | `card !p-5` + `border` con `borderColor: var(--color-accent)` (patrón actual del hero) |

**Formateo de valores** (centralizado, evita drift entre páginas):

| `formato` | Regla | Ejemplo |
|---|---|---|
| `moneda` | `formatCurrency(value)` (util existente `utils/dateFormat.ts`) | `$150.000` |
| `horas` | `` `${value.toFixed(1)} hs` `` (mismo formato que el dashboard actual) | `42.0 hs` |
| `entero` | `value.toLocaleString('es-AR')` | `1.500` |
| `null` (cualquier formato) | `—` (nunca se formatea) | `—` |

#### `MetricasGrid` (organismo — nueva)

```ts
interface MetricasGridProps {
  /** 4 MetricCardComparativo (o ReactNode en general). El grid es estructural. */
  children: ReactNode;
}
```

- Render: `grid grid-cols-2 gap-2 lg:grid-cols-4` → **2x2 en mobile, 4 columnas en desktop**.
- **Sin** `onClick`, `cursor-pointer` ni hover (D3: no tappable).

#### `metricasGridConfig` (config compartida — nueva, `Frontend/src/components/metricasGridConfig.ts`)

```ts
import { Timer, CheckCircle2, FileText, ClipboardCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MetricasMes } from '../types';

export type MetricaGridKey = 'horasTrabajadas' | 'trabajosTerminados' | 'presupuestosCreados' | 'presupuestosAceptados';

export interface MetricaGridItem {
  key: MetricaGridKey;
  label: string;
  icono: LucideIcon;
  colorIcono: string;  // CSS var, ej. 'var(--color-muted)'
  formato: FormatoValor;
}

export const metricasGridConfig: MetricaGridItem[] = [
  { key: 'horasTrabajadas',      label: 'Horas trabajadas',     icono: Timer,          colorIcono: 'var(--color-muted)',    formato: 'horas'   },
  { key: 'trabajosTerminados',   label: 'Trabajos terminados',  icono: CheckCircle2,   colorIcono: 'var(--color-success)',  formato: 'entero'  },
  { key: 'presupuestosCreados',  label: 'Presupuestos creados', icono: FileText,       colorIcono: 'var(--color-muted)',    formato: 'entero'  },
  { key: 'presupuestosAceptados',label: 'Presupuestos aceptados',icono: ClipboardCheck, colorIcono: 'var(--color-info)',     formato: 'entero'  },
];
```

Ambas páginas renderizan el grid así (patrón contract, no implementación):

```tsx
<MetricasGrid>
  {metricasGridConfig.map((m) => (
    <MetricCardComparativo
      key={m.key}
      label={m.label}
      icono={m.icono}
      colorIcono={m.colorIcono}
      formato={m.formato}
      valorActual={actual?.[m.key] ?? null}
      valorAnterior={anterior?.[m.key] ?? null}
      mesActual={mesActualLabel}
      mesAnterior={mesAnteriorLabel}
    />
  ))}
</MetricasGrid>
```

#### `PeriodoSelector` (molécula — nueva)

```ts
interface PeriodoSelectorProps {
  anio: number;                 // período seleccionado
  mes: number;                  // 1-12
  aniosDisponibles: number[];   // desc — años con datos (o fallback 50 años)
  mesesDisponibles: number[];   // desc — meses con datos del año elegido (o 1..12)
  esMesActual: boolean;         // true → deshabilita el botón "Este mes"
  onChange: (anio: number, mes: number) => void;
  onIrAlMesActual: () => void;
  disabled?: boolean;           // true mientras cargan los períodos
}
```

| Parte | Elemento | Detalle |
|---|---|---|
| Select Año | `<select className="input">` | `aria-label="Año"` (o `<label className="sr-only">`) · `id="periodo-anio"` |
| Select Mes | `<select className="input">` | `aria-label="Mes"` · `id="periodo-mes"` |
| Botón | `<button className="btn-secondary">Este mes</button>` | `disabled` cuando `esMesActual` (patrón `.btn-primary:disabled` — para `btn-secondary` aplicar `opacity-50 cursor-not-allowed`) |
| Layout mobile | 2 selects `flex-1` en fila, botón debajo `w-full` | Altura objetivo ≥ 44px (`.input` con `padding: 0.75rem 1rem` ya lo cumple) |
| Layout desktop | Los 3 en una fila, botón con ancho auto | |

**Justificación de 2 selects nativos (año + mes) en vez de 1 select con optgroup**:

1. **Fallback de 50 años** → 1 select tendría hasta 600 opciones: scroll gigante en el picker nativo de mobile, CES inaceptable. Con 2 selects, cada uno lista ≤ 12 (meses) / ≤ 50 (años).
2. **Edge E1** (auto-seleccionar primer mes con datos al cambiar año) se implementa de forma trivial y testeable con año/mes separados: al cambiar año se repuebla el select de meses según el año elegido.
3. El patrón año/mes separados es el estándar de reportes financieros/históricos; el usuario lo reconoce sin curva de aprendizaje.
4. La sincronización con la URL `?periodo=AAAA-MM` es directa.

### 2.3 Estados por componente

| Componente | Estados |
|---|---|
| `MetricCard` | valor numérico · null ("—") · (loading/error lo maneja la página, no el átomo) |
| `MetricCardComparativo` | ambos valores numéricos · actual null · anterior null · ambos null |
| `MetricasGrid` | 4 cards (composición) · skeleton (los 4 cards con `Loader2`, patrón existente del dashboard) |
| `PeriodoSelector` | enabled (período con datos) · disabled (cargando períodos) · botón "Este mes" disabled (ya en mes actual) |
| Página `Metricas` | loading (skeleton hero + grid) · error (mensaje + Reintentar) · empty (todo "—" + nota) · success |

---

## 3. Especificación página Dashboard

### 3.1 Estructura general (orden de secciones — se mantiene el orden actual)

1. Header (saludo + fecha + botón Perfil) — **sin cambios**
2. **Hero de ingresos → comparativo navegable** (D3)
3. **Grid 2x2 comparativo** (MetricasGrid) — **no tappable**
4. Trabajos activos + Presupuestos pendientes — **sin cambios**

### 3.2 Hero navegable (D3) — mobile

- El hero completo es un **`<Link>`** (semántica de navegación, no `<button>`): `to="/metricas?periodo=${anioActual}-${pad(mesActual)}"` — **siempre** el mes actual (coherencia: el hero muestra el mes actual → lleva al mes actual).
- Contenido del hero (`MetricCardComparativo` `variant="hero"`):
  - `label="Ingresos del mes"`, `icono=TrendingUp`, `colorIcono="var(--color-accent)"`, `formato="moneda"`
  - `valorActual={metricas.ingresos}` · `valorAnterior={metricasAnteriores.ingresos}`
  - `mesActual="Agosto"` · `mesAnterior="Julio"`
- **"Ver historial →"**: texto `text-sm font-medium`, `color: var(--color-accent)`, con icono `ArrowRight` de lucide (`w-4 h-4`). Posición: bajo las columnas en mobile, extremo derecho en desktop (ver wireframe 3.4).
- Si `null` en cualquier columna → "—" (D1). Nunca 0, nunca %.
- a11y: el `<Link>` recibe `aria-label` descriptivo si el contenido rico no es auto-descriptivo para el lector de pantalla; `focus-visible` explícito (ver sección 8).

### 3.3 Grid 2x2 comparativo

- `MetricasGrid` con las 4 métricas de `metricasGridConfig` (ver 2.2).
- `mesActual` / `mesAnterior` como sublabels (D4).
- **NO tappable**: sin `onClick`, sin `cursor-pointer`, **sin hover bg** en las cards del grid comparativo. Justificación: hover en una card no interactiva es una affordance falsa (el usuario espera que algo pase al tocar). El grid actual tiene hover pero no acción — se corrige al migrar al componente compartido.
- Estados: skeleton con 4 `Loader2` (patrón actual) mientras carga; si `metricas` es `undefined` (sin datos) → las 5 métricas en "—" (D1), sin mensaje adicional.

### 3.4 Wireframes ASCII

**Mobile (390px) — Dashboard:**

```
┌────────────────────────────────┐
│ Buenos días               [👤] │  ← header (btn-icon perfil, lg:hidden)
│ martes, 11 de agosto           │
├────────────────────────────────┤
│ ┌────────────────────────────┐ │
│ │ 📈 INGRESOS DEL MES        │ │  ← Link completo (D3)
│ │ ┌─────────┬──────────────┐ │ │
│ │ │Este mes │Mes anterior  │ │ │
│ │ │$150.000 │$120.000      │ │ │
│ │ │Agosto   │Julio         │ │ │
│ │ └─────────┴──────────────┘ │ │
│ │        Ver historial →     │ │
│ └────────────────────────────┘ │
│ ┌──────────┬───────────────┐  │
│ │⏱ Horas  │ ✓ Trabajos    │  │  ← MetricasGrid 2x2 (NO tappable)
│ │trabajadas│ terminados    │  │
│ │42,0 hs   │ 8             │  │
│ │Agosto│Jul│Agosto│Jul     │  │
│ ├──────────┼───────────────┤  │
│ │📄 Presup.│ 📋 Presup.    │  │
│ │creados   │ aceptados     │  │
│ │12        │ 6             │  │
│ └──────────┴───────────────┘  │
│ ┌────────────────────────────┐ │
│ │ TRABAJOS ACTIVOS     Ver → │ │
│ │ • Cambio de aceite         │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │ PRESUP. PENDIENTES   Ver → │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
[ Inicio | Clientes | Trabajos | Presup. | Config. ]   ← BottomNav SIN cambios
```

**Desktop (≥1024px) — Dashboard:**

```
┌──────────┬─────────────────────────────────────────┐
│ Sidebar  │ Buenos días                      [👤]   │
│ Inicio   ├─────────────────────────────────────────┤
│ Clientes │ ┌─────────────────────────────────────┐ │
│ Trabajos │ │ 📈 INGRESOS DEL MES     Este mes  Mes anterior │
│ Presup.  │ │                        $150.000   $120.000    │
│ MÉTRICAS │ │                        Agosto       Julio      │
│ ...      │ │                         Ver historial →       │  ← Link (D3)
│          │ └─────────────────────────────────────┘ │
│          │ ┌────────┬────────┬────────┬─────────┐  │
│          │ │ Horas  │ Trab.  │ Presup.│ Presup. │  │  ← MetricasGrid 4 cols
│          │ │ trab.  │ term.  │ cread. │ acept.  │  │     (NO tappable)
│          │ └────────┴────────┴────────┴─────────┘  │
│          │ ┌──────────────┬──────────────────────┐ │
│          │ │ Trabajos activos │ Presup. pendientes│ │
│          │ └──────────────┴──────────────────────┘ │
└──────────┴─────────────────────────────────────────┘
```

### 3.5 Cambios de navegación

- **Sidebar** (`Sidebar.tsx`): agregar item `{ path: '/metricas', icon: BarChart3, label: 'Métricas' }` en `navItems`, después de Presupuestos. `isActivePath` existente (`startsWith`) ya funciona para `/metricas`.
- **BottomNav**: **NO** tocar (`BottomNav.tsx` queda igual — decisión del dueño).
- **App.tsx**: nueva ruta lazy (patrón existente, issue #67):

```tsx
const Metricas = lazy(() => import('./pages/Metricas').then(m => ({ default: m.Metricas })));
// ...
<Route path="/metricas" element={<ErrorBoundary pageName="Métricas"><Metricas /></ErrorBoundary>} />
```

---

## 4. Especificación página `/metricas` (nueva)

### 4.1 Estructura

1. **Header**: botón back (`btn-icon` + `ArrowLeft`, `aria-label="Volver"`, `navigate(-1)` o `navigate('/')`) + `<h1 className="text-xl font-bold font-display">Métricas</h1>`.
2. **PeriodoSelector** (año + mes + "Este mes") — ver sección 5.
3. **Hero comparativo** de ingresos (`MetricCardComparativo` `variant="hero"`) — **sin enlace** (el hero de /metricas NO navega).
4. **MetricasGrid** con las 4 métricas comparativas.
5. **URL `?periodo=AAAA-MM` sincronizada** (fuente de verdad = `searchParams`; ver 5.5).

### 4.2 Estados

| Estado | Comportamiento |
|---|---|
| **Loading** (períodos o métricas cargando) | Selector `disabled` + skeleton hero (card con `Loader2`) + skeleton grid (4 cards con `Loader2`) — mismo patrón visual del dashboard actual. |
| **Error** (falla `obtener` del período) | Card/mensaje: "No pudimos cargar las métricas" + botón `btn-secondary` "Reintentar" (→ `refetch` + `invalidateQueries`). El selector sigue habilitado (el usuario puede cambiar de mes). |
| **Empty** (todas las métricas del período en `null`) | Todas las cards en "—" (D1, sin error). Bajo el grid, nota informativa sutil (muted, `text-sm`): "Sin actividad registrada en {Mes} {Año}". Es posible con el fallback de 50 años (mes sin datos) pero no con el endpoint de períodos (solo lista meses con ≥1 registro). |
| **Success** | Hero + grid con valores (o "—" por métrica). |

### 4.3 Wireframes ASCII

**Mobile (390px) — /metricas:**

```
┌────────────────────────────────┐
│ [←] Métricas                   │  ← btn-icon back + h1
├────────────────────────────────┤
│ [Año ▾      ] [Mes ▾     ]     │  ← 2 selects .input (flex-1, fila)
│ [     Este mes      ]          │  ← btn-secondary w-full (disabled si ya es el mes actual)
├────────────────────────────────┤
│ ┌────────────────────────────┐ │
│ │ 📈 INGRESOS DEL MES        │ │  ← hero SIN enlace
│ │ ┌─────────┬──────────────┐ │ │
│ │ │Este mes │Mes anterior  │ │ │
│ │ │$150.000 │$120.000      │ │ │
│ │ │Agosto   │Julio         │ │ │
│ │ └─────────┴──────────────┘ │ │
│ └────────────────────────────┘ │
│ ┌──────────┬───────────────┐  │
│ │ 4 comparativos (2x2)     │  │  ← MetricasGrid (mismo que Dashboard)
│ └──────────┴───────────────┘  │
└────────────────────────────────┘
```

**Desktop (≥1024px) — /metricas:**

```
┌──────────┬─────────────────────────────────────────┐
│ Sidebar  │ [←] Métricas                            │
│ ...      │ [Año ▾] [Mes ▾] [Este mes]              │  ← fila única
│ MÉTRICAS │ ┌─────────────────────────────────────┐ │
│ (active) │ │ 📈 INGRESOS DEL MES   Este mes  Mes anterior │
│          │ │                      $150.000  $120.000     │
│          │ │                      Agosto     Julio       │
│          │ └─────────────────────────────────────┘ │
│          │ ┌────────┬────────┬────────┬─────────┐  │
│          │ │ 4 comparativos (1 fila de 4 cols)   │  │
│          │ └────────┴────────┴────────┴─────────┘  │
└──────────┴─────────────────────────────────────────┘
```

### 4.4 Semántica de las columnas en /metricas

En `/metricas` el período es histórico y elegible: **"Este mes" es relativo al período seleccionado** (ej. viendo Julio 2026 → "Este mes" = Julio 2026, "Mes anterior" = Junio 2026). Por eso el **sublabel con el nombre del mes es obligatorio (D4)**: resuelve la ambigüedad de que "Este mes" no siempre es el mes calendario actual.

---

## 5. Selector de período (D2 + fallback + E1)

### 5.1 Fuente de datos

- **Endpoint OK** (`usePeriodosMetricas`): `periodos: PeriodoMetrica[]` → el frontend **agrupa y ordena defensivamente** (desc por año, luego mes):

```ts
// utils/periodos.ts (helpers puros — NUEVO)
export function normalizarPeriodos(periodos: PeriodoMetrica[]): PeriodoMetrica[];
// → sort desc (anio, mes) + dedupe (anio, mes)

export function agruparPorAnio(periodos: PeriodoMetrica[]): Map<number, number[]>;
// → año → meses con datos (desc)

export function aniosFallback(anioActual: number, cantidad = 50): number[];
// → [anioActual, anioActual-1, ..., anioActual-49]

export function resolverE1(anioNuevo: number, mesActual: number, mesesDelAnio: number[]): number;
// E1: si mesActual ∈ mesesDelAnio → mesActual; si no → primer mes de mesesDelAnio (el más reciente, desc).
// mesesDelAnio vacío → devuelve mesActual (el select no podrá seleccionar nada; caso cubierto por disabled).
```

- **Fallback** (endpoint falla **o** devuelve lista vacía): `aniosDisponibles = [actual .. actual-49]`, `mesesDisponibles = [12..1]` (todos los meses, desc). Selección inicial: **mes actual**. Justificación del fallback también con lista vacía: taller nuevo sin datos — sin él el selector no tendría opciones y la página quedaría inusable; con él, el usuario puede navegar meses vacíos y ver "—" (D1).

### 5.2 Regla del período por defecto (`/metricas` sin `?periodo`)

1. Si `?periodo=AAAA-MM` es válido → ese período.
2. Si el endpoint de períodos está OK → **primer período de la lista normalizada** (el más reciente con datos). Cubre el caso "mes actual sin actividad": se muestra el último mes con movimiento, no un mes vacío.
3. Si el endpoint falló → **mes actual**.

### 5.3 Edge E1 (auto-selección al cambiar de año)

- **Endpoint OK**: al cambiar el año, si el mes seleccionado actualmente **no tiene datos** en el nuevo año → auto-seleccionar el **primer mes con datos** de ese año (`resolverE1` — como los meses del select ya están desc, es el primero de la lista). Si el mes actual sí existe en el nuevo año → mantenerlo.
- **Fallback**: todos los meses existen en todos los años → siempre se mantiene el mes seleccionado (el mes del período actual, no necesariamente el mes calendario actual).

### 5.4 Sincronización URL

- Fuente de verdad: `useSearchParams()` (React Router v7).
- Parse: `periodo=AAAA-MM` → `{ anio, mes }`; formato inválido → regla del período por defecto (5.2) y corregir la URL con `replace`.
- Cambio en selector → `setSearchParams({ periodo: 'AAAA-MM' }, { replace: true })` — **`replace`** para no ensuciar el historial del navegador (cada cambio de mes no debe crear una entrada de "back").
- El hero del Dashboard navega con **`push`** (navegación real): `/metricas?periodo=AAAA-MM`.
- Browser back/forward → la página lee `searchParams` y re-deriva el período (no duplica estado local; un único estado derivado de la URL).

---

## 6. Contrato de datos frontend-backend

### 6.1 Endpoints

| Endpoint | Uso | Params | Respuesta |
|---|---|---|---|
| `GET /api/Metricas/ObtenerIngresos` | Ingresos del mes | `fecha=AAAA-MM-01` | `number \| null` |
| `GET /api/Metricas/ObtenerHoras` | Horas trabajadas | `fecha=AAAA-MM-01` | `number \| null` |
| `GET /api/Metricas/ObtenerTrabajosTerminados` | Trabajos terminados | `fecha=AAAA-MM-01` | `number \| null` |
| `GET /api/Metricas/ObtenerPresupuestosEntregados` | Presupuestos creados | `fecha=AAAA-MM-01` | `number \| null` |
| `GET /api/Metricas/ObtenerPresupuestosAceptados` | Presupuestos aceptados | `fecha=AAAA-MM-01` | `number \| null` |
| `GET /api/Metricas/ObtenerMesesConDatos` (**NUEVO, D2**) | Períodos con ≥1 registro | — | `PeriodoMetricaBackend[]` |

**Formato de fecha**: siempre `AAAA-MM-01` (DateOnly de .NET; el helper `formatFecha` existente en `services/metricas.ts` ya lo produce — se conserva).

### 6.2 Tipos TypeScript (`types/index.ts`)

```ts
/** Contrato null (Opción B): null = sin datos de la métrica en el período. 0 = dato real. */
export interface MetricasMes {
  ingresos: number | null;
  horasTrabajadas: number | null;
  trabajosTerminados: number | null;
  presupuestosCreados: number | null;
  presupuestosAceptados: number | null;
}

/** Período con actividad (D2). mes: 1-12. */
export interface PeriodoMetrica {
  anio: number;
  mes: number;
}
```

### 6.3 Semántica de `null` (crítica — respetar exactamente)

| Valor recibido | Significado | Render |
|---|---|---|
| `null` | Sin datos de esa métrica en el período | `—` (muted, font-mono, mismo tamaño que un valor) |
| `0` | Dato real: cero (ej. 0 presupuestos aceptados) | `0` |
| Ausente/undefined | Tratar como `null` (defensivo, `?? null`) | `—` |

**No** transformar `0` en "—". **No** transformar `null` en `0`.

### 6.4 Servicios y hooks (`services/metricas.ts` + `hooks/`)

```ts
// metricasService — reemplaza obtenerTodas() (hoy hardcodeada al mes actual)
export const metricasService = {
  /** 5 llamadas en paralelo para el período dado. */
  async obtener(anio: number, mes: number): Promise<MetricasMes>;   // obtenerTodas() se elimina
  /** GET /Metricas/ObtenerMesesConDatos → períodos con datos (D2). */
  async obtenerPeriodos(): Promise<PeriodoMetrica[]>;
};
```

| Hook | Query key | Comportamiento |
|---|---|---|
| `useMetricasMes(anio, mes)` | `['metricas', anio, mes]` | `enabled: anio/mes definidos`. **Misma key que el dashboard actual** → reuso de cache e invalidaciones (`['metricas']` invalidado al aceptar/rechazar presupuesto sigue funcionando en ambas páginas). |
| `useComparativaMetricas()` | `['metricas', anioActual, mesActual]` + `['metricas', anioAnterior, mesAnterior]` | 2 llamadas paralelas (`useQueries`). **Rollover de año**: `mes === 1` → anterior = `(anio-1, 12)`; si no → `(anio, mes-1)`. Devuelve `{ actual, anterior, isLoading, isError }`. |
| `usePeriodosMetricas()` | `['metricas', 'periodos']` | `staleTime` 5 min (patrón dashboard). Expone `periodos`, `isLoading`, `isError`. El fallback de 50 años NO vive en el hook: vive en `utils/periodos.ts` y se activa donde se construye el selector (página `/metricas`). |

> **Migración**: `useDashboardMetrics` (hook existente) se reemplaza por `useComparativaMetricas` en el Dashboard. El Dashboard sigue invalidando `['metricas']` al aceptar/rechazar presupuesto — no requiere cambios en esa lógica.

### 6.5 Requisitos backend (brechas — el Frontend NO implementa backend)

> Regla del proyecto: no tocar backend. Documentar la brecha e informar al dueño.

1. **Contrato null en los 5 endpoints**: hoy devuelven `0` cuando no hay datos. **Deben devolver `null`** (Opción B confirmada por el dueño). **Coordinación de despliegue**: el frontend asume el contrato null; mientras el backend devuelva `0`, la UI mostrará `0` (no "—"). El cambio de backend y el frontend se despliegan juntos (ver 10, ambigüedad A1).
2. **`GET /api/Metricas/ObtenerMesesConDatos`** (D2): debe existir con `[Authorize]`, devolver `PeriodoMetricaBackend[] = [{ anio: number, mes: number }]` con ≥1 registro por período. Orden no crítico: el frontend ordena desc defensivamente.

---

## 7. Casos de prueba clave (Jest/Vitest + Testing Library)

> El subagente Frontend agrega/actualiza estos archivos. La feature **debe** llegar con su suite verde (`npx vitest run`, `npm run lint`, `tsc`, `npm run build`).

### 7.1 `MetricCard` (nuevo — `__tests__/components/MetricCard.test.tsx`)

1. `value={42}` → renderiza "42" en `font-mono`.
2. `value={150000}` → renderiza "150.000" (`toLocaleString`).
3. `value={null}` → renderiza "—" (`aria-hidden`) + texto sr-only "Sin datos".
4. **No** existe la prop `change` → no se renderiza ningún `%` ni flecha (regresión del código muerto).

### 7.2 `MetricCardComparativo` (nuevo)

1. Renderiza los headers "Este mes" y "Mes anterior".
2. `valorActual` y `valorAnterior` numéricos → ambos valores visibles lado a lado.
3. `valorAnterior={null}` → "—" en la columna anterior **y el nombre del mes anterior sigue visible** (D4).
4. La columna anterior usa color `var(--color-muted)` (verificar `style`).
5. **No** renderiza `%`, `↑`, `↓` ni colores de tendencia en ninguna variante.
6. `formato="moneda"` → `formatCurrency`; `formato="horas"` con `42` → `"42.0 hs"`; `formato="entero"` con `1500` → `"1.500"`.
7. `variant="hero"` vs `"grid"` → clases/tamaños distintos (valor `text-3xl` vs `text-lg`).

### 7.3 `MetricasGrid` (nuevo)

1. Renderiza el wrapper con `grid-cols-2` y `lg:grid-cols-4` (2x2 mobile / 4 cols desktop).
2. Renderiza los 4 children (config → 4 `MetricCardComparativo`).
3. **No** tiene `onClick`/`href`/`cursor-pointer` (D3: no tappable).

### 7.4 `PeriodoSelector` + E1 (nuevo)

1. `onChange` se dispara con `(anio, mes)` al cambiar cada select.
2. **E1**: con `aniosDisponibles=[2026, 2025]`, `mesesDisponibles(2026)=[8,7,6]`, `mesesDisponibles(2025)=[12,3]` y mes seleccionado `8`: al cambiar año a `2025` → se selecciona `mes=12` (primer mes con datos de 2025, desc) y `onChange(2025, 12)` (el 8 no existe en 2025).
3. **E1 negativo**: al cambiar año a `2026` con mes `8` → se mantiene `8`.
4. Botón "Este mes": `disabled` cuando `esMesActual=true`; al hacer click dispara `onIrAlMesActual`.
5. Selects con `aria-label` ("Año"/"Mes") y target ≥ 44px de alto.
6. `disabled` (cargando períodos) → selects deshabilitados.

### 7.5 `metricasService` (actualizar `__tests__/services/metricas.test.ts`)

1. `obtener(2026, 8)` → 5 llamadas con `fecha: '2026-08-01'` (adaptar test existente de `obtenerTodas`).
2. `obtener(2026, 1)` → `fecha: '2026-01-01'` (padding de cero — test existente se conserva).
3. Respuestas `null` → `MetricasMes` con campos `null` (contrato null).
4. `obtenerPeriodos()` → `GET /Metricas/ObtenerMesesConDatos`, parsea `[{anio, mes}]`.

### 7.6 `useComparativaMetricas` (nuevo)

1. Mes actual agosto 2026 → llamadas a `obtener(2026, 8)` y `obtener(2026, 7)`.
2. **Rollover**: mes actual enero 2026 → `obtener(2026, 1)` y `obtener(2025, 12)`.
3. Query keys correctas (reuso de cache).

### 7.7 Página `Metricas` (nuevo — `__tests__/pages/Metricas.test.tsx`)

1. Sin query → período por defecto (primer período con datos si endpoint OK; mes actual si fallback).
2. Con `?periodo=2025-07` → selects reflejan año 2025 y mes julio; hero/grid cargan 2025-07.
3. Cambiar el select de mes → URL se actualiza a `?periodo=2025-06` (con `replace`, sin nueva entrada en historial).
4. `?periodo=invalido` → se corrige la URL al default (5.2).
5. Botón "Este mes" → URL al mes actual.
6. Loading → skeletons visibles; Error → mensaje + "Reintentar" dispara refetch.
7. Todas las métricas `null` (fallback, mes sin datos) → todas "—" + nota "Sin actividad registrada en …" (sin error).

### 7.8 `Dashboard` (actualizar/crear)

1. El hero es un **link** con `href` a `/metricas?periodo=AAAA-MM` (mes actual, fake timers) y contiene el texto "Ver historial".
2. El grid 2x2 no contiene links ni botones (D3).
3. `metricas` con `ingresos: null` → hero muestra "—" (nunca 0, nunca %).

### 7.9 `utils/periodos.ts` (nuevo)

1. `normalizarPeriodos` ordena desc y dedupea.
2. `agruparPorAnio` → `Map<anio, meses desc>`.
3. `aniosFallback(2026)` → `[2026..1977]` (50 elementos).
4. `resolverE1` cubre: mes existe (mantiene), mes no existe (primer mes con datos), lista vacía (devuelve el mes actual).

---

## 8. Checklist de accesibilidad (WCAG 2.1 AA)

| Criterio | Implementación requerida |
|---|---|
| **1.4.3 Contraste 4.5:1** | Pares de tokens (tema dark, default): `--color-muted #9898b0` sobre card `#181824` ≈ **6.2:1** ✓ · texto `#e8e8f0` sobre card ≈ **14:1** ✓ · accent `#ff6b35` sobre card ≈ **6.2:1** ✓ (el valor "Este mes" del hero es texto grande bold ≥18.66px → AA large 3:1). **Verificar al implementar con axe**; en tema claro `claro` re-verificar (ver ambigüedad A2). |
| **1.4.1 Uso del color** | La comparación no depende de color: la columna "Mes anterior" se distingue por su **label textual** ("Mes anterior") además del muted. El "—" se anuncia como "Sin datos" (sr-only). |
| **2.1.1 Teclado** | Selects nativos operables por teclado ✓. El hero navegable es un `<Link>` real → Enter/Espacio navegan ✓. El grid NO es interactivo (no requiere tab stop). |
| **2.4.7 Focus visible** | `.input:focus` ya pinta borde accent ✓. **Agregar `focus-visible` explícito** al hero-link y a los botones del selector si no hay default visible: `outline: 2px solid var(--color-accent); outline-offset: 2px` (o clases Tailwind `focus-visible:outline-2 focus-visible:outline-offset-2`). |
| **2.4.6 Encabezados y etiquetas** | `<h1>Métricas</h1>` en /metricas; selects con `<label className="sr-only" htmlFor="periodo-anio">Año</label>` y análogo para Mes (Tailwind v4 incluye la utilidad `sr-only`). |
| **2.5.5 Tamaño de objetivos** | Selects `.input` (padding 0.75rem → alto ≈ 44px) ✓ · botón "Este mes" (`btn-secondary`, padding 0.75rem → ≈ 44px) ✓ · hero-link: área táctil = todo el card (≫ 44px) ✓ · back `btn-icon` = 44px ✓. |
| **1.1.1 / 4.1.2 "—" en lectores de pantalla** | El "—" se renderiza con `aria-hidden="true"` + `<span className="sr-only">Sin datos</span>`: el lector no lee "guion largo", anuncia "Sin datos". |
| **3.2.3 Cambios de contexto** | Cambiar período NO navega (solo `replace` de URL + re-render): el usuario no pierde posición. |
| **4.1.3 Estado del contenido** | Añadir `aria-live="polite"` a un elemento que anuncie el período en curso ("Métricas de agosto de 2026") al cambiar de mes — permite al lector de pantalla detectar la actualización sin foco. |
| **2.4.1 Evitar bloques** | No aplica cambios: la app no define skip-links hoy; no es una regresión de esta feature (documentado, no bloqueante). |

---

## 9. Restricciones técnicas del proyecto (recordatorio para el Frontend)

- **React 18** (NO 19) · **React Router v7.x** (mínimo 7.18.2).
- **Iconos**: solo `lucide-react` (nuevos usados: `BarChart3`, `ArrowRight`, `ArrowLeft`; reuso de `TrendingUp`, `Timer`, `CheckCircle2`, `FileText`, `ClipboardCheck`, `Loader2`). No emojis, no SVG inline. (Los wireframes usan emojis solo como anotación visual, no son spec.)
- **Estilos**: CSS vars de `index.css` (`--color-*`), clases `.card`, `.btn-primary`, `.btn-secondary`, `.btn-icon`, `.input`, `.metric-card`, `.metric-value`, `.metric-label`. Tailwind utilities permitidas (grid, gap, flex, text-*, font-mono).
- **Lazy loading** para la ruta nueva (patrón `App.tsx` + issue #67).
- **Enums** viajan como string; **`MetricasMes`** es el único tipo de métricas que el backend provee (5 campos).
- **Moneda**: `formatCurrency` de `utils/dateFormat.ts` (símbolo configurable por usuario — no hardcodear `$`).
- Componentes nuevos en `src/components/`, página nueva en `src/pages/Metricas.tsx` (export **named** `Metricas` por el patrón lazy de App.tsx).
- Hooks en `src/hooks/`, servicios en `src/services/`, helpers puros en `src/utils/periodos.ts`.
- **CES**: "ver métricas de un mes puntual" = Dashboard → tap hero → 1 clic · en /metricas cambiar mes = 2 selects + URL = ≤ 3 interacciones. Cumple.

---

## 10. Ambigüedades abiertas / decisiones a confirmar

| ID | Ambigüedad | Estado |
|---|---|---|
| **A1** | **Contrato null depende del backend**: los 5 endpoints hoy devuelven `0`. El dueño confirmó la Opción B (null) pero el cambio debe desplegarse **junto con el frontend**. ¿El subagente Frontend debe asumir que el backend ya devuelve null al momento de implementar, o manejar `0` como "—" mientras tanto? → **Coordinación con el dueño antes de mergear**. Recomendación: implementar contra el contrato null; `?? null` defensivo ante campos ausentes; coordinar el despliegue. |
| **A2** | **"Ver historial →" en tema claro**: texto accent `#ff6b35` sobre blanco ≈ **2.8:1** → no cumple AA 4.5:1 para texto de 14px. Es un problema pre-existente del sistema (los "Ver todos" actuales son accent text-xs). Recomendación: mantener accent por consistencia (dark es el tema default y cumple) y anotarlo como deuda de a11y global, o usar `var(--color-text)` + icono accent. **Decisión menor, no bloqueante** — preguntar si se prefiere corregir. |
| **A3** | **Prop `prefix` de `MetricCard`**: también tiene 0 usos (como `change`). Se mantiene por no ampliar alcance; puede eliminarse en un refactor futuro. |
| **A4** | **Default sin query en /metricas** (5.2): primer período con datos vs mes actual. La spec define **primer período con datos** (más útil). Si el dueño prefiere "siempre mes actual", es un cambio de 1 línea en la página — confirmar en demo. |
| **A5** | **Nota de empty "Sin actividad registrada en …"**: la spec la incluye como texto informativo bajo el grid (solo cuando todas las métricas son null). Si el dueño la considera ruido, eliminarla sin impacto en el resto. |

---

## 11. Retrospectiva de esta entrega (design)

- **Qué salió bien**: la decisión de compartir `MetricasGrid` + `metricasGridConfig` entre Dashboard y /metricas elimina el riesgo de drift visual (el dashboard hoy duplica markup inline — era deuda). El contrato null es la raíz correcta del problema D1 (la UI ya no decide qué es "sin datos", lo decide el backend).
- **Qué se corrigió en el camino**: quitar el hover de las cards no interactivas (affordance falsa) y eliminar la prop `change` muerta.
- **Pendiente de validación con usuario**: A4 (default del selector) y A5 (nota de empty) — validar con el dueño en la demo, no requieren cambios de código grandes.
- **Próximo paso**: handoff al subagente Frontend (esta spec) + coordinación del contrato null con el dueño (A1).
