# Product Management Tracking - Sprint Board

## Historial de Solicitudes (Changelog)
- **[Iteración 1]**: Sprint 1 — Setup del proyecto, arquitectura base (backend .NET 9 + frontend React/Vite), entidades core (Clientes, Trabajos, Presupuestos, Movimientos).
- **[Iteración 2]**: Sprint 2 — Auth (JWT + refresh tokens + rate limiting), Passkeys WebAuthn/FIDO2 (registro, login, gestión en Configuración, validación userHandle, fix IDOR), fixes de frontend (tokens Zustand↔localStorage, refresh en body, FAB en modales). Release mergeado: PR #111 (`development` → `main`, `80f7c19`).
- **[Iteración 3]**: Definición del Sprint 3 (2026-08-01). El usuario define alcance: **Bloque A completo (auth UX)** + 3 issues nuevos de seguridad/operaciones de auth (#114 SEV-001, #115 FUN-001, #116 OPS-001) + #75 + #57.
- **[Iteración 26]**: Sprint 3 completado + hotfix #121 desplegado a prod + Definición del Sprint 4 (2026-08-07). El dueño define alcance: **Dependabot (mayor prioridad)** + SEV-004 + #74 + #67 + #81/#82/#83 (tests) + #76. Se crean issues #123 (Dependabot, 26 alertas npm) y #124 (SEV-004). Documentación oficial del Sprint 4 en el board.

## Sprint Anterior: Sprint 3 (COMPLETADO — 2026-08-07)
**Objetivo del Sprint**: Consolidar la seguridad y robustez del flujo de auth (refresh tokens en cookie HttpOnly, revocación explícita, índice/purga, recuperación de contraseña admin, SRP) + mejoras UX de auth en frontend + hardening de infraestructura (#75) y validación de entrada (#57).
**Estado General**: Sprint COMPLETADO — PR #120 (release Sprint 3) MERGED (`5275c52`, 2026-08-07). Hotfix #121 (PR #122) MERGED y desplegado a prod OK (`6be2db0`, 2026-08-07) — issue #121 CLOSED. Sprint 4 definido (ver sección a continuación).

## Sprint Actual: Sprint 4 (DEFINIDO — 2026-08-07)
**Objetivo del Sprint**: Cerrar brechas de seguridad y deuda técnica acumulada: resolver vulnerabilidades de Dependabot (prioridad #1), eliminar SEV-004 (bootstrap admin + rate limit), separar Zustand de React Query (#74), lazy loading de rutas (#67), fortalecer la suite de tests (#81/#82/#83) y optimizar CI con cache (#76).

**Estado General**: Sprint 4 DEFINIDO por el dueño (2026-08-07). Pendiente: crear issues faltantes (hecho: #123 Dependabot, #124 SEV-004) y planificar orden de ejecución por dependencias. Issues #74/#67/#81/#82/#83/#76 ya existían en backlog.

### Issues del Sprint 4

| Issue | Descripción | Área | Type | Prioridad | Estado |
|-------|-------------|------|------|-----------|--------|
| #123 | Vulnerabilidades de Dependabot — 26 alertas npm (11 high, 15 medium) | DevOps/Backend/Frontend | Bug (security) | Urgent | **Creado 2026-08-07** — mayor prioridad del sprint |
| #124 (SEV-004) | Restringir bootstrap del primer admin + rate limit en registro ("admin theft") | Backend | Feature (security) | Urgent | **Creado 2026-08-07** — deuda de release Sprint 3 |
| #74 | Separar Zustand (UI state) de React Query (server state) | Frontend | Refactor | High | OPEN — backlog previo |
| #67 | Lazy loading de rutas con React.lazy | Frontend | Feature | High | OPEN — backlog previo |
| #81 | Reescribir tests de frontend con assertions reales | Frontend | Test (qa) | High | OPEN — backlog previo |
| #82 | Tests de integración para endpoints críticos | Backend | Test (qa) | High | OPEN — backlog previo |
| #83 | Tests de seguridad (auth + autorización) | Backend | Test (qa) | High | OPEN — backlog previo |
| #76 | Cache de NuGet y npm en GitHub Actions | DevOps | Task | High | OPEN — backlog previo |

### Notas de Decisión (Definición Sprint 4)

- El dueño definió el alcance explícitamente: **Dependabot (mayor prioridad)** + SEV-004 + #74 + #67 + #81 + #82 + #83 + #76.
- El issue #123 (Dependabot) fue creado con el conteo real de alertas al 2026-08-07: 26 abiertas (0 critical, 11 high, 15 medium), ecosistema npm. Nota: la cifra previa del Sprint 3 ("56 vuln, 1 critical, 20 high") no coincide con el conteo actual de la API — verificar con `gh api /repos/Tuqui77/ShopMGR/dependabot/alerts`.
- El issue #124 (SEV-004) fue creado con contexto técnico del hallazgo MergeGuard PR #120 (migración OPS-001 `d4eff03` + patrón rate limit del login del Sprint 2).
- **Regla de ejecución**: backend/devops los ejecuta el usuario directamente; frontend se delega al subagente Frontend. #82/#83 son backend (usuario). #81 es frontend (subagente). #123 Dependabot es mixto (npm del Frontend + posiblemente backend) — verificar alcance real.
- **Dependencia clave**: #74 (Zustand↔React Query) toca la arquitectura de datos del frontend → conviene hacerlo ANTES de #67 (lazy loading) para no re-tocar rutas/páginas, y antes de #81 (tests) para que las assertions reales se escriban sobre el estado ya refactorizado.
- **Fuera de alcance en este sprint (por decisión del dueño)**: #118 (métricas históricas), #72/#73/#95/#93/#92/#91/#90/#89/#88/#87/#86/#85/#84/#80/#79/#78/#77/#70/#69/#68/#65/#64. Quedan en backlog.

### Backlog de Tareas Atómicas — Sprint 4

- [ ] **TSK-S4-01:** ✅ Alcance del Sprint 4 definido y documentado (issues creados/verificados: #123, #124 nuevos; #74/#67/#81/#82/#83/#76 existentes)
- [ ] **TSK-S4-02:** Planificar orden de ejecución según dependencias (Dependabot #123 → SEV-004 #124 → #74 → #67 → #81/#82/#83 → #76)
- [ ] **TSK-S4-03:** Implementar #123 (Dependabot — usuario + subagente según alcance)
- [ ] **TSK-S4-04:** Implementar #124 SEV-004 (backend — usuario ejecuta)
- [ ] **TSK-S4-05:** Implementar #74 (frontend — subagente Frontend)
- [ ] **TSK-S4-06:** Implementar #67 (frontend — subagente Frontend)
- [ ] **TSK-S4-07:** Implementar #81 (frontend — subagente Frontend/QA)
- [ ] **TSK-S4-08:** Implementar #82/#83 (backend — usuario ejecuta)
- [ ] **TSK-S4-09:** Implementar #76 (devops — usuario ejecuta)
- [ ] **TSK-S4-10:** QA de los cambios + MergeGuard + Release del Sprint 4

### Issues del Sprint 3

| Issue | Descripción | Área | Type | Prioridad | Estado |
|-------|-------------|------|------|-----------|--------|
| #114 (SEV-001) | Migrar RefreshToken a cookie HttpOnly con restricción de sitio | Backend+Frontend | Feature (security) | High | **In Progress — Commits + push OK (sin PR)** — validado en navegador (login/refresh/logout OK, cookie HttpOnly se elimina). 3 commits atómicos pusheados a `origin/development` (`3cadb14` backend, `8ae69cb` tests, `1a04df5` frontend). PR pendiente (el usuario lo hará al final del sprint) |
| #115 (FUN-001) | Revocación de refresh tokens depende de relationship fixup implícito de EF Core | Backend | Bug | High | **Listo — cierre pendiente del PR final** — revocación directa en la entidad (`e5d8533` + `7be19aa`), pusheado a `origin/development`. Validado por el usuario (el token se revoca sin depender de la relación con el usuario) |
| #116 (OPS-001) | Índice sobre RefreshTokens.Hash + purga de tokens expirados | Backend/DevOps | Task (perf/ops) | High | **Listo — cierre pendiente del PR final** — índice único a Hash con datetime2 (`270d985`), purga al iniciar sesión + BackgroundService cada 24 h (`26abfc4`), tests (`7d4d68f`), pusheado a `origin/development`. Validado por el usuario |
| #99 | Recuperar contraseña mediante admin con token de un solo uso (roles) | Backend | Feature | Medium | OPEN |
| #100 | Extraer acceso a datos de AdministrarAuth a repositorio (SRP) | Backend | Task (refactor) | Medium | OPEN |
| #112 | Submenú de usuario en Configuración + mover gestión passkeys | Frontend | Feature | Medium | OPEN |
| #113 | Botón "+" en vez de "Registrar dispositivo" en passkeys | Frontend | Fix | Low | OPEN |
| #96 | Botón mostrar/ocultar contraseña en login | Frontend | Feature | Medium | In Progress — delegado al subagente Frontend (2026-08-05) |
| #75 | Quitar puerto 1433 de SQL Server del host | DevOps | Task (security) | High | **Implementado — SIN COMMITEAR** — cambio en `docker-compose.yaml` pendiente de commit |
| #57 | Data annotations a DTOs de entrada | Backend | Feature (security) | High | In Progress — usuario ejecutando (2026-08-05) |
| #117 | Persistir teléfono al guardar cliente sin requerir botón "+" | Frontend | Bug (UX) | Medium | **Listo — cierre pendiente del PR final** — `bfa484a`, pusheado a `origin/development`. Completado en iteración previa |

### Backlog de Tareas Atómicas — Sprint 3

**Tareas Pendientes / En Progreso:**
- [ ] **TSK-S3-01:** ✅ Alcance del Sprint 3 definido y documentado (issues creados/verificados)
- [ ] **TSK-S3-02:** Planificar orden de ejecución según dependencias (auth backend → auth frontend → infra)
- [ ] **TSK-S3-03:** Implementar issues backend (usuario ejecuta) — #114, #115, #116, #99, #100, #57
- [ ] **TSK-S3-04:** Implementar issues frontend (subagente Frontend) — #112, #113, #96 (+ ajustes frontend de #114)
- [ ] **TSK-S3-05:** Implementar #75 (DevOps — usuario ejecuta)
- [ ] **TSK-S3-06:** QA de los cambios + MergeGuard + Release del Sprint 3

**Tareas Completadas (Sprints anteriores):**
- [x] **Sprint 2**: Auth JWT + refresh tokens + rate limiting
- [x] **Sprint 2**: Passkeys WebAuthn (registro, login, gestión, validación userHandle, fix IDOR)
- [x] **Sprint 2**: Fixes frontend (tokens Zustand↔localStorage, refresh en body, FAB en modales)
- [x] **Sprint 2**: Release PR #111 mergeado (`80f7c19`)

## Notas de Decisión (Iteración 3)

- El usuario definió el alcance del Sprint 3 explícitamente: Bloque A completo (#99, #100, #112, #113, #96) + SEV-001 (#114) + FUN-001 (#115) + OPS-001 (#116) + #75 + #57.
- Los issues #114, #115, #116 fueron creados con contexto técnico verificado en la codebase (AuthController, AdministrarAuth, RefreshToken, UsuarioConfiguracion, RefreshTokenConfiguracion).
- Dependencia clave: #114/#115/#116 tocan el mismo flujo de refresh tokens → implementar juntos para no rehacer.
- Backend/DevOps: el usuario ejecuta directamente (patrón del proyecto). Frontend: se delega al subagente Frontend.

## Iteración 4 (2026-08-01) — Issue #114: Hallazgos de QA (tests backend)

- QA escribió `ShopMGR.Tests/AuthControllerTests.cs` (10 tests de contrato de cookie con DefaultHttpContext). Suite: **128 PASS / 5 FAIL / 1 SKIP** (SKIP pre-existente ajeno).
- **BUG #1 (High)**: `GuardarRefreshTokenCookie` usa `Path = "/api/AuthController"` pero el controller responde en `/api/Auth/*` (`[Route("api/[controller]")]`) → el navegador nunca envía la cookie → refresh/logout rotos. Fix: `Path = "/api/Auth"`.
- **BUG #2 (High)**: `Response.Cookies.Delete("refreshToken")` sin `CookieOptions` → borra con `path=/` que no matchea la cookie original (Path `/api/AuthController`, HttpOnly, SameSite=Strict, Secure) → el navegador no borra la cookie. Fix: pasar los mismos options.
- Observaciones Low: `DateTimeOffset.Now` → `UtcNow` (consistencia/DST); hardcodear `Expires=+30 días` → mover a configuración.
- Frontend (#114) implementado por subagente Frontend: 10 archivos, `npm run lint` ✅, `npx vitest run` ✅ 116/116, `npm run build` ✅. Eliminado `refreshToken` de store (versión 2 + migrate), interceptor refresh sin body, services sin parámetro, type guard passkeys sin refreshToken.
- Frontend confirma de forma independiente el mismo hallazgo del Path y maneja el fallo de refresh con logout+redirect (seguro de desplegar).
- Próximo paso: el usuario corrige los 2 bugs backend; luego QA re-corre tests (deben pasar 10/10).

## Iteración 5 (2026-08-01) — Issue #114: Fix backend aplicado y validado

- El usuario corrigió los 2 bugs: `GuardarRefreshTokenCookie` usa `Path = "/api/Auth"` y se creó helper `BorrarRefreshTokenCookie()` que hace `Response.Cookies.Delete("refreshToken", opciones)` con los mismos CookieOptions (HttpOnly, Secure, SameSite=Strict, Path).
- Verificado en diff: `CerrarSesion()` llama `BorrarRefreshTokenCookie()` siempre (defensivo) y revoca solo si hay cookie.
- `dotnet test ShopMGR.Tests`: **133 PASS / 0 FAIL / 1 SKIP** (SKIP pre-existente `PresupuestoRepositorioTests`, ajeno).
- Estado #114: **implementación completa** (backend + frontend + tests). Pendiente: validación en navegador (rebuild de contenedores), commits atómicos (aprobación del usuario) y PR → MergeGuard.

## Iteración 6 (2026-08-01) — Issue #114: Validación usuario + commits atómicos + push

- El usuario validó el flujo completo en el navegador: iniciar sesión y refresh funcionan, cookie es HttpOnly y al cerrar sesión se elimina correctamente.
- Usuario aprobó commits + push a origin, pero **NO crear PR** (para no disparar CI por cada commit; el PR se hará al final del sprint).
- 3 commits atómicos pusheados a `origin/development` sobre `80f7c19`:
  1. `3cadb14` `feat(auth): migrar refresh token a cookie HttpOnly` (backend: AuthController, RespuestaLogin, IAdministrarAuth, AdministrarAuth, appsettings.json)
  2. `8ae69cb` `test(auth): agregar tests de cookie HttpOnly en AuthController` (AuthControllerTests.cs, 373 líneas)
  3. `1a04df5` `feat(auth): adaptar frontend a refresh token en cookie HttpOnly` (10 archivos Frontend)
- Working tree limpio salvo `Sprint_Board.md` (untracked, queda fuera de la entrega).
- Nota del remote: Dependabot reporta 56 vulnerabilidades en branch default (1 critical, 20 high) — pendiente de revisión por el usuario.

## Iteración 7 (2026-08-01) — Decisión de diseño #116 + Issue nuevo #117

- **Decisión de diseño #116 (purga de tokens)**: el usuario consultó si conviene conservar tokens expirados/revocados vs eliminarlos al rotar. Decisión del PM: **conservar el hash del token rotado/revocado (con FechaExpiracion) y purgar por expiración**, no borrar al refrescar. Motivos: detección de replay/robo (un token ya rotado que vuelve a presentarse indica compromiso → revocar familia, patrón OAuth2 de rotación con detección de reuso) y auditoría/forense de sesiones. La tabla no crece indefinidamente porque la purga (job periódico) borra solo lo expirado.
- **Issue #117 creado** (`fix(clientes): persistir teléfono al guardar cliente sin requerir botón "+"`, labels `frontend`+`bug`+`priority: medium`): en `ClienteForm.tsx` el teléfono vive en `telefonoInput` y solo entra a `telefonos[]` con `handleAddTelefono()` (botón "+"); al submit se envía `telefono: telefonos` → si no se apretó "+", el dato se pierde. La dirección sí se persiste directo. Cambio: incluir el input pendiente al guardar (default descripción "Principal"), mantener "+" para múltiples teléfonos.
- Usuario: próximo sprint dedicado a resolver vulnerabilidades de Dependabot. Nota registrada.
- #116 en progreso por el usuario: index sobre `RefreshTokens.Hash` ya agregado.

## Iteración 8 (2026-08-01) — Issue #116: Implementación mixta del cleanup — BUG crítico detectado

- El usuario implementó el cleanup con enfoque mixto: (1) al iniciar sesión (password y passkey) se eliminan los refresh tokens expirados del usuario (`Usuario.EliminarRefreshTokensExpirados()` + `Include(u => u.RefreshTokens)` en `IniciarSesion`/`FinalizarAuthPasskey`); (2) servicio diario `RefreshTokenCleanupService` (BackgroundService, cada 24h) que barre toda la tabla. Sin período de gracia (documentado en comentario del service y de la entidad Usuario).
- Index único sobre `RefreshTokens.Hash` agregado en `RefreshTokenConfiguracion.cs`.
- **🐞 BUG CRÍTICO detectado en `RefreshTokenCleanupService.cs:31`**: `Where(rt => rt.ExpiraEn > DateTime.Now)` está **INVERTIDO** → elimina los tokens VÁLIDOS (que expiran en el futuro) y conserva los expirados. Consecuencia: el job diario rompería sesiones activas de todos los usuarios y no limpiaría nada de lo que debería. Fix: `rt.ExpiraEn <= DateTime.Now` (equivalente a `EstaExpirado`, que usa `>=`).
- Pendientes: fix del filtro, migración del índice (`HasIndex` requiere `dotnet ef migrations add` + aplicar), tests de cleanup (delegables a QA).

## Iteración 9 (2026-08-01) — Issue #116: Fix aplicado + Tests QA 7/7 PASS + migración del usuario

- El usuario corrigió el filtro del service: `rt.ExpiraEn <= DateTime.Now` ✅ (verificado).
- QA escribió tests delegados:
  - `ShopMGR.Tests/UsuarioTests.cs` (4 tests de dominio `EliminarRefreshTokensExpirados`, con reflexión para setters privados).
  - `ShopMGR.Tests/RefreshTokenCleanupServiceTests.cs` (3 tests con SQLite in-memory; estrategia híbrida: ejecuta el service real vía subclass + test de contrato que documenta por qué `>` era el bug). Agregado paquete `Microsoft.EntityFrameworkCore.Sqlite 9.0.0` al csproj de tests.
  - Resultado: **7/7 PASS**, suite completa **140 PASS / 1 SKIP** (SKIP pre-existente) — sin regresiones.
- El usuario creó la migración del índice en paralelo: `20260801231902_AgregarIndiceHashRefreshToken` (cs + Designer + snapshot modificado). Pendiente: aplicar a la BD.
- **🔴 Hallazgo QA (Alta, pre-existente)**: `RefreshTokenConfiguracion` usa `.HasColumnType("date")` en `CreadoEn`, `ExpiraEn` y `RevocadoEn` → SQL Server trunca a precisión de día: un token que expira 02/08 15:00 pasa a considerarse expirado desde las 00:00 (hasta 24h antes); `CreadoEn` pierde la hora (token de 30 días dura 29-30 días según hora de creación). Los tests no lo detectan (SQLite conserva precisión). Decisión pendiente del usuario: ¿cambiar a `datetime2` en la misma migración o documentar para después?
- Hallazgos menores QA: `EnsureCreated()` falla en SQLite por `nvarchar(max)` en PasskeyChallengeConfiguracion (tests usan esquema mínimo, OK); sugerencia de refactor de testabilidad (TimeProvider/reloj inyectable) → backlog.

## Iteración 10 (2026-08-01) — Issue #116: Diagnóstico de validación + fix passkey + commits atómicos

- **Problema reportado por el usuario**: modificó un refresh token en BD (ExpiraEn en fecha anterior) y no ve que se elimine al iniciar sesión.
- **Diagnóstico del PM con queries directas a la BD** (`podman exec shopmgr_db_1`):
  - Migración del índice SÍ aplicada: columnas `datetime2` + índice único `IX_RefreshTokens_Hash` verificados en `sys.columns`/`sys.indexes`.
  - El token modificado (Id=1, ExpiraEn 2026-07-25) seguía en la tabla a las 23:52.
  - La imagen del contenedor SÍ incluye el código nuevo (`EliminarRefreshTokensExpirados` presente en `ShopMGR.Aplicacion.dll`), BackgroundService registrado (`InyeccionServicios.cs:43`).
  - Cadena de tokens 18004→18008 (23:43-23:48) mostró que la prueba del usuario fue refresh, no login.
- **🐞 BUG real encontrado en flujo passkey**: `PasskeysRepositorio.ObtenerPasskeyPorRawId` hace `.Include(pk => pk.Usuario)` **sin `.ThenInclude(u => u.RefreshTokens)`** → en `FinalizarAuthPasskey` la colección `RefreshTokens` del usuario llega vacía → `EliminarRefreshTokensExpirados()` no elimina nada. Mismo patrón del issue #115 (FUN-001): la purga depende de que la colección esté cargada. El flujo password SÍ tiene el `Include` y funciona.
- **Fix del usuario**: agregó `.ThenInclude(u => u.RefreshTokens)` en `PasskeysRepositorio.cs:55` + probó que funciona. También validó que el BackgroundService elimina los expirados al reconstruir contenedores.
- **📌 Logs del BackgroundService no visibles**: causa encontrada — `appsettings.json` tiene `"LogLevel": {"Default": "Warning"}` y el service usa `_logger.LogInformation(...)` (Information queda por debajo de Warning → descartado). El service FUNCIONA (verificado en BD: 0 tokens expirados), solo no loguea visiblemente. Opciones si se quieren logs: subir el nivel del service a `LogLevel` con override específico (`"ShopMGR.Aplicacion.RefreshTokenCleanupService": "Information"`) o usar `LogWarning`. Pendiente decisión del usuario (no bloquea).
- **Commits atómicos creados (usuario autorizó "hacé los commits", sin push/PR)**:
  1. `26abfc4` `feat(auth): purgar refresh tokens expirados al iniciar sesión y con BackgroundService` (InyeccionServicios, AdministrarAuth, Usuario, BackgroundServices/, PasskeysRepositorio)
  2. `270d985` `fix(db): usar datetime2 en RefreshTokens y agregar índice único a Hash` (RefreshTokenConfiguracion + Migrations cs/Designer/snapshot)
  3. `7d4d68f` `test(auth): agregar tests de limpieza de refresh tokens expirados` (csproj + UsuarioTests + RefreshTokenCleanupServiceTests)
- Working tree limpio salvo `Sprint_Board.md` (untracked). Suite de tests: 140 PASS / 1 SKIP.
- Estado #116: **implementación completa + validada en BD**. Pendiente: push a origin (usuario decide timing) y PR al final del sprint → MergeGuard.

## Iteración 11 (2026-08-01) — #116 push a origin + #115 implementado + #117 frontend

- **Push #116 autorizado por el usuario y ejecutado**: `1a04df5..7d4d68f development -> development` (3 commits: `26abfc4`, `270d985`, `7d4d68f`). Verificado post-push: 0 commits sin pushear de #116.
- **Fix #115 implementado por el usuario y commiteado** (`e5d8533`): `Refrescar` y `CerrarSesion` ahora revocan el token directamente con `token!.Revocar()` (ya no dependen del relationship fixup implícito de EF Core); `CerrarSesion` ya no busca el usuario en BD. Commit: `fix(auth): revocar refresh token directamente en la entidad` (#115).
- **Limpieza complementaria del usuario**: eliminó el método `RevocarRefreshToken(string hash)` de `Usuario.cs` (dead code — verificado con `git grep`: 0 referencias en *.cs). Commit: `7be19aa` `refactor(auth): eliminar método RevocarRefreshToken sin uso` (#115).
- **Validación**: suite backend completa **140 PASS / 1 SKIP** (SKIP pre-existente) con el método eliminado — sin regresiones.
- **Issue #117 (teléfono) implementado por subagente Frontend** (working tree, sin commit):
  - `Frontend/src/components/ClienteForm.tsx`: en `handleSubmit` (rama de creación) si `telefonoInput` tiene texto pendiente se agrega a `telefonosParaEnviar` (dedupe + reemplazo si hay edición en curso; descripción default `"Principal"`).
  - `Frontend/src/__tests__/components/ClienteForm.test.tsx`: nuevo, 7 tests.
  - Verificado: `npm run typecheck` ✅, `npm run build` ✅, eslint ✅, suite 123/123 ✅.
  - Decisión adicional: validación de teléfono ≥10 dígitos aplicada también en `handleAddTelefono` (consistencia UX con el submit).
- **Pendientes en working tree**: `appsettings.json` (logging del usuario: `Default: Information` + EF `Warning`), `Sprint_Board.md` (untracked).
- **Branch**: `development...origin/development` adelante 2 (`e5d8533`, `7be19aa`) — push de #115 pendiente de decisión del usuario.

## Iteración 12 (2026-08-01) — #117: decición de UX del usuario → simplificar a teléfono único

- El usuario probó el fix #117 y confirmó que funciona, pero detectó que el botón "+" al lado del teléfono ya no aporta (el teléfono se persiste solo al crear). Decidió eliminarlo.
- PM presentó 2 opciones de alcance: A) solo quitar el botón (deja lista sin forma descubrible de agregar) vs B) simplificar todo el bloque a un único campo. **El usuario eligió la B**.
- Subagente Frontend implementó la B en `ClienteForm.tsx`:
  - Eliminados: `telefonoDesc`, `telefonos[]`, `editingTelefonoIndex`, handlers `handleAddTelefono`/`handleEditTelefono`/`handleRemoveTelefono`/`handleCancelEditTelefono`, iconos `Plus`/`Trash2`/`Pencil`.
  - UI: un único input `type="tel"` "Teléfono (opcional)" con validación ≥10 dígitos inline.
  - Submit: `telefono: telefono ? [{ telefono, descripcion: 'Principal' }] : []` (el tipo `CrearClienteRequest.telefono` es obligatorio → `[]` en vez de `undefined`; sin `id: 0` porque el tipo de creación no lo acepta — el backend auto-genera).
  - Tests reescritos: 7 → 4 (persiste con "Principal", vacío → `[]`, validación 10 dígitos, regresión guard: botón "+" no existe). Suite total 120/120 ✅, typecheck/lint/build ✅.
- Documentación actualizada: Sprint_Board + project-register. Pendiente: commit + push + PR del #117 (usuario decide timing), push #115.

## Iteración 13 (2026-08-01) — #117: recuperar campo de descripción del teléfono (ajuste UX)

- El usuario notó que con la opción B también desapareció el campo de descripción del teléfono, y pidió recuperarlo manteniendo la simplificación (1 teléfono, sin botón "+", sin lista).
- Ajuste aprobado y implementado por subagente Frontend:
  - Estado `telefonoDesc` re-agregado + limpio en `handleClose`.
  - UI: input teléfono único + input descripción opcional (placeholder "Descripción (ej: Celular, Trabajo)") debajo del error. Sin "+", sin lista.
  - Submit: `telefono: telefono ? [{ telefono, descripcion: telefonoDesc.trim() || 'Principal' }] : []` — descripción vacía → default "Principal"; teléfono vacío → `[]` (descripción ignorada).
  - Tests: 5 en ClienteForm (default Principal, descripción escrita, teléfono vacío → [], validación 10 dígitos, regresión sin botones/lista). Suite 121/121 ✅, typecheck/lint/build ✅.
- Pendiente: validación del usuario en navegador, luego commit + push + PR del #117.

## Iteración 14 (2026-08-01) — #117 validado + commits + estado Sprint 3

- El usuario validó el formulario en navegador: "Ahora sí funciona como corresponde".
- Commits atómicos autorizados y creados (sin push):
  1. `bfa484a` `fix(clientes): persistir teléfono al guardar cliente sin requerir botón '+'` (ClienteForm.tsx + ClienteForm.test.tsx) — #117
  2. `3fe5f9b` `chore(config): subir logging default a Information con EF en Warning` (appsettings.json)
- Branch: `development...origin/development` adelante 4 (`e5d8533` #115, `7be19aa` refactor, `bfa484a` #117, `3fe5f9b` chore). Working tree limpio salvo `Sprint_Board.md` (untracked).
- Estado Sprint 3 al cierre del turno: implementados #114 (push OK), #115 (local), #116 (push OK), #117 (local). Pendientes de sprint: #99, #100, #112, #113, #96 (Bloque A auth UX), #75 (DevOps), #57 (data annotations).

## Iteración 15 (2026-08-03) — Issue #99: fix persistencia de rol + gating frontend por rol admin

- **Fix de persistencia de rol (backend, usuario)**:
  - Causa raíz: la migración original `20260803213135_AgregaRolesYTokenUnUso` aplicó `Rol` con `defaultValue: ""` → EF materializaba `''` como `Administrador` (enum 0) → al elegir "Administrador" en UI no había cambio y `SaveChangesAsync` no emitía UPDATE.
  - El usuario regeneró la migración (`20260804005039_AgregaRolesYTokenUnUso`) con `HasMaxLength(20)` + `HasDefaultValue(RolUsuario.Empleado)` (aprendizaje: `HasDefaultValue` espera el tipo del modelo, no el de almacenamiento). Migración ya aplicada en BD + backfill `UPDATE Usuarios SET Rol='Empleado' WHERE Rol='' OR Rol IS NULL` + ajuste manual de la columna.
  - Backend ahora protege `PATCH /api/Auth/CambiarRol` con `[Authorize(Roles = "Administrador")]` → 403 a no-admins (validado por el usuario). El JWT incluye claim `role` (`AdministrarAuth.CrearToken`).
  - El usuario validó: cambio de contraseña y roles funcionan correctamente; no-admins reciben 403.
- **Gating frontend (subagente Frontend)** — aprobado por usuario (GATE) y verificado:
  - `Frontend/src/utils/jwt.ts` (nuevo): `obtenerRolDesdeToken(accessToken)` — decode local sin dependencias, fail-closed (token inválido/sin claim/rol desconocido → null).
  - `Frontend/src/pages/Configuracion.tsx`: card "Rol de usuario" solo visible si `rol === 'Administrador'`; preselección del rol actual; botón Guardar deshabilitado en no-op; tras cambiar rol → `authService.refrescar()` (primario, re-emite claim → card se oculta sola) con fallback `logout()` + redirect a `/login`.
  - Tests: `jwt.test.ts` 14/14, `Configuracion.test.tsx` 7/7 (admin visible / no-admin oculto / degradación Admin→Empleado), suite completa 142/142, lint/typecheck/build OK.
- **Nota futuro (registrado en issue)**: el usuario planea modificar el endpoint para editar roles de OTROS usuarios (finalidad buscada del issue).
- **Pendiente**: reconstruir contenedores (`podman compose down --remove-orphans && podman compose up --build -d`), verificación manual en navegador, luego commits autorizados.

## Iteración 16 (2026-08-04) — Issue #99: gestión de usuarios por admin + código de un solo uso + cambio forzado de contraseña

- **Backend (usuario + ajustes de PM)**:
  - `RespuestaLogin` ahora tiene `bool RequiereCambioContraseña` (default false) y constructor de 3 args `(accessToken, refreshToken, requiereCambioContraseña)`. `IniciarSesion` lo setea a true cuando el login se hace con código de un solo uso.
  - `IAdministrarAuth`: `CambiarContrasena(int idUsuario, string? contraseñaActual, string contraseñaNueva)` (actual opcional si `CodigoUsoUnico != null`), `RestaurarContraseña(int) → Task<string>`, `CambiarRolUsuario(int, RolUsuario)`, `ListarUsuariosAsync() → Task<List<ResumenUsuarios>>` (corregido: la interfaz quedó desincronizada con el servicio → error CS0738, el usuario la alineó).
  - Nuevo DTO `ResumenUsuarios { Id, UserName, Rol }` — NO expone `PasswordHash` ni `CodigoUsoUnico` (recomendación del PM por seguridad).
  - Controller: `PATCH CambiarContrasenaAdmin?idUsuario` (solo Admin, resuelve el IDOR detectado — el `CambiarContrasena` autenticado usa solo el id del token), `PATCH CambiarRol?idUsuario` (body directo del enum), `PATCH RestaurarContraseña?idUsuario` (genera + persiste + devuelve código de 6 chars con `SaveChangesAsync`), `GET ListarUsuariosAsync` (solo Admin).
  - Errores CS7036 corregidos: 3 en `AdministrarAuth.cs` (FinalizarAuthPasskey, Refrescar, IniciarSesion) por el constructor de 3 args + 4 en `AuthControllerTests.cs` (corregidos por el PM, permiso de AGENTS.md para tests). Build solución: **0 errores**; `AuthControllerTests` 10/10 verdes.
- **Frontend (subagente Frontend, GATE aprobado)**:
  - `types/index.ts`: `LoginResponse.requiereCambioContraseña: boolean` + `ResumenUsuario { id, userName, rol }`.
  - `services/auth.ts`: `cambiarContrasena(actual: string | null, nueva)` — omite `contraseñaActual` del query cuando es null; `cambiarRol(idUsuario, rol)`; nuevos `cambiarContrasenaAdmin(idUsuario, actual, nueva)`, `restaurarContraseña(idUsuario) → Promise<string>`, `listarUsuarios() → ResumenUsuario[]`.
  - `Login.tsx`: si `requiereCambioContraseña === true` → vista separada de cambio obligatorio (sin pedir la actual; omitida del query); al éxito limpia flag y navega a `/`. Botón "Cerrar sesión" para evitar usuario atascado.
  - `store/index.ts` + `App.tsx`: flag transitorio `cambioContraseñaPendiente` (no persistido, reset en logout) para que el redirect por accessToken no desmonte la vista de cambio.
  - `Configuracion.tsx`: eliminada la card obsoleta de auto-cambio de rol; nueva sección "Administrar usuarios" (solo Admin): dropdown de usuarios, cambio de rol (con refresh de token si es el propio usuario), restaurar contraseña (muestra código + botón copiar), cambio directo de contraseña de otro usuario. Estados loading/error/empty.
  - `jwt.ts`: `obtenerRolDesdeToken` y `obtenerIdUsuarioDesdeToken` validan el valor de cada claim antes de devolver (fallback robusto entre claims cortos y URIs largos).
  - Tests: `auth.test.ts` nuevo (8), `Configuracion.test.tsx` reescrito (11), `jwt.test.ts` +12 (33 total). **Suite 173/173**, lint/typecheck/build OK.
- **Pendiente**: reconstruir contenedores (`podman compose down --remove-orphans && podman compose up --build -d`), verificación manual en navegador (login con código → cambio forzado; admin: dropdown usuarios, cambiar rol, restaurar, copiar código), luego commits autorizados (backend sin commitear + frontend sin commitear).

## Iteración 17 (2026-08-05) — Issue #99: expiración del código de un solo uso + modal de cambio de contraseña

- **Backend (usuario) — expiración del código de un solo uso (5 min)**:
  - `Usuario.cs`: nuevo campo `DateTime? ExpiracionCodigoUsoUnico`; `GenerarCodigoUsoUnico()` setea `DateTime.Now.AddMinutes(5)`; nuevo método `EliminarCodigoUsoUnico()` limpia ambos campos (usado por `CambiarContrasena`).
  - `AdministrarAuth.cs` (IniciarSesion): `esCodigoUsoUnico` ahora exige `ExpiracionCodigoUsoUnico > DateTime.Now`; bloque de limpieza automática: si hay código con expiración pasada → `EliminarCodigoUsoUnico()` + `SaveChangesAsync()`.
  - Bug detectado por el PM: operador `<` invertido en la comparación de expiración (daba acceso SOLO cuando el código ya expiró); corregido a `>` (validado por el usuario en navegador).
  - Migración `20260805213336_AgregaExpiracionCodigoUnUso` (`datetime2` nullable) + `UsuarioConfiguracion` mapea la columna + snapshot.
- **Frontend (subagente Frontend) — modal de cambio de contraseña obligatorio (spec del usuario)**:
  - `Login.tsx`: la pantalla de login ya NO se reemplaza; se abre un modal (`.modal-backdrop` + `.modal-content`, patrón ClienteForm/HoursModal) sobre el form de login con el cambio de contraseña. Escape NO cierra (cambio obligatorio, evita perder el código); única salida: completar cambio o "Cerrar sesión". Passkey login oculto mientras el modal está abierto. Mejora a11y: `label htmlFor` ↔ `input id` en los 4 campos.
  - `Login.test.tsx` (nuevo, 5 tests): login normal navega; login con código muestra modal + form de login visible; mismatch valida; submit exitoso llama `cambiarContrasena(null, nueva)` y navega; "Cerrar sesión" limpia. Valida contrato con guard de App (`cambioContraseñaPendiente`).
  - Suite **178/178**, lint/typecheck/build OK.
- **Pendiente**: commits autorizados (backend expiración + frontend modal), push coordinado, cierre del issue #99 (criterio "Tokens expiran" ahora cumplido), release al final del sprint.

## Iteración 18 (2026-08-05) — Sprint 3: confirmación de issues completados + delegación #96

- **Usuario confirma implementación completa** (commits ya pusheados a `origin/development` en iteraciones previas, cierre de issues diferido al PR final):
  - **#115 (FUN-001)** — la revocación del refresh token funciona sin depender del relationship fixup implícito de EF Core (`e5d8533` fix + `7be19aa` refactor).
  - **#116 (OPS-001)** — índice único sobre `RefreshTokens.Hash` + `datetime2` (`270d985`); purga de tokens expirados al iniciar sesión y con BackgroundService cada 24 h (`26abfc4`); tests de limpieza (`7d4d68f`).
  - **#117** — persistencia del teléfono al guardar cliente sin botón "+" (`bfa484a`).
  - **#75** — puerto `1433:1433` eliminado de `docker-compose.yaml` (cambio SIN commitear aún).
- **Actualización del Sprint Board**: tabla de issues del Sprint 3 refleja el nuevo estado (5 listos + 1 implementado sin commitear + 1 en curso por el usuario + 1 delegado).
- **#96 delegado al subagente Frontend**: botón mostrar/ocultar contraseña en login (requisitos en la tarea del subagente).
- **#57 en curso**: el usuario comenzó data annotations a DTOs de entrada en paralelo.

## Iteración 19 (2026-08-05) — Sprint 3: #96 validado + #57 terminado + lote de commits + delegación #112/#113

- **#96 (mostrar/ocultar contraseña) implementado y validado por el usuario**:
  - `Login.tsx`: toggle en los 3 campos de contraseña (login + modal de cambio obligatorio) con `Eye`/`EyeOff` de Lucide, `type="button"`, `aria-label` + `aria-pressed`. Reset a oculto al fallar login, al abrir el modal y al cerrar sesión.
  - `Login.test.tsx`: +4 tests (toggle login, 2 toggles independientes en modal, reset al abrir modal, reset tras login fallido). Suite **182/182**, lint/typecheck/build OK.
- **#57 (data annotations a DTOs de entrada) terminado por el usuario**: 9 DTOs (`ClienteDTO`, `DireccionDTO`, `HorasYDescripcionDTO`, `MaterialDTO`, `MovimientoBalanceDTO`, `PresupuestoDTO`, `RespuestaLogin`, `TelefonoClienteDTO`, `TrabajoDTO`) + ajuste en `Dominio/Modelo/Trabajo.cs`.
- **Lote de commits** (decisión del usuario, opción C): commitear lote actual (#96 + #57 + #75 + docs) en paralelo con delegación de #112/#113 al subagente Frontend.

## Iteración 20 (2026-08-05) — Sprint 3: #112/#113 implementados + Issue nuevo #118 (métricas históricas)

- **#112 (submenú de usuario en Configuración) + #113 (botón "+" en passkeys) implementados por el subagente Frontend** (en paralelo con el lote de commits de la iteración 19):
  - `Configuracion.tsx`: nueva card "Usuario" con submenú de pestañas (`filter-pill` + `aria-pressed`): **Perfil** (rol + ID del JWT), **Seguridad** (card "Cambiar contraseña" movida intacta), **Passkeys** (`<PasskeySection embedded />`, ya no suelta al final). "Administrar usuarios" (solo admin, #99) intacto, verificado en navegador.
  - `PasskeySection.tsx`: prop `embedded?` (wrapper `.card` condicional) + botón "+" (`.btn-icon` con `Plus`, `aria-label` + `title` preservados).
  - Tests: `Configuracion.test.tsx` +5, `PasskeySection.test.tsx` nuevo +4. Suite **191/191**, lint/tsc/build OK.
  - **Pendiente**: validación del usuario en navegador + commits de #112/#113.
- **Issue nuevo #118 (feat metrics — comparación mes en curso vs anterior + sección de histórico)** creado en GitHub con labels `backend`, `frontend`, `priority: medium`:
  - Backend ya soporta consulta por mes (`MetricasController` acepta `DateOnly fecha`); el frontend hoy hardcodea el mes actual en `metricasService.obtenerTodas()`.
  - Criterios: comparación vs mes anterior en dashboard (con caso sin datos del mes anterior), nueva sección con selector mes/año, tests, endpoint único opcional (`ObtenerTodas`).
  - **Estado: Pending** — se planifica tras cerrar el Sprint 3 (#100 pendiente de backend y validación de #112/#113).

## Iteración 21 (2026-08-05) — Sprint 3: #100 terminado + feedback del usuario sobre #112

- **#100 (SRP en AdministrarAuth) terminado por el usuario** (backend, sin commitear aún):
  - Nuevos: `ShopMGR.Dominio/Abstracciones/IRepositorioUsuario.cs`, `ShopMGR.Repositorios/UsuarioRepositorio.cs`.
  - Modificados: `AdministrarAuth.cs`, `IAdministrarAuth.cs`, `InyeccionServicios.cs`, `AuthController.cs`.
- **Validación del usuario en navegador**:
  - **#113 OK** — botón "+" en passkeys funciona.
  - **#112 requiere rework (NO cumple la visión)**: la card "Usuario" con pestañas dentro de Configuración no es lo pedido. La idea es una **sección/página nueva** con todas esas configuraciones (perfil, seguridad, passkeys), accesible desde un **menú en la barra lateral** — idealmente un botón que muestre el **nombre de usuario**. Además, el **ID de usuario no debe mostrarse**.
- **Dato técnico clave**: el backend ya emite `ClaimTypes.Name` (UserName) en el JWT (`AdministrarAuth.cs:188`) — el frontend solo necesita un helper para leerlo (`jwt.ts` hoy solo tiene rol e id).
- **Rework #112 delegado al subagente Frontend**: nueva página de perfil/usuario + botón en Sidebar con nombre de usuario + quitar la card "Usuario" de Configuración + no mostrar el ID.

## Iteración 22 (2026-08-06) — Sprint 3: fixes de build/tests + issue #119 + lote de commits autorizado

- **Build backend ROTO tras el #100 del usuario**: `CerrarSesion` cambió de firma a `CerrarSesion(int idUsuario, string refreshTokenRequest)` (ahora recibe el id del claim `NameIdentifier` + el refresh token de la cookie), pero `AuthControllerTests.cs` seguía usando la firma vieja → 4× CS7036.
- **Fixes de tests (PM, permiso AGENTS.md)**:
  - `AuthControllerTests.cs`: `using System.Security.Claims`; helper `CrearController` acepta `string? idUsuario` y setea `httpContext.User` con el claim `NameIdentifier`; los 2 tests de `CerrarSesion` usan la firma nueva (`Setup`/`Verify` con `(It.IsAny<int>(), It.IsAny<string>())` y `(42, "token-viejo")`).
  - `RefreshTokenCleanupServiceTests.cs`: el esquema mínimo SQLite de `CrearEsquemaMinimo` no incluía las columnas agregadas por el código de uso único → `DbUpdateException: table Usuarios has no column named CodigoUsoUnico`. Agregadas `Rol TEXT NOT NULL DEFAULT 'Empleado'`, `CodigoUsoUnico TEXT NULL`, `ExpiracionCodigoUsoUnico TEXT NULL` (replica fiel de `UsuarioConfiguracion`).
  - Resultado: `dotnet build ShopMGR.sln` **0 errores**, suite backend **140/140 (1 omitido)**.
- **Issue nuevo #119 (feat trabajos)**: pasar trabajo a **Iniciado** automáticamente al agregar horas — `if (trabajo.Estado == EstadoTrabajo.Pendiente) trabajo.IniciarTrabajo();` en `AdministracionTrabajos.AgregarHoras`. Implementado por el usuario (backend, sin commitear). Creado en GitHub con labels `enhancement`, `backend`, `priority: high`. **Entra al release del Sprint 3**.
- **Lote de commits autorizado por el usuario** (pendiente de ejecución por el subagente Frontend, SIN push):
  1. `feat(auth)`: #100 SRP — `IRepositorioUsuario.cs`, `UsuarioRepositorio.cs`, `IAdministrarAuth.cs`, `AdministrarAuth.cs`, `InyeccionServicios.cs`, `AuthController.cs` + tests actualizados.
  2. `feat(ui)`: #112 página de perfil — `Perfil.tsx` (nuevo), `Sidebar.tsx`, `App.tsx`, `jwt.ts`, `index.css`, `Configuracion.tsx` (revertida a preferencias) + tests.
  3. `feat(ui)`: #113 botón "+" — `PasskeySection.tsx` + `PasskeySection.test.tsx`.
  4. `feat(trabajos)`: #119 Pendiente→Iniciado — `AdministracionTrabajos.cs`.
  5. `docs`: Sprint Board iteraciones 20-22.

## Iteración 23 (2026-08-06) — Sprint 3: push + PR #120 + revisión MergeGuard 🔴

- **Push**: los 5 commits del lote pusheados a `origin/development` (`eb51b14..3d0dad8`). Working tree limpio.
- **PR creado**: [#120](https://github.com/Tuqui77/ShopMGR/pull/120) `development` → `main` (patrón de release del repo), título "release: sprint 3 — seguridad y robustez de auth (refresh tokens en cookie, revocación, purga, SRP) + UX de perfil de usuario", 41 commits, sin assignee. Body con 12 keywords `Closes #` (#114, #115, #116, #117, #99, #100, #112, #113, #96, #57, #75, #119). **Sin #118** (siguiente sprint).
- **MergeGuard → 🔴 REQUEST_CHANGES** ([comment](https://github.com/Tuqui77/ShopMGR/pull/120#issuecomment-5210641878)). 5 hallazgos bloqueantes (2 Blocker + 3 Critical), 8 Warning, 4 Info:
  1. **🔴 SEV-001** — Login revela qué usernames existen (404 vs 400) por el refactor SRP #100. `UsuarioRepositorio.cs:27`
  2. **🔴 SEV-002** — Logout con access token expirado → 500 → cookie no se borra ni sesión revocada. `AuthController.cs:83`
  3. **🟠 OPS-001** — Migración deja a todos como `Empleado`; sin bootstrap del primer Admin, las features de restauración (#99) quedan inutilizables.
  4. **🟠 FUN-001** — `Refrescar` con token purgado → 404 en vez de 401.
  5. **🟠 FUN-002** — `[Range(1, int.MaxValue)]` en horas rechaza el chip `0.5` del modal de horas (#57).
- **Estado PR**: **NO avanza a PR Pending**. Queda en espera de decisión del usuario sobre los fixes backend (prohibidos por AGENTS.md sin autorización explícita).
- **Alternativa**: los 8 Warning pueden ir a follow-up sin bloquear.

## Iteración 24 (2026-08-07) — Sprint 3: fixes de MergeGuard + re-revisión 🟡 + revisión final 🟢 APPROVE

- **Fixes de los 5 blockers (implementados por el usuario, backend) + lote de 6 commits atómicos pusheados a `origin/development`** (`c1d5ff0..59bc170`):
  1. `b9c4c6c` — `fix(auth)`: SEV-001 (login ya no revela usernames), SEV-002 (logout con token expirado revoca cookie), FUN-001 (Refrescar purgado → 401).
  2. `d4eff03` — `feat(auth)`: OPS-001 (bootstrap primer usuario Admin en migración).
  3. `018f99e` — `fix(api)`: FUN-002 (`[Range]` de horas acepta decimales 0.5).
  4. `be782ce` — `fix(ops)`: dispose de scope en `RefreshTokenCleanupService`.
  5. `b61c532` — `test(auth)`: tests de `CerrarSesion` con nueva firma.
  6. `59bc170` — `docs`: Sprint Board iteraciones 20-23.
- **MergeGuard re-ejecutado → 🟡 COMMENT** ([comment](https://github.com/Tuqui77/ShopMGR/pull/120#issuecomment-5211761444)): 5 blockers resueltos ✅, CI 4/4, 140/140 tests. Nuevos hallazgos no bloqueantes:
  - 🟡 **SEV-003** (CWE-598): contraseñas en query params de `CambiarContrasena`/`CambiarContrasenaAdmin`.
  - 🟡 **SEV-004**: bootstrap de admin sin restricción + sin rate limit en registro ("admin theft"). → **Deuda de release aceptada por el usuario** (no crítico en uso actual).
  - 🟢 Menores: SEV-005 (cookie `Path=/api/Auth` amplio), FUN-003 (código de un solo uso expirado no validado), FUN-004 (`ArgumentNullException` → 500 con `contraseñaActual` null), OPS-002 (LogLevel).
- **SEV-003 fix (backend, implementado por el usuario)**: DTOs dedicados (`ShopMGR.Aplicacion/Data Transfer Objects/CambiarContraseñaDTO.cs`: `CambiarContrasenaDTO` con `ContrasenaActual?` + `ContrasenaNueva [Required]`; `CambiarContrasenaAdminDTO` con `IdUsuario [Required]` + `ContrasenaNueva [Required]`) + `[FromBody]` en `AuthController.cs`. Naming sin ñ por decisión del dueño. Fix de constructor primary → setters públicos (para deserialización correcta de System.Text.Json).
- **FUN-003/FUN-004 fix (backend, implementado por el usuario)**: `AdministrarAuth.cs` — `tieneCodigoUnUsoValido = CodigoUsoUnico != null && ExpiracionCodigoUsoUnico > DateTime.Now` (código expirado rechazado) + cortocircuito `contraseñaActual != null && VerifyHashedPassword(...)` (400 en vez de 500).
- **Frontend migrado a body JSON (subagente Frontend, iteración 24)**: `authService.cambiarContrasena` y `cambiarContrasenaAdmin` envían `data` JSON con naming sin ñ (`contrasenaActual`/`contrasenaNueva`/`idUsuario`); firma de `cambiarContrasenaAdmin` simplificada (sin `contraseñaActual`); call-sites y tests actualizados (`Perfil.tsx`, `auth.test.ts`, `Perfil.test.tsx`). Suite frontend **217/217**, lint/tsc/build OK.
- **Commits adicionales (PM)**: `c14375d` (SEV-003 backend), `184cb2c` (SEV-003 frontend), `1f5e9b5` (FUN-003/FUN-004), `84a074b` (style: whitespace dotnet format). Push `1f5e9b5..84a074b`. PR #120 → **52 commits**.
- **CI 4/4 PASS en el último commit** (`84a074b`): lint, test-backend, test-frontend, GitGuardian. (El primer intento de lint falló por 2 errores WHITESPACE del backend — corregidos por el usuario + commit `84a074b`.)
- **MergeGuard revisión final → 🟢 APPROVE** ([comment](https://github.com/Tuqui77/ShopMGR/pull/120#issuecomment-5219434743)): 0 Blocker, 0 Critical, 0 Major; 2 Minor cosméticos (MIN-001 `[Required]` no-op en `int`, MIN-002 nombre de archivo con ñ). Edge cases verificados (ContrasenaActual opcional, idUsuario en body, DateTime? fail-safe, 404 en id inexistente).
- **Estado PR #120**: **avanza a PR Pending** — listo para merge manual del usuario. SEV-004 registrado como deuda de release → backlog Sprint 4.

## Iteración 25 (2026-08-07) — Hotfix #121: acceso a /perfil en móvil (post-release Sprint 3)

- **Bug en prod**: en móvil el acceso a `/perfil` estaba solo en el Sidebar (oculto en <1024px) → usuarios móviles sin poder cambiar contraseña, gestionar passkeys ni administrar usuarios (admin, #99). El BottomNav móvil tenía "Config." y el Dashboard header (esquina sup. der., solo móvil) tenía OTRO botón a `/configuracion` → **duplicación real**.
- **Decisión del dueño (rework de dirección)**: reemplazar el botón del **Dashboard header** (Settings → `UserRound`, `→ /perfil`, `aria-label="Perfil"`), manteniendo Config. en el BottomNav. (Primera versión delegada tocó el BottomNav → revertida.)
- **Logout móvil resuelto**: el Sidebar (desktop) tenía "perfil + cerrar sesión" → al mover Perfil al header quedaba el logout colgado en móvil. Solución: botón sutil `sidebar-logout-btn` (icono LogOut, hover danger) en la esquina superior derecha del primer card de `/perfil`, **solo móvil** (`lg:!hidden` — importante por conflicto de capas Tailwind v4 con `.sidebar-logout-btn`, mismo patrón que el Dashboard header). El del Sidebar se mantiene para desktop.
- **Archivos**: `Dashboard.tsx` (botón header → /perfil), `Perfil.tsx` (handleLogout + botón sutil en card, `useNavigate`), `Perfil.test.tsx` (+MemoryRouter + mock `cerrarSesion` + 2 tests nuevos). Suite frontend **219/219**, lint/tsc OK, verificación DOM en móvil (visible) y desktop (oculto).
- **Deuda técnica registrada**: no existe `Dashboard.test.tsx` (el botón del header no tiene cobertura unitaria) → backlog Sprint 4.
