# Backend Analysis Report — 23/07/2026 (Corregido)

## Resumen Ejecutivo

- **Total de hallazgos**: 28
- **Críticos**: 1 | **Mayores**: 10 | **Menores**: 11 | **Info**: 6
- **Scope analizado**: Backend (.NET 9 Web API)
- **Nota**: Este reporte fue corregido tras verificación manual. Se eliminaron 4 falsos positivos (secrets en env, N+1 queries) y se ajustó 1 hallazgo parcial.

---

## CRÍTICOS

### [CRÍTICO] ASPNETCORE_ENVIRONMENT=Development hardcoded en Dockerfile
- **Archivo**: `Dockerfile:30`
- **Código**: `ENV ASPNETCORE_ENVIRONMENT=Development`
- **Problema**: La imagen Docker siempre se ejecuta en modo Development, lo que expone stack traces detallados, Swagger UI/Scalar, y deshabilita protections de producción (HSTS, exception handling genérico).
- **Recomendación**: Usar `ASPNETCORE_ENVIRONMENT` como variable de entorno en `docker-compose.yaml` con valor `Production` para el servicio `app`. No hardcodear en el Dockerfile.
- **Referencia**: OWASP Top 10 - Security Misconfiguration (A05:2021)
- **Severidad real**: ⚠️ Depende del contexto. Si solo se usa en desarrollo local, el impacto es bajo. Si se va a producción, es crítico.

---

## ~~CRÍTICOS ELIMINADOS (Falsos Positivos)~~

### ~~[CRÍTICO] Hardcoded JWT Secret en environment.env~~ ❌ FALSO POSITIVO
- **Razón de eliminación**: `environment.env` está en `.gitignore` (línea 383) y NO está versionado en el repositorio. `git ls-files environment.env` no devuelve resultados. El archivo existe localmente pero está correctamente ignorado.

### ~~[CRÍTICO] Hardcoded DB Password en environment.env~~ ❌ FALSO POSITIVO
- **Razón de eliminación**: Mismo motivo que arriba. El archivo no está versionado.

---

## MAYORES

### [MAYOR] Auth Backend lista pero Frontend no la integra
- **Archivo**: `Aplicacion/Program.cs`, `ShopMGR.Aplicacion/Servicios/AdministrarAuth.cs`, `Frontend/src/services/api.ts`
- **Problema**: El backend SÍ tiene autenticación real funcional:
  - `AdministrarAuth.cs` usa `PasswordHasher` para hashear y verificar contraseñas
  - `IniciarSesion()` verifica credenciales contra la DB y genera JWT tokens reales
  - `Program.cs` configura `AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(...)` con validación de issuer, audience, y signing key
  - `Program.cs` tiene `app.UseAuthorization()` (línea 131)
  - Sin embargo, el frontend NO integra el JWT: el interceptor de `api.ts` solo hace `console.warn('Unauthorized - JWT not implemented yet')`
  - El store solo guarda `isAuthenticated: true/false` (un booleano), no el token JWT
- **Recomendación**: Integrar el flujo de login real en el frontend: almacenar el JWT, enviarlo en headers Authorization, y manejar refresh tokens.
- **Referencia**: OWASP Top 10 - Broken Access Control (A01:2021)

### [MAYOR] Controllers sin atributo [Authorize] (excepto AuthController)
- **Archivo**: `Controllers/ClienteController.cs`, `Controllers/TrabajosController.cs`, `Controllers/PresupuestosController.cs`, etc.
- **Problema**: Solo `AuthController.cs` tiene un endpoint con `[Authorize]` (línea 41). Los demás controllers (Cliente, Trabajos, Presupuestos, Métricas, Dirección, Teléfono) NO tienen `[Authorize]`, por lo que la API es mayormente abierta aunque la infraestructura JWT esté configurada.
- **Recomendación**: Agregar `[Authorize]` a todos los controllers que manejan datos sensibles. Mantener solo endpoints públicos como `IniciarSesion` y `RegistrarUsuario` sin autenticación.

### [MAYOR] ExceptionHandlingMiddleware expone detalles internos
- **Archivo**: `Middleware/ExceptionHandlingMiddleware.cs`
- **Problema**: En modo Development, el middleware retorna el mensaje de excepción completo y stack trace. Si la imagen siempre corre en Development (ver Dockerfile), esto expone información sensible en producción.
- **Recomendación**: Asegurar que en producción solo se retorne un mensaje genérico. Nunca exponer stack traces o mensajes de excepción internos al cliente.
- **Referencia**: OWASP Top 10 - Security Misconfiguration (A05:2021)

