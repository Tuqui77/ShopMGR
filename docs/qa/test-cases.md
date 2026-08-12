# Test Cases — Suite de Integración Backend (#82) + MetricasRepositorio (#95)

| Campo | Valor |
|---|---|
| **Versión** | v1.2 (implementada y verificada) |
| **Fecha** | 2026-08-11 |
| **Autor** | QA Automation |
| **Issue** | #82, #95 (suite MetricasRepositorio) |
| **Convención de IDs** | `TC-<FEATURE>-<n>` — AUTH (login/refresh/logout), CLI (clientes), TRA (trabajos), PRE (presupuestos), EXP (exploratory), MET (métricas) |
| **Fuente de asserts** | Contrato verificado en `test-plan.md` §3 (V1–V15) y §12 (M1–M5) — ningún assert es inventado. Discrepancias detectadas al implementar se documentan en `coverage-report.md` §4 |

**Tipos**: `Happy` (flujo feliz) · `Negative` (errores) · `Contrato` (headers/cookies/JWT) · `Exploratory` (por investigar, se documenta el hallazgo).

**Códigos**: 200 OK · 400 validación/negocio · 401 no autenticado · 404 no encontrado · 500 error interno.

---

## A. Auth — flujo crítico (P0)

| ID | Título | Tipo | Precondiciones | Pasos | Resultado esperado |
|---|---|---|---|---|---|
| TC-AUTH-01 | Login con credenciales válidas devuelve JWT + cookie refresh | Happy | Host de test con Bootstrap (admin sembrado) | `POST /api/Auth/IniciarSesion` body `{"userName":"admin","password":"Admin123!"}` | **200**. Body: `accessToken` JWT no vacío, `requiereCambioContraseña=false`, **`refreshToken` AUSENTE** ([JsonIgnore]). Header `Set-Cookie` contiene `refreshToken=` con `HttpOnly`, `SameSite=Strict`, `Path=/api/Auth`, `Expires` ≈ +30 días |
| TC-AUTH-02 | Login con contraseña incorrecta → 400 | Negative | Bootstrap sembrado | `POST IniciarSesion` con `password:"incorrecta"` | **400** (V7): body string `"Nombre de usuario o contraseña incorrectos"` (NOTA: el API usa 400, no 401 — contrato asimétrico documentado) |
| TC-AUTH-03 | Login con usuario inexistente → 400 | Negative | Bootstrap sembrado | `POST IniciarSesion` con `userName:"no-existe-xyz"` | **400** mismo mensaje que TC-AUTH-02 (no filtra cuál falló — comportamiento deseado de seguridad) |
| TC-AUTH-04 | Login con body malformado (sin password) → 400 | Negative | — | `POST IniciarSesion` con `{"userName":"admin"}` | **400** ProblemDetails (validación `[ApiController]` — V6) |
| TC-AUTH-05 | Login con body vacío → 400 | Negative | — | `POST IniciarSesion` con `{}` | **400** ProblemDetails (ambos campos `[Required]`) |
| TC-AUTH-06 | Endpoint protegido sin token → 401 | Contrato | — | `GET /api/Auth` sin header Authorization | **401** (JWT middleware) |
| TC-AUTH-07 | Endpoint protegido con token válido → 200 | Contrato | Login previo (TC-AUTH-01) | `GET /api/Auth` con `Authorization: Bearer <accessToken>` | **200** body `"Autenticado"` |
| TC-AUTH-08 | Refrescar sin cookie → 401 | Contrato | — | `POST /api/Auth/Refrescar` sin Cookie | **401** (V7) |
| TC-AUTH-09 | Refrescar con cookie válida rota el token | Contrato | Login previo; capturar cookie de la respuesta | `POST /api/Auth/Refrescar` con `Cookie: refreshToken=<token>` | **200**. Body con `accessToken` válido; Set-Cookie con `refreshToken` NUEVO (rotación). ⚠️ Verificado: el accessToken puede ser **byte-idéntico** al anterior si login+refresh caen en el mismo segundo (misma `exp`, sin `jti`) — la rotación observable es la cookie |
| TC-AUTH-10 | Cerrar sesión borra la cookie | Contrato | Login previo; cookie en el client | `POST /api/Auth/CerrarSesion` con cookie | **200** `"Sesión cerrada correctamente"`. Set-Cookie con `refreshToken=""` (borrado), mismos atributos `Path=/api/Auth`/`HttpOnly` — si difieren, el navegador no matchea la cookie original (bug ya cubierto por `AuthControllerTests` unit, se re-verifica en integración) |
| TC-AUTH-11 | Refresh token revocado no refresca | Negative | Login previo; `CerrarSesion` previo con la cookie | `POST Refrescar` con la cookie YA revocada | **401** `"Refresh Token inválido"` |
| TC-AUTH-12 | Registro de usuario nuevo → 200 | Happy | — | `POST /api/Auth/RegistrarUsuario` con `{"userName":"nuevo_<guid>","password":"Passw0rd!"}` | **200** `"Usuario creado con exito"`. El usuario existe en BD (`Usuarios`) y puede loguear |
| TC-AUTH-13 | Registro de usuario duplicado → 400 | Negative | Usuario ya creado (TC-AUTH-12) | `POST RegistrarUsuario` con el mismo userName | **400** `"El nombre de usuario ya esta en uso"` |

