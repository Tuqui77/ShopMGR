# Test Plan — Suite de Integración Backend (API .NET 9) + MetricasRepositorio

| Campo | Valor |
|---|---|
| **Versión** | v1.2 |
| **Fecha** | 2026-08-11 |
| **Autor** | QA Automation |
| **Issue** | #82 (tests backend con assertions reales), #95 (suite MetricasRepositorio) |
| **Alcance** | Auth, Clientes, Trabajos, Presupuestos (API REST) + MetricasRepositorio (repositorio) |
| **Estado** | Implementado y verificado (#82 v1.1); suite #95 agregada (v1.2) |

---

## 1. Objetivo

Crear una suite de **tests de integración** sobre la Web API (.NET 9) que valide los flujos de negocio reales (HTTP real → pipeline completo → BD real), complementando los unit tests existentes (`ShopMGR.Tests/*Tests.cs` — InMemory + Moq, 100% cubiertos en la iteración #82-01).

La suite debe:
- Cubrir **≥ 80% de los criterios de aceptación** de la feature (#82) con assertions reales.
- Verificar el **contrato HTTP** (status codes, headers, cookies, body JSON) — no solo que "no tire excepción".
- Correr en **local y CI sin Docker**: sin SQL Server, sin infraestructura externa.

---

## 2. Alcance

### In scope

| Feature | Endpoints | Prioridad |
|---|---|---|
| **Auth** | `POST /api/Auth/IniciarSesion`, `POST /api/Auth/Refrescar`, `POST /api/Auth/CerrarSesion`, `GET /api/Auth` (AuthorizedOnly), `POST /api/Auth/RegistrarUsuario` | **Crítica** (P0) |
| **Clientes** | `CrearCliente`, `ObtenerListaClientes`, `ObtenerClientePorId`, `ObtenerDetallePorId`, `ObtenerClientePorNombre`, `ModificarCliente`, `EliminarCliente`, `BuscarSaldosNegativos`, movimientos | **Alta** (P1) |
| **Trabajos** | `CrearTrabajo`, `ObtenerListaTrabajos`, `ObtenerTrabajoPorId`, `ObtenerDetallePorId`, `ObtenerTrabajosPorCliente`, `ObtenerTrabajosPorEstado`, `IniciarTrabajo`, `TerminarTrabajo`, `ModificarTrabajo`, `EliminarTrabajo` | **Alta** (P1) |
| **Presupuestos** | `CrearPresupuesto`, `ListarPresupuestos`, `ObtenerPresupuestoPorId`, `ObtenerDetallePresupuesto`, `ObtenerPresupuestosPorCliente`, `ObtenerPresupuestosEstado`, `AceptarPresupuesto`, `RechazarPresupuesto`, `ActualizarPresupuesto`, `EliminarPresupuesto`, `ObtenerCostoHoraDeTrabajo` | **Alta** (P1) |

### Out of scope (justificado)

| Fuera de alcance | Motivo |
|---|---|
| Passkeys / WebAuthn (`passkeys/*`) | Requiere autenticador (hardware/emulador); los unit tests ya cubren la lógica de contrato. |
| Google Drive (`IAlmacenamientoServicio`) | Dependencia externa; no aplica al contrato HTTP de negocio. |
| Frontend React | Issue #81 (ya implementado y aprobado por QA). |
| 429 (rate limit) | No automatizable en suite compartida: consumiría el límite (5 login/min/IP) y contaminaría al resto. Ver §8. |
| Multi-tenancy | La app no es multi-tenant (no aplica el skill qa-multi-tenant-testing). |

---

## 3. Contexto técnico verificado (fuente de los asserts — Regla de No Inventar)

Cada assert de la suite se deriva del código real verificado en el repo (2026-08-08). Nada se asume:

| # | Verificación | Hallazgo | Impacto en la suite |
|---|---|---|---|
| V1 | `Aplicacion/Program.cs` | `Main` público en namespace `ShopMGR.WebApi.Aplicacion`; corre `Migrate()` (retry 10×5s) + `Bootstrap.InicializarAsync()` al arrancar | `WebApplicationFactory<Program>` es viable; **el arranque exige** `ADMIN_USERNAME` + `ADMIN_PASSWORD` (si faltan → `InvalidOperationException` al iniciar el host de test) y `Jwt:Token` (si falta → NRE en `Encoding.UTF8.GetBytes(null!)`) |
| V2 | `Aplicacion/Program.cs` | DbContext registrado con `UseSqlServer(ConnectionStrings:ShopMGRDbContexto)` | El factory debe re-registrar `DbContextOptions<ShopMGRDbContexto>` con el provider de test |
| V3 | `ShopMGR.Contexto/Migrations/*` | **0** `migrationBuilder.Sql(...)`; operaciones puras del modelo; tipos `date`/`datetime2`/`nvarchar(max)`/`decimal(18,2)` tolerados por SQLite | Migraciones **portables → `Migrate()` real contra SQLite** |
| V4 | `RefreshTokenCleanupService` | Usa `ExecuteDeleteAsync()` | **InMemory NO lo soporta** (lanza, lo atrapa el `catch` → log de error). SQLite lo traduce bien → **SQLite es el provider recomendado** |
| V5 | `Middleware/ExceptionHandlingMiddleware` | `KeyNotFoundException` → **404**; `InvalidOperationException` → **400**; resto → **500**; body `{ "error": "..." }` | Asserts de errores: 404/400/500 con ese body |
| V6 | `Controllers/*` | Todos los endpoints de negocio `[Authorize]`; validaciones `[ApiController]` automáticas (400 ProblemDetails) | Suite necesita login previo; los 400 de validación DTO son ProblemDetails, los 400 de negocio son `{ error }` |
| V7 | `AuthController` | Login fallido → **400** `"Nombre de usuario o contraseña incorrectos"` (NO 401). `Refrescar` sin cookie → **401**. `CerrarSesion` → siempre 200 + borra cookie | Asserts exactos de auth |
| V8 | `AuthController.GuardarRefreshTokenCookie` | Cookie `refreshToken`: `HttpOnly`, `SameSite=Strict`, `Path=/api/Auth`, `Secure` desde config, expira 30 días | Contrato de cookie a verificar en Set-Cookie; `Secure` se pone **false en test** para poder reenviarla por HTTP |
| V9 | `Program.cs` rate limiter | Políticas `login` (5/min/IP) y `registro` (1/min/IP) con `[EnableRateLimiting]` en AuthController | Riesgo de 429 → diseño con login único por clase (§8-R1) |
| V10 | `appsettings.json` (raíz) | `Jwt:Issuer=ShopMGR`, `Jwt:Audience=ShopMGR-Users`, `Jwt:ExpirationMinutes=10`; `Auth:RefreshTokenCookie.Secure=true` | JWT de test debe firmar con Issuer/Audience reales; token válido 10 min (riesgo R4) |
| V11 | Repositorios | `ClienteRepositorio`: duplicado → `InvalidOperationException` (400); inexistente → `KeyNotFoundException` (404). LINQ puro (`Include`/`GroupBy`/`Sum`) — compatible con SQLite | Asserts 400/404 exactos; SQLite traduce el LINQ |
| V12 | Repositorios | `TrabajoRepositorio.CrearAsync` y `PresupuestoRepositorio.CrearAsync` **no validan** que el `IdCliente` exista | Con SQLite: FK violada → SqliteException → 500. Con InMemory: se crea (no hay constraints). **Comportamiento a documentar, no a afirmar** (caso exploratory, §6 test-cases) |
| V13 | `ShopMGR.Tests.csproj` | Ya referencia `Microsoft.AspNetCore.Mvc.Testing` 9.0.0, `Microsoft.EntityFrameworkCore.InMemory`, `Microsoft.EntityFrameworkCore.Sqlite`; coverlet activado (`CollectCoverage=true`, formato cobertura) | **Cero dependencias nuevas necesarias** — la infraestructura está lista |
| V14 | `Program.cs` | `ReferenceHandler.IgnoreCycles` → JSON con `$id`/`$values` | Los asserts de body deben parsear con `JsonDocument`, no deserializar tipado directo a `List<T>` (salvo `IgnoreCycles` no previsto) |
| V15 | `AGENTS.md` | Documenta como gap `GET /api/Trabajos/ObtenerListaTrabajos` | **Desactualizado**: el endpoint YA existe en `TrabajosController` (se cubre en la suite). Hallazgo info (no bloquea) |

---

## 4. Estrategia de testing (Tree of Thought)

| Enfoque | Descripción | Pros | Contras | Veredicto |
|---|---|---|---|---|
| **A: Solo unit tests (estado actual)** | Seguir agregando unit tests con InMemory + Moq | Cero setup; rápido | No valida el pipeline HTTP real (middleware, auth, serialización, cookies, rate limiter) — los bugs de contrato escapan | ✗ Insuficiente |
| **B: Integración contra SQL Server (contenedor)** | WebApplicationFactory + SQL Server real del compose | Máxima fidelidad al prod | Requiere Docker en local y CI; ~10-30s por test suite; rompe el objetivo "corre sin infraestructura" | ✗ Sobrecoste para esta iteración |
| **C: Integración con SQLite in-memory** (recomendado) | WebApplicationFactory + `UseSqlite("Data Source=:memory:")` + `Migrate()` real | Pipeline HTTP real; migraciones validadas; sin infraestructura; `ExecuteDeleteAsync` funciona (V4); rápido (<5s por clase); **los asserts de contrato se ejecutan contra el stack real** | SQLite ≠ SQL Server (matices de traducción LINQ: `date`/funciones de fecha); algunos bugs provider-específicos no se detectan | ✅ **Elegido** |

**Justificación del enfoque C**: el objetivo del issue #82 es validar el **contrato HTTP de negocio** (status, cookies, headers, JSON, auth), no el SQL de producción. SQLite in-memory es el estándar de facto para tests de integración EF Core: da el pipeline completo (middleware + controllers + repositorios reales + migraciones reales) sin la fricción de un contenedor. Los unit tests existentes (InMemory) se conservan: son ortogonales (lógica pura de repositorio/servicio sin HTTP).

### Pirámide resultante

```
        ╱  Integración HTTP (NUEVA — esta suite): ~30 casos   ← p95 < 500 ms/caso
      ╱   Unit tests (existentes): 16 archivos                ← ya en verde
    ╱    (InMemory + Moq, sin pipeline)
```

---

## 5. Tipos de prueba a ejecutar

| Tipo | Cantidad planificada | Cobertura de criterios |
|---|---|---|
| **Integración — happy path** | ~18 | Flujos principales de cada feature (login OK, CRUD OK, transiciones de estado) |
| **Integración — errores/negative** | ~14 | 400 validación, 400 negocio, 404 inexistente, 401 no autenticado, cookie ausente |
| **Integración — contrato cookie/JWT** | ~6 | Set-Cookie (HttpOnly, Path, SameSite), refresh rotado, logout borra cookie, 401 sin token |
| **Exploratory (documentados, manuales)** | 3 | FK sin validar en creación (V12), rate limit 429 (R1), body con `$id/$values` (V14) |
| **Manual smoke** | 1 | App completa en Docker (pre-release) |

---

## 6. Datos de entorno (supuestos declarados — a confirmar por el dueño)

La suite usa un **host de test efímero** (`WebApplicationFactory`), no un entorno live. Configuración inyectada en el factory:

| Clave | Valor de test | Por qué |
|---|---|---|
| `ConnectionStrings:ShopMGRDbContexto` | `Data Source=:memory:` (SQLite) | BD por clase de test, aislada y efímera |
| `Jwt:Token` | `ClaveDePruebaShopMGR_0123456789abcdef0123456789` (≥32 bytes) | Firmar JWT en el arranque; Issuer/Audience reales vienen de `appsettings.json` |
| `ADMIN_USERNAME` | `admin` | Bootstrap exige la env var (V1); el admin se crea con hash real → login real |
| `ADMIN_PASSWORD` | `Admin123!` | Contraseña de test, documentada, **solo para entorno de test** |
| `Auth:RefreshTokenCookie.Secure` | `false` | Para reenviar la cookie de refresh por HTTP en los tests de `Refrescar` (V8) |

> ⚠️ Si el dueño prefiere otros valores, se cambian en **un solo lugar**: `Claves.cs` (ver `automation-scripts.md`).

---

## 7. Priorización

1. **P0 — Auth** (flujo crítico): login, cookie, refresh, logout, 401. Un bug aquí bloquea todo.
2. **P1 — CRUD Clientes**: contrato completo con errores.
3. **P1 — CRUD Trabajos**: incluye transiciones de estado (`Iniciar`/`Terminar`).
4. **P1 — CRUD Presupuestos**: incluye aceptar/rechazar + costo hora.

Orden de implementación sugerido: Auth → Clientes → Trabajos → Presupuestos (dependencias: Trabajos y Presupuestos requieren un Cliente previo).

---

## 8. Riesgos y mitigaciones

| ID | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| **R1** | Rate limiter `login`: **5 intentos/min por IP** (V9). La IP en tests es 127.0.0.1 → 6+ logins/min → 429 y contaminación entre clases | Flakiness severa | **Un solo login por clase de test** (fixture que autentica una vez y comparte el token — el JWT dura 10 min, R4). Solo `LoginApiTests` llama al endpoint (≤4 llamadas por clase) |
| **R2** | `Migrate()` con retry 10×5s → si falla contra SQLite, la clase tarda **hasta 50 s** | Tiempo muerto | Portabilidad verificada (V3: 0 SQL crudo). Si llegara a fallar, fallback documentado a InMemory (con la salvedad V4) y abrir issue |
| **R3** | `ExecuteDeleteAsync` del hosted service (V4) | Con SQLite: OK. Con InMemory: log de error cada ejecución | Provider elegido = SQLite; el `catch` del servicio evita fallo de arranque |
| **R4** | JWT expira en **10 min** (`ExpirationMinutes`) | Tests que corren >10 min con el token compartido fallan con 401 | Suite completa < 10 min (estimada ~2-3 min). Si crece, re-login por clase en vez de por suite |
| **R5** | Contaminación de datos entre tests que comparten BD | Assert flaky | Cada test crea sus datos con **nombres únicos** (sufijo `Guid`); BD se recrea por clase (factory por clase) |
| **R6** | `$id`/`$values` en respuestas de colecciones (V14) | Deserialización tipada rota | Parsear con `JsonDocument` en asserts de listas; assert por campo, no snapshot completo |
| **R7** | Bootstrap lanza si faltan env vars (V1) | Host de test no arranca | Factory inyecta siempre las claves (§6) |
| **R8** | Los tests corren en paralelo (xunit) → varios factories con su propia BD | OK si cada clase usa su propio factory | Convención: **1 factory por clase de test**, nunca estático compartido entre clases |

---

## 9. Comandos de ejecución

```bash
# Desde la raíz del repo

# 1) Suite completa de tests (unit + integración)
dotnet test ShopMGR.Tests

# 2) Solo los tests de integración nuevos (clases con sufijo ApiTests)
dotnet test ShopMGR.Tests --filter "FullyQualifiedName~ApiTests"

# 3) Una feature puntual (ej: auth)
dotnet test ShopMGR.Tests --filter "FullyQualifiedName~LoginApiTests"

# 4) Cobertura de código (coverlet ya configurado en ShopMGR.Tests.csproj)
dotnet test ShopMGR.Tests --collect:"XPlat Code Coverage"

# 5) Reporte HTML de cobertura (requiere dotnet-reportgenerator-globaltool)
reportgenerator -reports:ShopMGR.Tests/TestResults/*/coverage.cobertura.xml -targetdir:ShopMGR.Tests/TestResults/coverage-report -reporttypes:Html
```

**Criterio de salida en CI**: `dotnet test ShopMGR.Tests` en verde (0 fallos, 0 flaky en 2 corridas) + cobertura por criterio ≥ 80% (ver `coverage-report.md`).

---

## 10. Definición de Done (DoD)

- [ ] Los 4 entregables v1.0 generados (este plan + `test-cases.md` + `automation-scripts.md` + `coverage-report.md`)
- [ ] Suite implementada (por el dueño) con los casos de `test-cases.md` → **gate QA independiente** (patrón híbrido del proyecto, iteración #74-35)
- [ ] Suite completa verde en 2 corridas (0 flaky)
- [ ] Cobertura de criterios de aceptación ≥ 80% verificada contra la matriz de `coverage-report.md`
- [ ] Bugs encontrados → GitHub Issue (`bug` + `severity/*`) con evidencia; ninguno Critical abierto

---

## 11. Entregables

| Documento | Archivo |
|---|---|
| Test Plan | `docs/qa/test-plan.md` (este) |
| Test Cases | `docs/qa/test-cases.md` |
| Automation Scripts | `docs/qa/automation-scripts.md` |
| Coverage Report | `docs/qa/coverage-report.md` |

---

## 12. Suite MetricasRepositorio (issue #95)

Suite de **tests de repositorio** (unit, InMemory + repositorio directo — mismo patrón que `ClienteRepositorioTests`/`TrabajoRepositorioTests`), complementaria a la suite de integración HTTP de las secciones 1–11.

| Campo | Valor |
|---|---|
| **Archivo** | `ShopMGR.Tests/MetricasRepositorioTests.cs` |
| **Clase** | `MetricasRepositorioTests` (13 tests, `[Fact]`) |
| **Alcance** | `MetricasRepositorio`: `ObtenerIngresosAsync`, `ObtenerHorasAsync`, `ObtenerTrabajosTerminadosAsync`, `ObtenerPresupuestosCreadosAsync`, `ObtenerPresupuestosAceptadosAsync` |
| **Provider** | EF Core **InMemory** (`UseInMemoryDatabase` con nombre `Guid` por test → aislamiento total) |
| **Fixture de fechas** | Movimientos: mes fijo `2026-07` (el constructor de `MovimientoBalance` acepta fecha explícita). Trabajos/Presupuestos/Horas: fechas = `DateTime.Now` (setters privados del dominio) → período actual con `Hoy` y período vacío con `2000-01` |

### Contexto del cambio (fuente de los asserts — Regla de No Inventar)

| # | Verificación | Hallazgo | Impacto en la suite |
|---|---|---|---|
| M1 | `MetricasRepositorio.ObtenerIngresosAsync` (working tree, issue #95) | Antes: `Trabajos.Where(FechaFin mes).Sum(TotalLabor ?? 0m)`. **Ahora**: `MovimientoBalance.Where(Tipo == Pago && Fecha año/mes).Sum(Monto)` | Asserts de ingresos = suma de Pagos del mes; el test de regresión (TC-MET-06) fallaría con el código viejo |
| M2 | `TipoMovimiento` enum | `Pago=0, Cargo=1, Anticipo=2, Compra=3, Ajuste=4`. **Decisión de dominio: NO se agrega `Cobro`** | La exclusión por tipo cubre los 5 valores existentes (TC-MET-02) |
| M3 | `MovimientoBalance.Monto` (setter privado) | Normaliza signo: `Cargo`/`Compra` positivos → se persisten **negativos**; `Pago`/`Anticipo` positivos → positivos | El fix excluye por `Tipo`, no por signo — documentado en TC-MET-02 |
| M4 | `Trabajo.FechaFin` | Solo `TerminarTrabajo()` lo setea (constructor con `EstadoTrabajo` **no** lo hace) | Helper `CrearTrabajoTerminadoAsync` en la suite; sin `FechaFin`, `ObtenerTrabajosTerminadosAsync` no contaría (filtra `FechaFin.HasValue`) |
| M5 | `Presupuesto.Fecha`/`FechaAceptado`, `HorasYDescripcion.Fecha` | Setters privados; fijadas a `DateTime.Now` en construcción/transición | Períodos "actual" vs "vacío" (2000-01) para los asserts de regresión |

### Criterios de aceptación cubiertos (issue #95)

| Criterio | Casos |
|---|---|
| CA1 — Ingresos = suma de movimientos `Pago` del mes (múltiples Pagos) | TC-MET-01 |
| CA2 — Excluye los demás tipos del mismo mes (Cargo, Compra, Anticipo, Ajuste) | TC-MET-02 |
| CA3 — Filtra por mes y por año | TC-MET-03, TC-MET-04 |
| CA4 — Mes sin movimientos → 0 | TC-MET-05 |
| CA5 — No suma `TotalLabor` de trabajos Terminado (regresión del cambio) | TC-MET-06 |
| CA6 — Los otros 4 métodos del repositorio siguen funcionando (regresión) | TC-MET-07..13 |

**Cobertura de criterios #95: 6/6 = 100%** (ver `coverage-report.md` §7).