### [MAYOR] Sin Rate Limiting en endpoints de autenticación
- **Archivo**: `Controllers/AuthController.cs`
- **Problema**: El endpoint de login no tiene rate limiting, lo que permite brute-force attacks contra credenciales.
- **Recomendación**: Implementar rate limiting (máximo 5 intentos por minuto por IP) en el endpoint de login. Usar `Microsoft.AspNetCore.RateLimiting`.
- **Referencia**: OWASP Top 10 - Identification and Authentication Failures (A07:2021)

### [MAYOR] Sin validación de input en controllers
- **Archivo**: `Controllers/ClienteController.cs`, `Controllers/TrabajosController.cs`, etc.
- **Problema**: Los DTOs de entrada no tienen atributos de validación (`[Required]`, `[MaxLength]`, `[EmailAddress]`, etc.). Los controllers no validan el ModelState antes de procesar.
- **Recomendación**: Agregar atributos de validación a todos los DTOs. Agregar `[ApiController]` attribute (que habilita validación automática) o validar `ModelState.IsValid` explícitamente.
- **Referencia**: OWASP Top 10 - Injection (A03:2021)

### [MAYOR] OutputType WinExe en WebApi.csproj
- **Archivo**: `ShopMGR.WebApi.csproj:8`
- **Código**: `<OutputType>WinExe</OutputType>`
- **Problema**: El proyecto Web API está configurado como `WinExe` (aplicación de ventana Windows) en lugar de `Exe`. Esto puede causar problemas en Linux/Docker y no es el tipo correcto para una Web API.
- **Recomendación**: Cambiar a `<OutputType>Exe</OutputType>` o eliminar la línea (el default para `Microsoft.NET.Sdk.Web` es `Exe`).
- **Referencia**: .NET SDK Documentation

### [MAYOR] Referencias directas a DLLs de testing en WebApi.csproj
- **Archivo**: `ShopMGR.WebApi.csproj:92-98`
- **Código**:
  ```xml
  <Reference Include="Moq">
    <HintPath>..\..\.nuget\packages\moq\4.20.72\lib\net6.0\Moq.dll</HintPath>
  </Reference>
  <Reference Include="xunit.core">
    <HintPath>..\..\.nuget\packages\xunit.extensibility.core\2.9.2\lib\netstandard1.1\xunit.core.dll</HintPath>
  </Reference>
  ```
- **Problema**: El proyecto de producción referencia directamente DLLs de testing (Moq, xUnit). Esto contamina el build de producción con dependencias de testing y puede exponer superficie de ataque innecesaria.
- **Recomendación**: Eliminar estas referencias del `.csproj` de producción. Las dependencias de testing deben estar solo en el proyecto `ShopMGR.Tests`.
- **Referencia**: .NET Best Practices - Dependency Management

### [MAYOR] FluentAssertions en WebApi.csproj (dependencia de testing en producción)
- **Archivo**: `ShopMGR.WebApi.csproj:58`
- **Código**: `<PackageReference Include="FluentAssertions" Version="8.2.0" />`
- **Problema**: FluentAssertions es una librería de testing que no debería estar en el proyecto de producción.
- **Recomendación**: Mover esta referencia solo al proyecto `ShopMGR.Tests`.
- **Referencia**: .NET Best Practices - Dependency Management

### [MAYOR] Sin health checks configurados
- **Archivo**: `Aplicacion/Program.cs`
- **Problema**: No hay endpoints de health check configurados para verificar la salud de la base de datos, servicios externos, o la aplicación en sí. Docker-compose no tiene `healthcheck` configurado.
- **Recomendación**: Implementar `/health` endpoint con `Microsoft.AspNetCore.Diagnostics.HealthChecks`. Agregar health checks a SQL Server y servicios externos. Configurar `healthcheck` en docker-compose para el servicio `app`.
- **Referencia**: .NET Health Checks Documentation

### [MAYOR] DBSeeder como servicio separate sin cleanup
- **Archivo**: `docker-compose.yaml:25-35`
- **Problema**: El servicio `seeder` se ejecuta como un contenedor separado con profile `tools`. No hay mecanismo para ejecutarlo automáticamente solo una vez, ni para verificar si la DB ya fue sembrada.
- **Recomendación**: Implementar migraciones automáticas al iniciar el contenedor `app` usando `context.Database.Migrate()` o un script de init. Considerar eliminar el seeder de producción.
- **Referencia**: EF Core Migrations - Automatic Migration