> ⚠️ **R1 (rate limit)**: TC-AUTH-01/02/03 + (opcional) TC-AUTH-04 suman ≤ 5 llamadas a `IniciarSesion` por clase → dentro del límite de 5/min. El 429 se automatizó en **factory aislado** (TC-EXP-02, `ApiRateLimitTests`) para no contaminar la suite compartida.

---

## B. Clientes — CRUD (P1)

| ID | Título | Tipo | Precondiciones | Pasos | Resultado esperado |
|---|---|---|---|---|---|
| TC-CLI-01 | Crear cliente válido | Happy | Token admin | `POST /api/Cliente/CrearCliente` body `{"nombreCompleto":"Cliente <guid>","cuit":"20-12345678-9"}` | **200** body con el cliente (id > 0). Persistido en BD (`Clientes`) |
| TC-CLI-02 | Crear cliente sin nombre → 400 | Negative | Token | `POST CrearCliente` con `{"cuit":"..."}` (sin nombre) | **400** ProblemDetails (`[Required]` — V6) |
| TC-CLI-03 | Crear cliente con nombre duplicado → 400 | Negative | Cliente `"Cliente dup"` ya existe | `POST CrearCliente` con el mismo nombre | **400** `{ "error": "Ya existe un cliente llamado Cliente dup" }` (InvalidOperationException → middleware — V5/V11) |
| TC-CLI-04 | Crear cliente sin token → 401 | Negative | — | `POST CrearCliente` sin Authorization | **401** |
| TC-CLI-05 | Listar clientes con datos | Happy | ≥1 cliente creado | `GET /api/Cliente/ObtenerListaClientes` | **200** array con los clientes (parsear con `JsonDocument` — R6). Contiene el creado |
| TC-CLI-06 | Listar clientes sin datos → 404 | Negative | BD vacía de clientes (clase con BD fresca) | `GET ObtenerListaClientes` | **404** `"No se encontraron clientes."` (V6) |
| TC-CLI-07 | Obtener cliente por id inexistente → 404 | Negative | — | `GET /api/Cliente/ObtenerClientePorId?idCliente=999999` | **404** `{ "error": "No se encontró un cliente con el ID 999999." }` (KeyNotFoundException → V5/V11) |
| TC-CLI-08 | Obtener detalle por id (con direcciones/teléfonos) | Happy | Cliente con dirección + teléfono creados vía API o contexto | `GET /api/Cliente/ObtenerDetallePorId?idCliente=<id>` | **200** con `direccion` y `telefono` poblados (Include verificado en repositorio) |
| TC-CLI-09 | Buscar cliente por nombre exacto | Happy | Cliente `"Cliente Busqueda <guid>"` | `GET ObtenerClientePorNombre?nombre=Cliente Busqueda <guid>` | **200** con el cliente |
| TC-CLI-10 | Buscar cliente con nombre vacío → 400 | Negative | — | `GET ObtenerClientePorNombre?nombre=` | **400** ⚠️ Verificado: `?nombre=` no enlaza (query vacío → null) → validación automática del binding devuelve **ProblemDetails** antes del check del controller (`"Complete el nombre del cliente."` solo aplica si el valor no es null) |
| TC-CLI-11 | Modificar cliente existente | Happy | Cliente creado | `PATCH /api/Cliente/ModificarCliente?idCliente=<id>` body `ModificarCliente` | **200** `"Cliente actualizado correctamente."`; el cambio persiste (GET confirma) |
| TC-CLI-12 | Modificar cliente inexistente → 404 | Negative | — | `PATCH ModificarCliente?idCliente=999999` body válido | **404** `{ error: "No se encontró un cliente con el ID 999999." }` |
| TC-CLI-13 | Eliminar cliente existente | Happy | Cliente creado sin trabajos asociados | `DELETE /api/Cliente/EliminarCliente?idCliente=<id>` | **200** `"Cliente eliminado correctamente."`; GET posterior → 404 |
| TC-CLI-14 | Eliminar cliente inexistente → 404 | Negative | — | `DELETE EliminarCliente?idCliente=999999` | **404** |
| TC-CLI-15 | Crear movimiento de balance | Happy | Cliente existente | `POST /api/Cliente/CrearMovimiento` body `MovimientoBalanceDTO` | **200** body con el movimiento; el balance del cliente refleja el monto (calcular y assertear el delta) |

