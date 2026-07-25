# Architecture Analysis Report — 23/07/2026 (Corregido)

## Resumen Ejecutivo

- **Total de hallazgos**: 16
- **Críticos**: 0 | **Mayores**: 6 | **Menores**: 6 | **Info**: 4
- **Scope analizado**: Arquitectura general del sistema
- **Nota**: Este reporte fue corregido tras verificación manual. Se downgradeó 1 hallazgo de Crítico a Mayor con matices.

---

## ~~CRÍTICOS~~

### ~~[CRÍTICO] Autenticación no implementada - Sistema abierto~~ → DOWNGRADED A MAYOR

### [MAYOR] Auth backend funcional pero Frontend no la integra
- **Archivo**: `Aplicacion/Program.cs`, `ShopMGR.Aplicacion/Servicios/AdministrarAuth.cs`, `Controllers/AuthController.cs`, `Frontend/src/services/api.ts`
- **Problema**: La autenticación está **parcialmente implementada**:
  - ✅ **Backend funcional**: `AdministrarAuth.cs` tiene `RegistrarUsuarioAsync()` con `PasswordHasher`, `IniciarSesion()` que verifica credenciales contra la DB y genera JWT tokens reales con claims
  - ✅ **Program.cs configura JWT**: `AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(...)` con validación de issuer, audience, signing key, y lifetime
  - ✅ **Program.cs tiene `app.UseAuthorization()`** (línea 131). En .NET 7+, `UseAuthorization()` llama implícitamente a `UseAuthentication()` si hay un scheme registrado
  - ✅ **AuthController** tiene endpoints reales de `RegistrarUsuario` e `IniciarSesion`
  - ❌ **Frontend no integra el JWT**: El interceptor de `api.ts` solo hace `console.warn('Unauthorized - JWT not implemented yet')`. No envía token en headers
  - ❌ **Frontend solo guarda un booleano**: `localStorage.setItem('isAuthenticated', String(authenticated))` — no almacena el JWT
  - ❌ **Controllers sin `[Authorize]`**: Solo `AuthController` tiene un endpoint con `[Authorize]`. Los demás controllers (Cliente, Trabajos, Presupuestos, Métricas, Dirección, Teléfono) están abiertos
  - **Cualquier persona con acceso a la URL puede usar todas las funcionalidades** porque los endpoints no están protegidos
- **Recomendación**:
  1. Integrar flujo de login real en el frontend (almacenar JWT, enviar en header Authorization)
  2. Agregar `[Authorize]` a todos los controllers que manejen datos sensibles
  3. Implementar refresh tokens y logout
  4. Bloquear acceso a funcionalidades hasta que la auth esté completa
- **Referencia**: OWASP - Broken Access Control (A01:2021)

---

## MAYORES

### [MAYOR] Clean Architecture pero sin dependencias claras
- **Archivo**: Estructura general del proyecto
- **Problema**: Aunque la estructura sigue Clean Architecture (Dominio → Aplicacion → Contexto → Repositorios → WebApi), hay violaciones:
  - `ShopMGR.WebApi.csproj` referencia directamente a `Moq` y `xunit.core` (dependencias de testing en producción)
  - `ShopMGR.WebApi.csproj` tiene `<Compile Remove>` para casi todas las carpetas, lo que sugiere que la separación no es limpia
- **Recomendación**:
  1. Eliminar referencias de testing del WebApi.csproj
  2. Revisar que las dependencias de proyecto sean correctas y unidireccionales
  3. Usar dependency injection para desacoplar capas
- **Referencia**: Clean Architecture - Dependency Rule

### [MAYOR] Dual state management (Zustand ↔ React Query)
- **Archivo**: `Frontend/src/store/index.ts`, `Frontend/src/hooks/*.ts`
- **Problema**: Hay dos sistemas de manejo de estado:
  - **Zustand**: Para estado global (auth, UI state)
  - **React Query**: Para datos del servidor
  - Pero hay overlap: algunos datos del servidor se cachean en Zustand también
- **Recomendación**: Dejar Zustand SOLO para UI state (auth, modals, filters). React Query maneja TODOS los datos del servidor. No duplicar cache.
- **Referencia**: State Management Best Practices

### [MAYOR] Backend sin API versioning
- **Archivo**: `Controllers/*.cs`
- **Problema**: Todos los endpoints están en la raíz `/api/` sin versionado. Cuando se necesiten breaking changes, no habrá forma de mantener backward compatibility.
- **Recomendación**: Implementar versionado de API desde ahora:
  - URL path versioning: `/api/v1/clientes`, `/api/v2/clientes`
  - O header-based: `Accept: application/vnd.shopmgr.v1+json`
- **Referencia**: API Versioning Best Practices

### [MAYOR] Sin CQRS - Commands y Queries mezclados
- **Archivo**: `ShopMGR.Aplicacion/Servicios/*.cs`
- **Problema**: Los servicios manejan tanto lecturas como escrituras en los mismos métodos. No hay separación entre operaciones de lectura (queries) y escritura (commands).
- **Recomendación**: Considerar implementar CQRS con MediatR para separar:
  - **Queries**: Obtener datos (read-only, optimizado)
  - **Commands**: Modificar datos (con validación, transacciones)
- **Referencia**: CQRS Pattern

### [MAYOR] Sin Event-Driven Architecture
- **Archivo**: Sistema general
- **Problema**: No hay eventos de dominio. Cuando se crea un trabajo, se actualiza un cliente, o se modifica un presupuesto, no se notifica a otros componentes del sistema.
- **Recomendación**: Implementar domain events para:
  - Notificaciones (email, push)
  - Audit trail
  - Sincronización con sistemas externos
