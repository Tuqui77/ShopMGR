# QA Analysis Report — 23/07/2026 (Corregido)

## Resumen Ejecutivo

- **Total de hallazgos**: 16
- **Críticos**: 2 | **Mayores**: 6 | **Menores**: 5 | **Info**: 3
- **Scope analizado**: QA y Testing (Backend + Frontend)
- **Nota**: Este reporte fue revisado tras verificación manual. Los hallazgos de QA se mantienen ya que son independientes de la verificación de secrets/archivos. Sin embargo, se agregan notas contextuales sobre el estado real de la autenticación.

---

## CRÍTICOS

### [CRÍTICO] Tests de frontend sin assertions reales
- **Archivo**: `Frontend/src/__tests__/api.test.ts`, `clientes.test.ts`
- **Problema**: Los tests solo verifican que las funciones existen:
  ```typescript
  it('should have listar function', () => {
    expect(typeof listar).toBe('function');
  });
  ```
  Esto no valida ningún comportamiento real. Los tests pasan aunque la implementación esté rota.
- **Recomendación**: Implementar tests con assertions que validen:
  - Llamadas HTTP correctas (URL, method, headers)
  - Transformación de datos
  - Manejo de errores
  - Estados de carga
- **Referencia**: Testing Best Practices - AAA Pattern

### [CRÍTICO] Sin tests de integración para endpoints críticos
- **Archivo**: `ShopMGR.Tests/`
- **Problema**: No hay tests de integración que validen el flujo completo:
  - Login → Autenticación → Acceso a recursos protegidos
  - CRUD completo de clientes
  - CRUD completo de trabajos
  - Cálculo de métricas
- **Nota**: El backend SÍ tiene autenticación funcional (verificado en `AdministrarAuth.cs`), pero no hay tests que la validen. El endpoint `GET /api/Auth` con `[Authorize]` debería rechazar requests sin token, pero esto no está testeado.
- **Recomendación**: Implementar tests de integración con `WebApplicationFactory` y `TestContainers` para SQL Server:
  ```csharp
  public class AuthIntegrationTests : IClassFixture<WebApplicationFactory<Program>> {
      [Fact]
      public async Task AuthorizedEndpoint_WithoutToken_Returns401() {
          var client = _factory.CreateClient();
          var response = await client.GetAsync("/api/Auth");
          Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
      }
  }
  ```
- **Referencia**: Integration Testing in ASP.NET Core

---

## MAYORES

### [MAYOR] Cobertura de tests backend muy baja
- **Archivo**: `ShopMGR.Tests/`
- **Problema**: Solo hay tests para:
  - `AdministracionClientesTests.cs` (4 tests básicos)
  - `ClienteRepositorioTests.cs` (3 tests básicos)
  - No hay tests para: Trabajos, Presupuestos, Métricas, Auth, Direccion, Telefono
- **Recomendación**: Crear tests para cada servicio y repositorio. Priorizar:
  1. Tests de servicios de negocio (reglas de cálculo, validaciones)
  2. Tests de repositorios (queries correctas)
  3. Tests de controllers (endpoints responden correctamente)
- **Referencia**: Test Pyramid

### [MAYOR] Tests sin setup/teardown adecuado
- **Archivo**: `ShopMGR.Tests/AdministracionClientesTests.cs`
- **Problema**: Los tests usan `InMemory` database pero no tienen cleanup entre tests. Los datos de un test pueden afectar a otro.
- **Recomendación**: Implementar `IAsyncLifetime` o `IClassFixture` para cleanup de datos entre tests:
  ```csharp
  public class AdministracionClientesTests : IAsyncLifetime {
      private readonly DbContextOptions<ShopMGRDbContexto> _options;
      
      public async Task InitializeAsync() {
          // Create fresh database for each test
      }
      
      public async Task DisposeAsync() {
          // Cleanup
      }
  }
  ```
- **Referencia**: Test Isolation

### [MAYOR] Sin tests E2E
- **Archivo**: No existe
- **Problema**: No hay tests end-to-end que validen flujos completos de usuario:
  - Crear cliente → Crear trabajo → Asignar trabajo → Completar
  - Login → Navegación → CRUD → Logout
- **Recomendación**: Implementar tests E2E con Playwright o Cypress para flujos críticos de usuario.
- **Referencia**: E2E Testing Best Practices

### [MAYOR] Tests sin data de prueba representativa
- **Archivo**: `ShopMGR.Tests/`
- **Problema**: Los tests usan datos hardcodeados que no representan casos edge:
  - No hay tests con datos vacíos
  - No hay tests con límites de strings
  - No hay tests con datos nulos
  - No hay tests con caracteres especiales
- **Recomendación**: Crear test data builders o factories:
  ```csharp
  public static class ClienteBuilder {
      public static Cliente CreateValid() => new() {
          Nombre = "Juan Pérez",
          Email = "juan@example.com",
          Telefono = "+54 11 1234-5678"
      };
      
      public static Cliente CreateWithInvalidEmail() => new() {
          Nombre = "Test",
          Email = "invalid-email"
      };
  }
  ```