---

## C. Trabajos — CRUD + estados (P1)

| ID | Título | Tipo | Precondiciones | Pasos | Resultado esperado |
|---|---|---|---|---|---|
| TC-TRA-01 | Crear trabajo válido | Happy | Cliente existente | `POST /api/Trabajos/CrearTrabajo` body `{"titulo":"Trabajo <guid>","idCliente":<id>,"estado":"Pendiente"}` | **200** body con el trabajo (id > 0, estado `Pendiente`). Persistido |
| TC-TRA-02 | Crear trabajo sin título → 400 | Negative | Cliente | `POST CrearTrabajo` con `{"idCliente":<id>}` | **400** ProblemDetails (`[Required]` título — V6) |
| TC-TRA-03 | Crear trabajo sin token → 401 | Negative | — | `POST CrearTrabajo` sin Authorization | **401** |
| TC-TRA-04 | Listar trabajos | Happy | ≥1 trabajo | `GET /api/Trabajos/ObtenerListaTrabajos` | **200** array; incluye `cliente` (Include verificado). **NOTA**: este endpoint figuraba como gap en `AGENTS.md` — verificado: YA existe (V15) |
| TC-TRA-05 | Obtener trabajo por id inexistente → 404 | Negative | — | `GET ObtenerTrabajoPorId?idTrabajo=999999` | **404** `{ error: "No existe un trabajo con el Id 999999" }` (V5/V11) |
| TC-TRA-06 | Obtener trabajos por cliente sin datos → 404 | Negative | Cliente sin trabajos | `GET ObtenerTrabajosPorCliente?idCliente=<id>` | **404** `"No se encontraron trabajos para el cliente con ID <id>."` (controller) |
| TC-TRA-07 | Obtener trabajos por estado sin datos → 404 | Negative | — | `GET ObtenerTrabajosPorEstado?estado=Terminado` (sin trabajos terminados) | **404** `"No se encontro ningun trabajo Terminado."` |
| TC-TRA-08 | Iniciar trabajo | Happy | Trabajo `Pendiente` | `PATCH /api/Trabajos/IniciarTrabajo?idTrabajo=<id>` | **200** `"Trabajo #<id> marcado como iniciado."`; estado → `Iniciado` (GET confirma) |
| TC-TRA-09 | Terminar trabajo | Happy | Trabajo `Iniciado` (vía flujo: crear → AgregarHoras) | `PATCH /api/Trabajos/TerminarTrabajo?idTrabajo=<id>` | **200** `"Trabajo #<id> marcado como terminado."`; estado → `Terminado`. ⚠️ Verificado: `TerminarTrabajo` persiste un movimiento con `TotalLabor.Value` → el trabajo **debe tener horas** (400 si TotalLabor es null) |
| TC-TRA-10 | Modificar trabajo | Happy | Trabajo existente | `PATCH /api/Trabajos/ModificarTrabajo?idTrabajo=<id>` body `ModificarTrabajo` **completo** (titulo, descripcion, idCliente, estado — `Titulo` es no-nullable) | **200** `"Trabajo actualizado correctamente."`; persistido |
| TC-TRA-11 | Agregar horas de trabajo | Happy | Trabajo existente + `ValorHoraDeTrabajo` configurado (seed en `InitializeAsync`) | `POST /api/Trabajos/AgregarHorasDeTrabajo` body `HorasYDescripcionDTO` (idTrabajo válido) | **200** `"<n> horas de trabajo agregadas al trabajo con ID <id> correctamente."`; la hora persiste en `HorasYDescripcion`. ⚠️ Verificado: trabajo sin presupuesto requiere `ObtenerCostoHoraDeTrabajo` (404 si falta la config) |
| TC-TRA-12 | Eliminar trabajo | Happy | Trabajo existente | `DELETE /api/Trabajos/EliminarTrabajo?idTrabajo=<id>` | **200** `"Trabajo eliminado correctamente."`; GET posterior → 404 |
| TC-TRA-13 | Eliminar trabajo inexistente → 404 | Negative | — | `DELETE EliminarTrabajo?idTrabajo=999999` | **404** |