### [MAYOR] Sin CORS configurado adecuadamente
- **Archivo**: `Aplicacion/Program.cs`
- **Problema**: No hay configuración explícita de CORS. En desarrollo con Docker, el frontend (puerto 3000) y backend (puerto 80 dentro del contenedor) están en el mismo dominio a través de nginx proxy, pero si se ejecuta en desarrollo local sin Docker, habrá problemas de CORS.
- **Recomendación**: Configurar CORS explícitamente con orígenes permitidos específicos. No usar `AllowAnyOrigin()` en producción.
- **Referencia**: OWASP - CORS Misconfiguration

---

## MENORES

### [MENOR] Naming inconsistente en controllers
- **Archivo**: `Controllers/ClienteController.cs`, `Controllers/TrabajosController.cs`, `Controllers/PresupuestosController.cs`
- **Problema**: Unos usan singular (`ClienteController`) y otros plural (`TrabajosController`, `PresupuestosController`). Las rutas también son inconsistentes (`/api/Cliente/` vs `/api/Trabajos/`).
- **Recomendación**: Estandarizar a plural (`ClientesController`, `TrabajosController`, `PresupuestosController`) siguiendo convenciones REST.
- **Referencia**: RESTful API Naming Conventions

### [MENOR] Mapper manual sin AutoMapper en algunos repos
- **Archivo**: `ShopMGR.Repositorios/ClienteRepositorio.cs`
- **Problema**: Algunos repositorios usan mappers manuales mientras otros usan AutoMapper. Inconsistencia en el patrón de mapeo.
- **Recomendación**: Estandarizar en un solo patrón. Si se usa AutoMapper, usarlo en todos lados. Si se usa mapeo manual, ser consistente.
- **Referencia**: Clean Architecture - Consistency

### [MENOR] Métodos públicos sin documentación XML
- **Archivo**: Todos los controllers y servicios
- **Problema**: Ningún método público tiene documentación XML (`/// <summary>`). Esto dificulta el mantenimiento y la generación de documentación automática.
- **Recomendación**: Agregar documentación XML a todos los métodos públicos, especialmente los endpoints de API.
- **Referencia**: .NET Documentation Standards

### [MENOR] Sin logging estructurado
- **Archivo**: `Middleware/ExceptionHandlingMiddleware.cs`, servicios
- **Problema**: El logging usa `ILogger` pero no se ve logging estructurado con propiedades correlacionadas (correlation ID, user ID, etc.).
- **Recomendación**: Implementar logging estructurado con Serilog y correlation IDs para facilitar debugging en producción.
- **Referencia**: .NET Logging Best Practices

### [MENOR] ExceptionHandlingMiddleware sin request ID
- **Archivo**: `Middleware/ExceptionHandlingMiddleware.cs`
- **Problema**: Las excepciones se loguean sin un identificador único de request, lo que dificulta correlacionar errores con requests específicos.
- **Recomendación**: Generar un GUID como request ID al inicio del pipeline y incluirlo en todos los logs y en el header de respuesta.
- **Referencia**: Observability Best Practices

### [MENOR] Repositorio base genérico sin AsNoTracking
- **Archivo**: `ShopMGR.Repositorios/` (todos los repositorios)
- **Problema**: Las queries de lectura no usan `AsNoTracking()`, lo que significa que EF Core trackea entidades que no serán modificadas, desperdiciando memoria y CPU.
- **Recomendación**: Agregar `.AsNoTracking()` a todas las queries de solo lectura (GET endpoints).
- **Referencia**: EF Core Performance - No-Tracking Queries

### [MENOR] Contexto sin configuración de cascada adecuada
- **Archivo**: `ShopMGR.Contexto/ShopMGRDbContexto.cs`
- **Problema**: Las relaciones de eliminación en cascada pueden causar borrados masivos no intencionales. Por ejemplo, eliminar un cliente podría eliminar todos sus trabajos, presupuestos, etc.
- **Recomendación**: Configurar restricciones de FK explícitamente en `OnModelCreating`. Considerar soft delete en lugar de hard delete para entidades importantes.
- **Referencia**: EF Core - Cascade Delete

### [MENOR] Sin índices en propiedades de búsqueda frecuente
- **Archivo**: `ShopMGR.Contexto/ShopMGRDbContexto.cs`
- **Problema**: No hay definición de índices en propiedades que se usan para búsqueda/filtrado (e.g., `Cliente.Nombre`, `Trabajo.Estado`).
- **Recomendación**: Agregar índices en propiedades de búsqueda frecuente usando Fluent API en `OnModelCreating`.
- **Referencia**: EF Core - Indexes

