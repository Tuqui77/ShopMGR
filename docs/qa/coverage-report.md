# Coverage Report — Suite Backend (#82) + MetricasRepositorio (#95)

| Campo | Valor |
|---|---|
| **Versión** | v1.2 (verificado) |
| **Fecha** | 2026-08-11 |
| **Autor** | QA Automation |
| **Issue** | #82, #95 |
| **Objetivo** | ≥ 80% de criterios de aceptación cubiertos por tests automatizados (meta de los issues) |

> ✅ **Estado**: implementación **completa y verificada**. **215/215 tests PASS / 0 FAIL / 0 SKIP** en la suite completa (55 de integración #82 + 13 de repositorio #95 + 147 unit/regresión pre-existentes). Cobertura de criterios: **7/7 (#82) + 6/6 (#95) = 100%** cada uno. Detalles en §4, §5 y §7.

---

## 1. Cobertura por criterios de aceptación (matriz de trazabilidad)

| Criterio de aceptación | Casos de prueba | Cobertura planificada |
|---|---|---|
| **CA1** — Login valida credenciales reales y emite JWT + cookie HttpOnly | TC-AUTH-01, TC-AUTH-02, TC-AUTH-03, TC-AUTH-04, TC-AUTH-05 | ✅ Automatizado |
| **CA2** — Endpoints protegidos rechazan sin token | TC-AUTH-06, TC-AUTH-07, TC-CLI-04, TC-TRA-03 | ✅ Automatizado |
| **CA3** — Refresh token rota y se revoca al cerrar sesión | TC-AUTH-08, TC-AUTH-09, TC-AUTH-10, TC-AUTH-11 | ✅ Automatizado |
| **CA4** — CRUD Clientes (crear/listar/obtener/modificar/eliminar + errores) | TC-CLI-01..15 (15 casos) | ✅ Automatizado |
| **CA5** — CRUD Trabajos + transiciones de estado + errores | TC-TRA-01..13 (13 casos) | ✅ Automatizado |
| **CA6** — CRUD Presupuestos + aceptar/rechazar + costo hora + errores | TC-PRE-01..11 (11 casos) | ✅ Automatizado |
| **CA7** — Assertions reales (contra el contrato HTTP, no pasamano) | Todos (asserts derivados de V1–V15 de `test-plan.md`) | ✅ Automatizado |

**Cobertura de criterios: 7/7 = 100%** (objetivo mínimo: ≥80% → **CUMPLIDO, verificado en ejecución**).

---

## 2. Cobertura por tipo de caso

| Tipo | Cantidad | % del total |
|---|---|---|
| Happy path | 19 | 45% |
| Negative (400/401/404) | 16 | 38% |
| Contrato (cookie/JWT/refresh) | 7 | 17% |
| Exploratory (automatizados en v1.1) | 3 | +TC-EXP-02, TC-EXP-03 automatizados; TC-EXP-01 resuelto como issue #126 |
| **Total ejecutados** | **55** | **100%** (todos PASS, 2 corridas) |

> La tabla cubre la suite de integración HTTP (#82). La suite unit `MetricasRepositorio` (#95, 13 tests) no se contabiliza aquí — va en §7.

---

## 3. Cobertura explícitamente NO automatizada (aceptada y documentada)

| Caso | Estado real (v1.1) | Dónde se documenta |
|---|---|---|
| TC-EXP-01 — Crear trabajo/presupuesto con cliente inexistente | **RESUELTO**: H3 confirmado — `CrearTrabajo` con `idCliente=999999` → **500** FK violation; `CrearPresupuesto` → **404** `"El valor de la hora de trabajo no esta configurado"` (falla antes del FK). **Issue #126** abierto (`bug`, `severity: medium`): debería ser 400/404. | `test-cases.md` §E + Issue #126 |
| TC-EXP-02 — Rate limit 429 | **AUTOMATIZADO** (`ApiRateLimitTests`): factory aislado + `TokenCompartido` (0 logins por fixture) → 6º login → **429** `"Demasiados intentos de inicio de sesión..."`. Sin flakiness (verificado 2 corridas). | `test-cases.md` §E + `automation-scripts.md` |
| TC-EXP-03 — `$id`/`$values` en colecciones | **RESUELTO** en implementación: helper `LeerValores` (System.Text.Json.Nodes) en `ApiTestsBase`. | `automation-scripts.md` §3 |

**Impacto en la meta**: los criterios CA1–CA7 se cubren íntegramente → meta ≥80% **CUMPLIDA y verificada** (7/7 = 100%).

---

## 4. Cobertura de código (resultado real, medido)

```bash
dotnet test ShopMGR.Tests --collect:"XPlat Code Coverage"
# → ShopMGR.Tests/TestResults/<run>/coverage.cobertura.xml
```

> ⚠️ Nota operativa: si la corrida falla con **MSB3030** (`MvcTestingAppManifest.json`), limpiar `ShopMGR.Tests/bin` y `ShopMGR.Tests/obj` antes de reintentar (`rm -rf ShopMGR.Tests/bin ShopMGR.Tests/obj`).

### Resultado real (2026-08-09)

| Ensamblado | Line coverage | Notas |
|---|---|---|
| `ShopMGR.WebApi` (incluye `Middleware.ExceptionHandlingMiddleware` al 100%) | **54.8%** | Controllers + pipeline HTTP real |
| `ShopMGR.Repositorios` | **69.1%** | EF Core real (SQLite) |
| `ShopMGR.Aplicacion` | **59.7%** | Servicios |
| `ShopMGR.Dominio` | **72.5%** | Entidades + reglas |
| `Bootstrap` | **76.5%** | Seeder admin |
| `Extensiones` | **100.0%** | — |
| `ShopMGR.Contexto` | 1.6% | Migraciones EF generadas (no testeables; excluido del análisis) |

El valor primario de la suite es el **contrato HTTP** (cada endpoint del alcance con ≥1 llamada real — tabla abajo) y **CA = 100%**; el % de líneas es métrica secundaria (los unit tests InMemory cubren el resto de líneas).

| Endpoint | Estado real |
|---|---|
| `POST /api/Auth/IniciarSesion` (éxito + 3 errores) | ✅ cubierto |
| `POST /api/Auth/Refrescar` (ok + 401 sin cookie + 401 revocado) | ✅ cubierto |
| `POST /api/Auth/CerrarSesion` | ✅ cubierto |
| `POST /api/Auth/RegistrarUsuario` (ok + duplicado) | ✅ cubierto |
| `GET /api/Auth` (200 + 401) | ✅ cubierto |
| `POST /api/Cliente/CrearCliente` (ok + 400 ×2 + 401) | ✅ cubierto |
| `GET /api/Cliente/ObtenerListaClientes` (200 + 404) | ✅ cubierto |
| `GET /api/Cliente/ObtenerClientePorId` (404) | ✅ cubierto |
| `GET /api/Cliente/ObtenerClientePorNombre` (400) | ✅ cubierto |
| `PATCH /api/Cliente/ModificarCliente` (ok + 404) | ✅ cubierto |
| `DELETE /api/Cliente/EliminarCliente` (ok + 404) | ✅ cubierto |
| `POST /api/Cliente/CrearMovimiento` | ✅ cubierto |
| `POST /api/Trabajos/CrearTrabajo` (ok + 400 + 401) | ✅ cubierto |
| `GET /api/Trabajos/ObtenerListaTrabajos` | ✅ cubierto |
| `GET /api/Trabajos/ObtenerTrabajoPorId` (404) | ✅ cubierto |
| `GET /api/Trabajos/ObtenerTrabajosPorCliente` (404) | ✅ cubierto |
| `GET /api/Trabajos/ObtenerTrabajosPorEstado` (404) | ✅ cubierto |
| `PATCH /api/Trabajos/IniciarTrabajo` / `TerminarTrabajo` | ✅ cubierto |
| `POST /api/Trabajos/AgregarHorasDeTrabajo` (ok + 404) | ✅ cubierto |
| `DELETE /api/Trabajos/EliminarTrabajo` (ok + 404) | ✅ cubierto |
| `POST /api/Presupuestos/CrearPresupuesto` (ok + 400) | ✅ cubierto |
| `GET /api/Presupuestos/ListarPresupuestos` | ✅ cubierto |
| `GET /api/Presupuestos/ObtenerPresupuestoPorId` (404) | ✅ cubierto |
| `GET /api/Presupuestos/ObtenerPresupuestosPorCliente` (404) | ✅ cubierto |
| `PATCH /api/Presupuestos/AceptarPresupuesto` / `RechazarPresupuesto` | ✅ cubierto |
| `PATCH /api/Presupuestos/ActualizarPresupuesto` | ✅ cubierto (**TC-PRE-08** dedicado, agregado en implementación) |
| `DELETE /api/Presupuestos/EliminarPresupuesto` | ✅ cubierto |
| `GET/PATCH /api/Presupuestos/Obtener|ActualizarCostoHoraDeTrabajo` | ✅ cubierto |

### Discrepancias de contrato detectadas al implementar (asserts ajustados al comportamiento real)

| Test | Spec v1.0 (esperado) | Comportamiento real verificado | Ajuste |
|---|---|---|---|
| TC-AUTH-09 | accessToken nuevo ≠ anterior tras refresh | Puede ser **byte-idéntico** si login+refresh caen en el mismo segundo (misma `exp`, sin `jti`). La rotación observable es la **cookie** | Assert de cookie rotada + accessToken no vacío |
| TC-CLI-10 | 400 `"Complete el nombre del cliente."` | `?nombre=` no enlaza (query vacío → null) → validación automática del binding → 400 **ProblemDetails** antes del check del controller | Assert 400 ProblemDetails |
| TC-PRE-08 | PATCH con body parcial `{titulo}` | `ModificarPresupuesto.HorasEstimadas` usado con `!.Value` y `Materiales` no-nullable → 400 si faltan | Body completo (titulo, descripcion, horasEstimadas, idCliente, materiales: []) |
| TC-PRE-11 | body `150` | Serialización decimal → **`"150.0"`**; `decimal.Parse` con culture es-AR convierte `"150.0"` → 1500 (`.` = miles) | `decimal.Parse(..., CultureInfo.InvariantCulture)` |
| TC-TRA-09 | Terminar trabajo creado Iniciado | `TerminarTrabajo` usa `TotalLabor.Value` → 400 si el trabajo no tiene horas (TotalLabor null) | Flujo real: crear → AgregarHoras → Terminar |
| TC-TRA-10 | PATCH con body parcial `{descripcion}` | `ModificarTrabajo.Titulo` no-nullable → 400 de binding si falta | Body completo |
| TC-TRA-11 | Agregar horas a trabajo sin presupuesto | Requiere `ValorHoraDeTrabajo` configurado (404 si falta) | Seed en `InitializeAsync` (patrón de TC-PRE) |

### Gaps de cobertura de código (aceptables, sin cambios)

| Área | Por qué queda sin cubrir |
|---|---|
| `passkeys/*` (AuthController) | Requiere autenticador WebAuthn (out of scope #82; unit tests existentes cubren el contrato) |
| `AgregarFotosTrabajo` / `EliminarFotoTrabajo` | Requiere `IAlmacenamientoServicio` (Google Drive) — dependencia externa |
| `CrearTrabajoDePresupuesto` / `CambiarPresupuesto` / `EliminarPresupuesto` (trabajos) | Flujo avanzado de presupuesto↔trabajo; candidato a iteración v1.1 si el dueño lo prioriza |
| `CambiarContrasena*` / `CambiarRol` / `RestaurarContraseña` / `ListarUsuariosAsync` | Auth administrativo; requiere setup adicional de roles (v1.1 si el dueño lo pide) |

---

## 5. Métricas de la suite (resumen de estado)

| Métrica | Objetivo | Resultado real |
|---|---|---|
| Criterios de aceptación cubiertos | ≥ 80% | **100%** (7/7, verificado en ejecución) |
| Tests de integración nuevos | — | **55 tests** en 9 clases (7 suites + 2 suites de estado vacío) |
| Assertions reales por test | ≥ 1 (nunca pasamano) | 100% (asserts de status + body + header + BD) |
| Flakiness (2 corridas consecutivas) | 0 | **0** — 55/55 en ambas corridas (2026-08-09) |
| Tiempo de suite integración | < 10 min (token JWT R4) | **~4 s** (55 tests; host compartido SQLite :memory:) |
| Dependencias nuevas | 0 | ✅ (todo ya en `ShopMGR.Tests.csproj`) |
| Suite total (`dotnet test ShopMGR.Tests`) | — | **215/215 pass, 0 omitidos** (2026-08-11). El skip pre-existente de `PresupuestoRepositorioTests.CrearAsync_DeberiaCrearPresupuesto` ya no existe: el bug AddRange sin null check se resolvió y el test pasa |
| Suite `MetricasRepositorio` (#95) | — | **13 tests** (1 clase), todos PASS; **6/6 criterios** del issue #95 cubiertos (ver §7) |
| Suite issue #126 (`ApiIssue126Tests`) | — | **6 tests** agregados desde v1.1 (TC-TRA-14..17, TC-PRE-12..13) — documentados en la iteración del issue #126 |
| Cobertura de código (secundaria) | Documentar, no perseguir % | WebApi 54.8% · Repos 69.1% · Aplicacion 59.7% · Dominio 72.5% (ver §4) |

---

## 6. Tendencias y deuda de conocimiento (backlog)

| Ítem | Tipo | Estado / Recomendación |
|---|---|---|
| TC-EXP-01 (FK sin validar en creación de trabajo/presupuesto) | **BUG confirmado** | H3: `CrearTrabajo` idCliente inexistente → **500** (debería 400/404). **Issue #126** abierto (`bug`, `severity: medium`, evidencia + fix sugerido). `CrearPresupuesto` → 404 anticipado (falla antes del FK por config de costo hora) |
| `ActualizarPresupuesto` sin test dedicado | Resuelto | **TC-PRE-08** dedicado agregado y pasando |
| Auth administrativo (roles, cambiar contraseña) | Ampliación | Iteración v1.1 del plan si el dueño lo prioriza |
| `AGENTS.md` desactualizado (endpoint `ObtenerListaTrabajos` ya existe) | Resuelto | `AGENTS.md` actualizado el 2026-08-09: gaps históricos eliminados; quedan solo los activos (issue #126: FK sin validar en creación de trabajo/presupuesto) |
| HS512 key-length gotcha (`IDX10720`) | Nota de infraestructura de test | `Claves.JwtToken` de prueba debe tener ≥512 bits (clave aprobada por PM, 536 bits). No es un bug de producción si el secreto real cumple la longitud |
| `ValorHoraDeTrabajo` no sembrada por Bootstrap | Gap funcional | Presupuestos y `AgregarHorasDeTrabajo` (trabajo sin presupuesto) fallan con 404 hasta configurarla vía `PATCH ActualizarCostoHoraDeTrabajo`. Considerar seed en Bootstrap |
| Rate limiter y suites compartidas | Nota de diseño | Single-partition (TestServer → 127.0.0.1): clases con ≥6 logins/min o ≥2 registros/min reciben 429. Mitigado con `TokenCompartido` + factories aislados por test de rate-limit |

---

## 7. Suite MetricasRepositorio (issue #95)

> Suite unit de repositorio (InMemory + repositorio directo — patrón de `ClienteRepositorioTests`). Fuente de asserts: `test-plan.md` §12 (M1–M5). Archivo: `ShopMGR.Tests/MetricasRepositorioTests.cs` (13 tests).

### Matriz de trazabilidad de criterios (issue #95)

| Criterio de aceptación | Casos | Resultado real |
|---|---|---|
| **CA1** — Ingresos = suma de movimientos `Pago` del mes (múltiples Pagos) | TC-MET-01 | ✅ PASS (400.49 exacto) |
| **CA2** — Excluye tipos no-Pago del mismo mes (Cargo/Compra/Anticipo/Ajuste) | TC-MET-02 | ✅ PASS |
| **CA3** — Filtra por mes y por año | TC-MET-03, TC-MET-04 | ✅ PASS |
| **CA4** — Mes sin movimientos → 0 | TC-MET-05 | ✅ PASS |
| **CA5** — No suma `TotalLabor` de trabajos Terminado (regresión del fix) | TC-MET-06 | ✅ PASS (fallaría con el código pre-fix: Sum de TotalLabor) |
| **CA6** — Regresión: los otros 4 métodos del repositorio funcionan | TC-MET-07..13 | ✅ PASS (7 tests) |

**Cobertura de criterios #95: 6/6 = 100%** (objetivo mínimo: ≥80% → **CUMPLIDO, verificado en ejecución**).

### Métricas de la suite

| Métrica | Resultado real |
|---|---|
| Tests | 13 `[Fact]`, 1 clase (`MetricasRepositorioTests`) |
| Corrida individual | 13/13 PASS — fixture InMemory con nombre `Guid` por test → aislamiento total (cero estado compartido) |
| Suite completa | **215/215 PASS / 0 FAIL / 0 SKIP** (incluye los 13) |
| Dependencias nuevas | 0 (mismo patrón InMemory que la suite existente) |
| Tiempo de suite | < 1 s (InMemory, sin host HTTP) |
| Flakiness | 0 — fixture de fechas estable: mes fijo `2026-07` para movimientos; `DateTime.Now` para Trabajo/Presupuesto/Horas (setters privados) con período vacío `2000-01` |

### Cobertura de código (secundaria)

Los 5 métodos de `MetricasRepositorio` quedan cubiertos con asserts reales de suma/conteo (nunca pasamano). El % de líneas con los tests #95 no se midió en esta iteración (métrica secundaria — ver nota §4); el valor primario es CA = 100%.