---

## D. Presupuestos — CRUD + estados (P1)

| ID | Título | Tipo | Precondiciones | Pasos | Resultado esperado |
|---|---|---|---|---|---|
| TC-PRE-01 | Crear presupuesto válido (con materiales) | Happy | Cliente existente | `POST /api/Presupuestos/CrearPresupuesto` body `PresupuestoDTOcreacion` (`titulo`, `horasEstimadas`, `idCliente`, `materiales` con `nombre`+`precio`) | **200** con el presupuesto creado; `materiales` persistidos (`Materiales` — AddRange en repositorio) |
| TC-PRE-02 | Crear presupuesto sin título → 400 | Negative | Cliente | `POST CrearPresupuesto` con `{"idCliente":<id>}` | **400** ProblemDetails (`[Required]` — V6) |
| TC-PRE-03 | Listar presupuestos | Happy | ≥1 presupuesto | `GET /api/Presupuestos/ListarPresupuestos` | **200** array |
| TC-PRE-04 | Obtener presupuesto por id inexistente → 404 | Negative | — | `GET ObtenerPresupuestoPorId?idPresupuesto=999999` | **404** `{ error: "No existe un presupuesto con el Id 999999" }` (V5/V11) |
| TC-PRE-05 | Obtener presupuestos por cliente sin datos → 404 | Negative | Cliente sin presupuestos | `GET ObtenerPresupuestosPorCliente?idCliente=<id>` | **404** `"No se encontraron presupuestos para el cliente con ID <id>."` |
| TC-PRE-06 | Aceptar presupuesto | Happy | Presupuesto `Pendiente` | `PATCH /api/Presupuestos/AceptarPresupuesto?idPresupuesto=<id>` | **200**; estado → `Aceptado` (enum verificado: `EstadoPresupuesto.Aceptado`) |
| TC-PRE-07 | Rechazar presupuesto | Happy | Presupuesto `Pendiente` | `PATCH /api/Presupuestos/RechazarPresupuesto?idPresupuesto=<id>` | **200**; estado → `Rechazado` |
| TC-PRE-08 | Actualizar presupuesto | Happy | Presupuesto existente + `ValorHoraDeTrabajo` configurado | `PATCH /api/Presupuestos/ActualizarPresupuesto?idPresupuesto=<id>` body `ModificarPresupuesto` **completo** (titulo, descripcion, horasEstimadas, idCliente, materiales — `HorasEstimadas` usado con `!.Value` y `Materiales` no-nullable: body parcial → 400) | **200** `"Presupuesto modificado correctamente"`; persistido |
| TC-PRE-09 | Eliminar presupuesto | Happy | Presupuesto existente | `DELETE /api/Presupuestos/EliminarPresupuesto?idPresupuesto=<id>` | **200** `"Presupuesto eliminado correctamente."`; GET posterior → 404 |
| TC-PRE-10 | Obtener costo hora de trabajo | Happy | — | `GET /api/Presupuestos/ObtenerCostoHoraDeTrabajo` | **200** con el costo hora actual (decimal) |
| TC-PRE-11 | Actualizar costo hora | Happy | — | `PATCH ActualizarCostoHoraDeTrabajo?nuevoCosto=150` | **200** ⚠️ Verificado: body `"150.0"` (serialización decimal JSON, no `150`); `ObtenerCostoHoraDeTrabajo` posterior devuelve `150.0`. Parsear con `decimal.Parse(..., InvariantCulture)` (culture es-AR convierte `"150.0"` → 1500) |