### [MENOR] DTOs sin data annotations
- **Archivo**: `ShopMGR.Aplicacion/DTOs/` (todos los DTOs)
- **Problema**: Los DTOs no tienen atributos de validación como `[Required]`, `[StringLength]`, `[EmailAddress]`, etc.
- **Recomendación**: Agregar data annotations apropiadas a todos los DTOs de entrada.
- **Referencia**: ASP.NET Core Model Validation

### [MENOR] MapperExtension genérica sin validación
- **Archivo**: `Infraestructura/Extensiones/MapperExtension.cs`
- **Problema**: El mapper genérico no valida si el source es null antes de mapear.
- **Recomendación**: Agregar null checks y manejo apropiado de valores nulos en el mapper.
- **Referencia**: Defensive Programming

### [MENOR] Sin logging de queries lentas
- **Archivo**: `ShopMGR.Contexto/ShopMGRDbContexto.cs`
- **Problema**: No hay configuración de logging de queries lentas (e.g., queries que toman más de 1 segundo).
- **Recomendación**: Configurar `LogTo()` con filtro para queries lentas o usar un interceptor de EF Core para medir tiempos de ejecución.
- **Referencia**: EF Core Performance Monitoring

---

## ~~HALLAZGOS ELIMINADOS (Falsos Positivos)~~

### ~~[MENOR] Google Drive API key en environment.env versionado~~ ❌ FALSO POSITIVO
- **Razón de eliminación**: `environment.env` está en `.gitignore` y NO está versionado en el repositorio.

### ~~[MAYOR] N+1 Query en TrabajoRepositorio.ObtenerTodosAsync~~ ❌ FALSO POSITIVO
- **Razón de eliminación**: No existe ningún método `ObtenerTodosAsync`. El método se llama `ListarTodosAsync()` (línea 20) y **SÍ usa `.Include(t => t.Cliente)`** (línea 22). No hay N+1 query.

### ~~[MAYOR] N+1 Query en PresupuestoRepositorio.ObtenerTodosAsync~~ ❌ FALSO POSITIVO
- **Razón de eliminación**: No existe ningún método `ObtenerTodosAsync`. El método se llama `ListarPresupuestos()` (línea 65) y **SÍ usa `.Include(p => p.Cliente)`** (línea 68). No hay N+1 query.

---

## INFO

### [INFO] Solución multi-proyecto bien estructurada
- **Proyecto**: Solución general
- **Observación**: La arquitectura sigue Clean Architecture con capas claras (Dominio, Aplicacion, Contexto, Repositorios, WebApi). Esto es una buena práctica.
- **Recomendación**: Mantener esta separación y asegurar que las dependencias siempre apunten hacia adentro (Repositorios → Aplicacion → Dominio).

### [INFO] User Secrets configurado
- **Archivo**: `ShopMGR.WebApi.csproj:7`
- **Código**: `<UserSecretsId>8d7c1292-7fa6-4804-82be-fec69c9dd53d</UserSecretsId>`
- **Observación**: User Secrets está configurado, lo cual es bueno para desarrollo local.
- **Recomendación**: Asegurar que los secrets de producción NO estén en User Secrets sino en un vault.

### [INFO] Nullable habilitado
- **Archivo**: `ShopMGR.WebApi.csproj:5`
- **Código**: `<Nullable>enable</Nullable>`
- **Observación**: Nullable reference types está habilitado en todos los proyectos. Esto mejora la seguridad de tipos.
- **Recomendación**: Mantener habilitado y corregir warnings de nullable.

### [INFO] EF Core con SQL Server
- **Proyecto**: Stack de base de datos
- **Observación**: Se usa EF Core con SQL Server 2022. Buena elección para el caso de uso.
- **Recomendación**: Considerar agregar connection pooling y configurar `CommandTimeout` apropiadamente.

### [INFO] Swagger/Scalar habilitado
- **Archivo**: `ShopMGR.WebApi.csproj:56,79`
- **Observación**: Tanto Swagger como Scalar están configurados para documentación de API. Esto es bueno para desarrollo.
- **Recomendación**: Asegurar que Swagger/Scalar estén deshabilitados o protegidos en producción.

### [INFO] Coverlet configurado para cobertura
- **Archivo**: `ShopMGR.Tests/ShopMGR.Tests.csproj:9-11`
- **Observación**: Coverlet está configurado para generar reportes de cobertura en formato Cobertura.
- **Recomendación**: Integrar con herramientas de reporte como ReportGenerator o SonarQube para visualizar cobertura.

---

*Generated by Code Analyst v1.0 — 23/07/2026 (Corregido por verificación manual)*