- **Referencia**: Domain Events Pattern

### [MAYOR] Google Drive API acoplada directamente
- **Archivo**: `ShopMGR.Infraestructura.Drive/`
- **Problema**: La integración con Google Drive está directamente acoplada en la capa de infraestructura. Si Google Drive cambia su API o se necesita otro storage, hay que modificar código.
- **Recomendación**: Implementar un patrón Adapter/Strategy para storage:
  ```csharp
  public interface IStorageService {
      Task<string> UploadAsync(Stream file, string name);
      Task<Stream> DownloadAsync(string fileId);
  }
  ```
- **Referencia**: Adapter Pattern, SOLID - Open/Closed Principle

### [MAYOR] Sin Circuit Breaker para servicios externos
- **Archivo**: `ShopMGR.Infraestructura.Drive/`, servicios que llaman APIs externas
- **Problema**: Si Google Drive API o cualquier servicio externo falla, la aplicación no tiene resiliencia. Los requests seguirán intentando y fallando, consumiendo recursos.
- **Recomendación**: Implementar Circuit Breaker con Polly:
  ```csharp
  services.AddHttpClient<IGoogleDriveService, GoogleDriveService>()
      .AddPolicyHandler(Policy
          .Handle<HttpRequestException>()
          .CircuitBreakerAsync(5, TimeSpan.FromMinutes(1)));
  ```
- **Referencia**: Circuit Breaker Pattern, Polly

---

## MENORES

### [MENOR] Naming inconsistente en la solución
- **Archivos**: Múltiples
- **Problema**: Hay inconsistencias en el nombrado:
  - `AdministracionClientes` vs `AdministracionTrabajos` (servicios)
  - `ClienteRepositorio` vs `TrabajoRepositorio` (repositorios)
  - `ClienteController` vs `TrabajosController` (controllers)
- **Recomendación**: Estandarizar suffixes:
  - Servicios: `*Service` o `*Service`
  - Repositorios: `*Repository`
  - Controllers: `*Controller` (plural)
- **Referencia**: .NET Naming Conventions

### [MENOR] Mapper sin validación de tipos
- **Archivo**: `Infraestructura/Extensiones/MapperExtension.cs`
- **Problema**: El mapper genérico no valida si los tipos son compatibles antes de mapear.
- **Recomendación**: Agregar validación en compile-time o runtime para evitar mapeos inválidos.
- **Referencia**: Type Safety

### [MENOR] Sin configuración de Swagger para producción
- **Archivo**: `Aplicacion/Program.cs`
- **Problema**: Swagger/Scalar parece estar habilitado independientemente del ambiente. En producción, esto expone la documentación de la API.
- **Recomendación**: Configurar Swagger solo para `Development`:
  ```csharp
  if (app.Environment.IsDevelopment()) {
      app.UseSwagger();
      app.UseSwaggerUI();
  }
  ```
- **Referencia**: API Documentation Security

### [MENOR] Sin global exception handling para servicios
- **Archivo**: `ShopMGR.Aplicacion/Servicios/*.cs`
- **Problema**: Los servicios no tienen try-catch globales. Las excepciones se propagan al controller, pero no hay logging centralizado ni transformación a errores amigables.
- **Recomendación**: Implementar un pipeline de behaviours con MediatR o middleware para logging y manejo de excepciones global.
- **Referencia**: Cross-Cutting Concerns

### [MENOR] Sin Validación con FluentValidation
- **Archivo**: `ShopMGR.Aplicacion/`
- **Problema**: No hay FluentValidation configurado para validar DTOs de entrada. La validación depende de data annotations que son limitadas.
- **Recomendación**: Implementar FluentValidation con reglas de negocio complejas:
  ```csharp
  public class CrearClienteValidator : AbstractValidator<CrearClienteRequest> {
      public CrearClienteValidator() {
          RuleFor(x => x.Nombre).NotEmpty().MaximumLength(100);
          RuleFor(x => x.Email).EmailAddress();
      }
  }
  ```
- **Referencia**: FluentValidation

### [MENOR] Sin mediator pattern
- **Archivo**: `ShopMGR.Aplicacion/Servicios/*.cs`
- **Problema**: Los servicios se llaman directamente entre sí. No hay desacoplamiento mediante mediator.
- **Recomendación**: Considerar MediatR para desacoplar handlers y facilitar cross-cutting concerns (logging, validation, caching).
- **Referencia**: Mediator Pattern

---

## INFO

### [INFO] Arquitectura base sólida
- **Proyecto**: Solución general
- **Observación**: La separación en capas (Dominio, Aplicacion, Contexto, Repositorios, WebApi) es correcta y sigue Clean Architecture principles.
- **Recomendación**: Mantener esta estructura y asegurar que las dependencias siempre apunten hacia adentro.

### [INFO] Uso de Entity Framework Core
- **Proyecto**: Data access layer
- **Observación**: EF Core es una buena elección para data access con SQL Server. El uso de repositories abstraction es correcto.
- **Recomendación**: Aprovechar features avanzadas como global query filters, interceptors, y owned entities.

### [INFO] Domain models bien definidos
- **Archivo**: `ShopMGR.Dominio/Modelo/*.cs`
- **Observación**: Las entidades de dominio están bien estructuradas con propiedades claras y relaciones definidas.
- **Recomendación**: Considerar agregar value objects para propiedades compuestas (dirección, teléfono).

### [INFO] Docker multi-stage build
- **Archivo**: `Dockerfile`
- **Observación**: El uso de multi-stage builds reduce el tamaño de la imagen final.
- **Recomendación**: Mantener y optimizar cada stage.

---

*Generated by Code Analyst v1.0 — 23/07/2026 (Corregido por verificación manual)*