---

## E. Exploratory (automatizados en v1.1 — hallazgos documentados)

| ID | Título | Motivo | Comportamiento esperado a verificar | Resultado documentado |
|---|---|---|---|---|
| TC-EXP-01 | Crear trabajo/presupuesto con `idCliente` inexistente | V12: los repositorios de creación NO validan la existencia del cliente | SQLite: violación de FK → **500**; InMemory: se crea sin error. Verificar comportamiento actual y documentar la brecha | ✅ **EJECUTADO (H3)**: `CrearTrabajo` idCliente=999999 → **500** (FK); `CrearPresupuesto` → **404** `"El valor de la hora de trabajo no esta configurado"` (falla antes del FK). **Issue #126** abierto (`bug`, `severity: medium`, debería ser 400/404) |
| TC-EXP-02 | Rate limit de login (429) | R1: automatizarlo contaminaría la IP en la suite compartida | 6º `IniciarSesion` en 1 min desde 127.0.0.1 → **429** `"Demasiados intentos de inicio de sesión, inténtelo de nuevo en unos minutos"` | ✅ **AUTOMATIZADO** (`ApiRateLimitTests`): factory aislado + `TokenCompartido` (0 logins por fixture) → 6º login → **429** verificado, sin flakiness |
| TC-EXP-03 | Respuestas de colecciones con `$id`/`$values` | V14: `ReferenceHandler.IgnoreCycles` | Los arrays traen `$id`/`$values` → asserts deben leer `$values` | ✅ **RESUELTO**: helper `LeerValores` en `ApiTestsBase` |

---

## F. Métricas — suite de repositorio (issue #95)