- **Referencia**: Test Data Builders

### [MAYOR] Sin test de performance/load
- **Archivo**: No existe
- **Problema**: No hay tests que validen que la aplicación maneja carga:
  - ¿Cuántos usuarios concurrentes soporta?
  - ¿Qué pasa con 1000+ clientes?
  - ¿Las queries son eficientes con datos reales?
- **Recomendación**: Implementar load tests con k6 o JMeter para endpoints críticos.
- **Referencia**: Performance Testing

### [MAYOR] Sin test de seguridad
- **Archivo**: No existe
- **Problema**: No hay tests que validen:
  - Autenticación funcionando correctamente (login fallido, token inválido)
  - Autorización (usuarios no pueden acceder a recursos de otros)
  - SQL Injection prevention
  - XSS prevention
- **Nota**: El backend tiene `[Authorize]` en un endpoint de AuthController, pero no hay tests que validen que rechaza requests sin token. Tampoco hay tests que validen que los endpoints de negocio (Cliente, Trabajos, etc.) — que actualmente NO tienen `[Authorize]` — permiten acceso sin autenticación.
- **Recomendación**: Implementar security tests:
  - Tests de autenticación (login fallido, token expirado, token inválido)
  - Tests de autorización (acceso no autorizado a endpoints protegidos)
  - Tests de validación de input
- **Referencia**: Security Testing

---

## MENORES

### [MENOR] CI/CD sin quality gates
- **Archivo**: `.github/workflows/tests.yml`
- **Problema**: Los tests se ejecutan pero no hay quality gates que bloqueen el merge si fallan o si la cobertura baja.
- **Recomendación**: Agregar quality gates:
  - Tests deben pasar al 100%
  - Cobertura mínima del 70%
  - No hay warnings de compiler
- **Referencia**: Quality Gates

### [MENOR] Sin test de regressión
- **Archivo**: No existe
- **Problema**: No hay mecanismo para detectar regressions cuando se hace un cambio.
- **Recomendación**: Ejecutar todos los tests en cada PR y comparar con la rama base.
- **Referencia**: Regression Testing

### [MENOR] Tests sin assertions claras
- **Archivo**: `ShopMGR.Tests/ClienteRepositorioTests.cs`
- **Problema**: Algunos tests solo verifican que no hay excepción, no que el resultado sea correcto:
  ```csharp
  [Fact]
  public async Task ObtenerTodosAsync_NoExcepcion() {
      // No assert on actual data
  }
  ```
- **Recomendación**: Agregar assertions que validen el contenido del resultado:
  ```csharp
  var result = await repo.ObtenerTodosAsync();
  Assert.NotNull(result);
  Assert.NotEmpty(result);
  Assert.Equal(expectedCount, result.Count);
  ```
- **Referencia**: Assertion Best Practices

### [MENOR] Sin test data cleanup
- **Archivo**: `ShopMGR.Tests/`
- **Problema**: Los tests no limpian los datos después de ejecutarse. Aunque usan InMemory, la configuración puede cambiar.
- **Recomendación**: Implementar cleanup explícito después de cada test.
- **Referencia**: Test Cleanup

### [MENOR] Sin test de error handling
- **Archivo**: `ShopMGR.Tests/`
- **Problema**: No hay tests que validen el comportamiento cuando algo falla:
  - ¿Qué pasa cuando la DB no está disponible?
  - ¿Qué pasa con datos inválidos?
  - ¿Qué pasa con timeout de queries?
- **Recomendación**: Implementar tests de error scenarios:
  ```csharp
  [Fact]
  public async Task ObtenerPorId_IdInvalido_LanzaExcepcion() {
      await Assert.ThrowsAsync<EntityNotFoundException>(
          () => service.ObtenerPorIdAsync(999));
  }
  ```
- **Referencia**: Error Scenario Testing

---

## INFO

### [INFO] Framework de testing configurado
- **Archivo**: `ShopMGR.Tests/ShopMGR.Tests.csproj`
- **Observación**: xUnit, Moq, FluentAssertions, y Coverlet están configurados correctamente.
- **Recomendación**: Mantener el stack de testing y agregar herramientas adicionales según necesidades.

### [INFO] Coverlet para cobertura
- **Archivo**: `ShopMGR.Tests/ShopMGR.Tests.csproj:9-11`
- **Observación**: Coverlet está configurado para generar reportes de cobertura en formato Cobertura.
- **Recomendación**: Integrar con ReportGenerator o SonarQube para visualizar y trackear cobertura.

### [INFO] GitHub Actions ejecuta tests
- **Archivo**: `.github/workflows/tests.yml`
- **Observación**: Los tests se ejecutan automáticamente en cada PR. Esto es una buena práctica.
- **Recomendación**: Agregar coverage reporting al pipeline.

---

*Generated by Code Analyst v1.0 — 23/07/2026 (Corregido por verificación manual)*