> Suite unit de repositorio (`MetricasRepositorioTests`, InMemory + repositorio directo — patrón de `ClienteRepositorioTests`). Fuente de asserts: test-plan §12 (M1–M5). Los resultados esperados validan el **comportamiento correcto** del fix (tipo `Happy`); los de exclusión/filtro verifican que NO se incluye lo incorrecto (clave del issue #95).

| ID | Título | Tipo | Precondiciones | Pasos | Resultado esperado |
|---|---|---|---|---|---|
| TC-MET-01 | Ingresos = suma de múltiples Pagos del mes | Happy | Cliente en BD; 3 Pagos en 2026-07 (100 + 250.50 + 49.99) | `ObtenerIngresosAsync(2026-07-15)` | **400.49** (decimal exacto) |
| TC-MET-02 | Solo suma Pagos; excluye Cargo/Compra/Anticipo/Ajuste del mismo mes | Happy | Cliente; en 2026-07: Pago 100 + Cargo 50 + Compra 30 + Anticipo 20 + Ajuste 10 (M2/M3: los no-Pago se excluyen por `Tipo`, no por signo) | `ObtenerIngresosAsync(2026-07-15)` | **100** (solo el Pago; el resto de tipos no suma) |
| TC-MET-03 | Ignora movimientos de otro mes | Happy | Cliente; Pagos 2026-06 (300), 2026-07 (100), 2026-08 (500) | `ObtenerIngresosAsync(2026-07-15)` | **100** (mes julio, sin junio/agosto) |
| TC-MET-04 | Ignora movimientos de otro año | Happy | Cliente; Pagos 2025-07 (999), 2026-07 (100), 2027-07 (999) | `ObtenerIngresosAsync(2026-07-15)` | **100** (año 2026, sin 2025/2027) |
| TC-MET-05 | Mes sin movimientos → 0 | Happy | Cliente; solo un Pago en 2026-08 | `ObtenerIngresosAsync(2026-07-15)` | **0** |
| TC-MET-06 | No suma `TotalLabor` de trabajos Terminado (regresión del cambio) | Happy | Cliente; trabajo Terminado con `TotalLabor` 9999 (hoy, M4) + Pago 100 (hoy) | `ObtenerIngresosAsync(Hoy)` | **100** — con el código viejo (Sum de TotalLabor) devolvería 9999+100; el test fallaría si se restaura |
| TC-MET-07 | `ObtenerHorasAsync` suma horas del mes/año, ignora otros períodos | Happy | Cliente + trabajo; horas 2.5 y 1.5 (hoy) + 50 (2000-01) | `ObtenerHorasAsync(Hoy)` | **4** |
| TC-MET-08 | `ObtenerTrabajosTerminadosAsync` cuenta solo Terminado del mes | Happy | Cliente; 2 trabajos Terminado (hoy, vía `TerminarTrabajo()` — M4) + 1 Pendiente + 1 Iniciado | `ObtenerTrabajosTerminadosAsync(Hoy)` | **2** |
| TC-MET-09 | `ObtenerTrabajosTerminadosAsync` mes sin terminados → 0 | Happy | Cliente; 1 trabajo Terminado (hoy) | `ObtenerTrabajosTerminadosAsync(2000-01-15)` | **0** |
| TC-MET-10 | `ObtenerPresupuestosCreadosAsync` cuenta los del mes | Happy | Cliente; 2 presupuestos (Fecha = hoy al construirse, M5) | `ObtenerPresupuestosCreadosAsync(Hoy)` | **2** |
| TC-MET-11 | `ObtenerPresupuestosCreadosAsync` mes sin presupuestos → 0 | Happy | Cliente; 1 presupuesto (hoy) | `ObtenerPresupuestosCreadosAsync(2000-01-15)` | **0** |
| TC-MET-12 | `ObtenerPresupuestosAceptadosAsync` cuenta solo aceptados del mes | Happy | Cliente; 2 presupuestos Aceptado (`FechaAceptado` = hoy, M5) + 1 Rechazado (sin `FechaAceptado`) | `ObtenerPresupuestosAceptadosAsync(Hoy)` | **2** |
| TC-MET-13 | `ObtenerPresupuestosAceptadosAsync` mes sin aceptados → 0 | Happy | Cliente; 1 presupuesto Aceptado (hoy) | `ObtenerPresupuestosAceptadosAsync(2000-01-15)` | **0** |

---

## G. Resumen de cobertura de criterios

| Criterio de aceptación (#82) | Casos que lo cubren | Estado |
|---|---|---|
| CA1 — Login valida credenciales reales y emite JWT/cookie | TC-AUTH-01..05 | ✅ Implementado (PASS) |
| CA2 — Endpoints protegidos rechazan sin token | TC-AUTH-06, TC-CLI-04, TC-TRA-03 | ✅ Implementado (PASS) |
| CA3 — Refresh token rota y se revoca | TC-AUTH-08..11 | ✅ Implementado (PASS) |
| CA4 — CRUD Clientes completo (crear/listar/obtener/modificar/eliminar + errores) | TC-CLI-01..15 | ✅ Implementado (PASS) |
| CA5 — CRUD Trabajos + transiciones de estado + errores | TC-TRA-01..13 | ✅ Implementado (PASS) |
| CA6 — CRUD Presupuestos + aceptar/rechazar + costo hora + errores | TC-PRE-01..11 | ✅ Implementado (PASS) |
| CA7 — Assertions reales (no `typeof === 'function'` / no pasamano) | Todos (asserts contra el contrato V1–V15) | ✅ Implementado (PASS) |

**Cobertura verificada: 7/7 criterios = 100%** — 55/55 tests PASS, 2 corridas consecutivas sin flakiness (2026-08-09).
