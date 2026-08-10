# Automation Scripts — Suite de Integración Backend (#82)

| Campo | Valor |
|---|---|
| **Versión** | v1.0 |
| **Fecha** | 2026-08-08 |
| **Autor** | QA Automation |
| **Issue** | #82 |
| **Stack** | xUnit + `WebApplicationFactory` + EF Core SQLite (in-memory) + FluentAssertions |

Los archivos de referencia van en `ShopMGR.Tests/Integration/`. **No requieren dependencias nuevas** (todo ya está en `ShopMGR.Tests.csproj`).

```
ShopMGR.Tests/Integration/
├── Claves.cs                      # Constantes de entorno de test (único lugar a modificar)
├── ShopMGRWebApplicationFactory.cs# Factory con SQLite :memory: + config de test
├── ApiTestsBase.cs                # Base común: token lazy (1 login/suite) + helpers de parseo
├── LoginApiTests.cs               # TC-AUTH-01..13
├── ClienteApiTests.cs             # TC-CLI-01..15 (menos TC-CLI-06)
├── ClienteListaVaciaApiTests.cs   # TC-CLI-06 (BD fresca dedicada)
├── TrabajoApiTests.cs             # TC-TRA-01..13
└── PresupuestoApiTests.cs         # TC-PRE-01..11
```

---

## 1. `Claves.cs` — entorno de test

```csharp
namespace ShopMGR.Tests.Integration;

// Datos de entorno del host de test (ver test-plan.md §6).
// Si el dueño prefiere otras credenciales, se cambian solo acá.
public static class Claves
{
    public const string AdminUsername = "admin";
    public const string AdminPassword = "Admin123!";

    // Mínimo 32 bytes para HS256; Issuer/Audience reales vienen de appsettings.json.
    public const string JwtToken = "ClaveDePruebaShopMGR_0123456789abcdef0123456789";

    public const string ConexionSqlite = "Data Source=:memory:";
}
```

---

## 2. `ShopMGRWebApplicationFactory.cs` — host de test con SQLite compartido

```csharp
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ShopMGR.Contexto;

namespace ShopMGR.Tests.Integration;

// Reemplaza el UseSqlServer del Program por SQLite :memory: compartido.
// La conexión se abre antes de crear el host para que el Migrate() del Main
// (Aplicacion/Program.cs) y los requests usen la MISMA base en memoria.
public class ShopMGRWebApplicationFactory
    : WebApplicationFactory<ShopMGR.WebApi.Aplicacion.Program>
{
    private readonly SqliteConnection _conexion = new(Claves.ConexionSqlite);

    public ShopMGRWebApplicationFactory()
    {
        _conexion.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:ShopMGRDbContexto"] = Claves.ConexionSqlite,
                ["Jwt:Token"] = Claves.JwtToken,
                ["ADMIN_USERNAME"] = Claves.AdminUsername,
                ["ADMIN_PASSWORD"] = Claves.AdminPassword,
                // Secure=false para poder reenviar la cookie de refresh por HTTP en tests (test-plan.md §6).
                ["Auth:RefreshTokenCookie.Secure"] = "false",
            });
        });

        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(d =>
                d.ServiceType == typeof(DbContextOptions<ShopMGRDbContexto>)
            );
            if (descriptor is not null)
                services.Remove(descriptor);

            services.AddDbContext<ShopMGRDbContexto>(options => options.UseSqlite(_conexion));
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        _conexion.Dispose();
    }
}
```

> **Convención crítica**: un factory por clase de test (xUnit `IClassFixture`). Nunca compartir el factory entre clases: cada clase tiene su propia BD `:memory:` (aislamiento R5/R8 de `test-plan.md`).

---

## 3. `ApiTestsBase.cs` — token lazy (1 login por suite) + helpers

```csharp
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using ShopMGR.Aplicacion.Data_Transfer_Objects;

namespace ShopMGR.Tests.Integration;

public abstract class ApiTestsBase : IClassFixture<ShopMGRWebApplicationFactory>
{
    protected ShopMGRWebApplicationFactory Factory { get; }

    protected ApiTestsBase(ShopMGRWebApplicationFactory factory)
    {
        Factory = factory;
    }

    // Un solo login por suite (rate limiter: 5 login/min/IP, ver test-plan.md §8-R1).
    // Lazy<Task<..>>: thread-safe ante clases corriendo en paralelo.
    private static readonly Lazy<Task<string>> TokenSuite = new(CargarTokenAsync);

    private static async Task<string> CargarTokenAsync()
    {
        using var factory = new ShopMGRWebApplicationFactory();
        using var client = factory.CreateClient();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Auth/IniciarSesion",
            new UsuarioDTO { UserName = Claves.AdminUsername, Password = Claves.AdminPassword }
        );
        respuesta.StatusCode.Should().Be(System.Net.HttpStatusCode.OK, "el admin del Bootstrap debe poder loguear");

        var login = await respuesta.Content.ReadFromJsonAsync<RespuestaLogin>();
        login!.AccessToken.Should().NotBeNullOrWhiteSpace();
        return login.AccessToken;
    }

    protected async Task<HttpClient> CrearClienteAutenticadoAsync()
    {
        var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            await TokenSuite.Value
        );
        return client;
    }

    // Las colecciones vienen con $id/$values (ReferenceHandler.IgnoreCycles — test-plan.md §8-R6).
    protected static JsonElement LeerValores(JsonElement raiz)
    {
        raiz.TryGetProperty("$values", out var valores).Should().BeTrue("la respuesta debe traer $values");
        return valores;
    }
}
```

---

## 4. `LoginApiTests.cs` — TC-AUTH-01..13

```csharp
using System.Net;
using System.Text.Json;
using FluentAssertions;
using ShopMGR.Aplicacion.Data_Transfer_Objects;

namespace ShopMGR.Tests.Integration;

// Contrato de auth verificado en test-plan.md §3 (V7, V8): login fallido → 400,
// cookie refreshToken HttpOnly/Strict/Path=/api/Auth, refresh rota el token.
// Máximo 4 llamadas a IniciarSesion en esta clase (límite 5/min — R1).
public class LoginApiTests : ApiTestsBase
{
    public LoginApiTests(ShopMGRWebApplicationFactory factory) : base(factory) { }

    private const string NombreCookie = "refreshToken";

    [Fact]
    public async Task IniciarSesion_ConCredencialesValidas_DevuelveJwtYCookie()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Auth/IniciarSesion",
            new UsuarioDTO { UserName = Claves.AdminUsername, Password = Claves.AdminPassword }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await respuesta.Content.ReadFromJsonAsync<RespuestaLogin>();
        body!.AccessToken.Should().NotBeNullOrWhiteSpace();
        body.RequiereCambioContraseña.Should().BeFalse();
        // El refreshToken viaja SOLO en la cookie, nunca en el body (contrato #114 SEV-001).
        (await respuesta.Content.ReadAsStringAsync()).Should().NotContain("refreshToken");

        var setCookie = respuesta.Headers.GetValues("Set-Cookie").FirstOrDefault();
        setCookie.Should().Contain($"{NombreCookie}=");
        setCookie.Should().Contain("HttpOnly");
        setCookie.Should().Contain("SameSite=Strict");
        setCookie.Should().Contain("Path=/api/Auth");
    }

    [Fact]
    public async Task IniciarSesion_ConContrasenaIncorrecta_Devuelve400()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Auth/IniciarSesion",
            new UsuarioDTO { UserName = Claves.AdminUsername, Password = "incorrecta" }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var texto = await respuesta.Content.ReadAsStringAsync();
        texto.Should().Contain("Nombre de usuario o contraseña incorrectos");
    }

    [Fact]
    public async Task IniciarSesion_ConUsuarioInexistente_Devuelve400YNoFiltra()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Auth/IniciarSesion",
            new UsuarioDTO { UserName = "no-existe-xyz", Password = "cualquiera" }
        );

        // Mismo mensaje que con contraseña incorrecta: no revela cuál campo falló.
        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await respuesta.Content.ReadAsStringAsync()).Should().Contain("incorrectos");
    }

    [Fact]
    public async Task IniciarSesion_ConBodyInvalido_Devuelve400()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Auth/IniciarSesion",
            new { UserName = "admin" }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task EndpointProtegido_SinToken_Devuelve401()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.GetAsync("/api/Auth");

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task EndpointProtegido_ConTokenValido_Devuelve200()
    {
        using var client = await CrearClienteAutenticadoAsync();

        var respuesta = await client.GetAsync("/api/Auth");

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        (await respuesta.Content.ReadAsStringAsync()).Should().Contain("Autenticado");
    }

    [Fact]
    public async Task Refrescar_SinCookie_Devuelve401()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.PostAsync("/api/Auth/Refrescar", null);

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Refrescar_ConCookieValida_RotaElToken()
    {
        using var client = Factory.CreateClient();

        var login = await client.PostAsJsonAsync(
            "/api/Auth/IniciarSesion",
            new UsuarioDTO { UserName = Claves.AdminUsername, Password = Claves.AdminPassword }
        );
        var tokenOriginal = (await login.Content.ReadFromJsonAsync<RespuestaLogin>())!.AccessToken;
        var cookie = login.Headers.GetValues("Set-Cookie").Single();
        var valorCookie = cookie.Split(';')[0].Split('=', 2)[1];
        client.DefaultRequestHeaders.Add("Cookie", $"{NombreCookie}={valorCookie}");

        var respuesta = await client.PostAsync("/api/Auth/Refrescar", null);

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        var nuevo = await respuesta.Content.ReadFromJsonAsync<RespuestaLogin>();
        nuevo!.AccessToken.Should().NotBe(tokenOriginal);
        respuesta.Headers.GetValues("Set-Cookie").Single().Should().Contain($"{NombreCookie}=");
    }

    [Fact]
    public async Task CerrarSesion_BorraLaCookie()
    {
        using var client = Factory.CreateClient();

        var login = await client.PostAsJsonAsync(
            "/api/Auth/IniciarSesion",
            new UsuarioDTO { UserName = Claves.AdminUsername, Password = Claves.AdminPassword }
        );
        var cookie = login.Headers.GetValues("Set-Cookie").Single();
        client.DefaultRequestHeaders.Add("Cookie", $"{NombreCookie}={cookie.Split(';')[0].Split('=', 2)[1]}");

        var respuesta = await client.PostAsync("/api/Auth/CerrarSesion", null);

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        var setCookie = respuesta.Headers.GetValues("Set-Cookie").Single();
        // El borrado debe usar los MISMOS atributos que la creación (contrato #114 SEV-001).
        setCookie.Should().Contain($"{NombreCookie}=;");
        setCookie.Should().Contain("Path=/api/Auth");
        setCookie.Should().Contain("HttpOnly");
    }

    [Fact]
    public async Task Refrescar_ConCookieRevocada_Devuelve401()
    {
        using var client = Factory.CreateClient();

        var login = await client.PostAsJsonAsync(
            "/api/Auth/IniciarSesion",
            new UsuarioDTO { UserName = Claves.AdminUsername, Password = Claves.AdminPassword }
        );
        var cookie = login.Headers.GetValues("Set-Cookie").Single();
        var valorCookie = cookie.Split(';')[0].Split('=', 2)[1];

        var cerrar = await client.PostAsync("/api/Auth/CerrarSesion", null);
        cerrar.StatusCode.Should().Be(HttpStatusCode.OK);
        client.DefaultRequestHeaders.Remove("Cookie");
        client.DefaultRequestHeaders.Add("Cookie", $"{NombreCookie}={valorCookie}");

        var respuesta = await client.PostAsync("/api/Auth/Refrescar", null);

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task RegistrarUsuario_ConUsuarioNuevo_Devuelve200()
    {
        using var client = Factory.CreateClient();
        var nombre = $"nuevo_{Guid.NewGuid():N}";

        var respuesta = await client.PostAsJsonAsync(
            "/api/Auth/RegistrarUsuario",
            new UsuarioDTO { UserName = nombre, Password = "Passw0rd!" }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        (await respuesta.Content.ReadAsStringAsync()).Should().Contain("Usuario creado con exito");
    }

    [Fact]
    public async Task RegistrarUsuario_ConUsuarioDuplicado_Devuelve400()
    {
        using var client = Factory.CreateClient();
        var nombre = $"dup_{Guid.NewGuid():N}";
        await client.PostAsJsonAsync(
            "/api/Auth/RegistrarUsuario",
            new UsuarioDTO { UserName = nombre, Password = "Passw0rd!" }
        );

        var respuesta = await client.PostAsJsonAsync(
            "/api/Auth/RegistrarUsuario",
            new UsuarioDTO { UserName = nombre, Password = "Passw0rd!" }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await respuesta.Content.ReadAsStringAsync()).Should().Contain("ya esta en uso");
    }
}
```

---

## 5. `ClienteApiTests.cs` — TC-CLI-01..15 (menos TC-CLI-06)

```csharp
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Contexto;

namespace ShopMGR.Tests.Integration;

public class ClienteApiTests : ApiTestsBase
{
    public ClienteApiTests(ShopMGRWebApplicationFactory factory) : base(factory) { }

    private static string NombreUnico() => $"Cliente {Guid.NewGuid():N}";

    [Fact]
    public async Task CrearCliente_ConDatosValidos_PersisteYDevuelveElCliente()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var nombre = NombreUnico();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = nombre, cuit = "20-12345678-9" }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("id").GetInt32().Should().BeGreaterThan(0);

        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        (await contexto.Clientes.AnyAsync(c => c.NombreCompleto == nombre)).Should().BeTrue();
    }

    [Fact]
    public async Task CrearCliente_SinNombre_Devuelve400()
    {
        using var client = await CrearClienteAutenticadoAsync();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { cuit = "20-12345678-9" }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CrearCliente_ConNombreDuplicado_Devuelve400()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var nombre = NombreUnico();
        await client.PostAsJsonAsync("/api/Cliente/CrearCliente", new { nombreCompleto = nombre });

        var respuesta = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = nombre }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await respuesta.Content.ReadAsStringAsync()).Should().Contain($"Ya existe un cliente llamado {nombre}");
    }

    [Fact]
    public async Task CrearCliente_SinToken_Devuelve401()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = "Anonimo" }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ObtenerListaClientes_ConDatos_DevuelveLosClientes()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var nombre = NombreUnico();
        await client.PostAsJsonAsync("/api/Cliente/CrearCliente", new { nombreCompleto = nombre });

        var respuesta = await client.GetAsync("/api/Cliente/ObtenerListaClientes");

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        var valores = LeerValores(doc.RootElement);
        valores.EnumerateArray().Select(c => c.GetProperty("nombreCompleto").GetString())
            .Should().Contain(nombre);
    }

    [Fact]
    public async Task ObtenerClientePorId_Inexistente_Devuelve404()
    {
        using var client = await CrearClienteAutenticadoAsync();

        var respuesta = await client.GetAsync("/api/Cliente/ObtenerClientePorId?idCliente=999999");

        respuesta.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await respuesta.Content.ReadAsStringAsync()).Should().Contain("No se encontró un cliente");
    }

    [Fact]
    public async Task ObtenerClientePorNombre_ConNombreVacio_Devuelve400()
    {
        using var client = await CrearClienteAutenticadoAsync();

        var respuesta = await client.GetAsync("/api/Cliente/ObtenerClientePorNombre?nombre=");

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ModificarCliente_Existente_PersisteElCambio()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var nombreOriginal = NombreUnico();
        var crear = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = nombreOriginal }
        );
        using var creado = JsonDocument.Parse(await crear.Content.ReadAsStringAsync());
        var id = creado.RootElement.GetProperty("id").GetInt32();
        var nombreNuevo = $"{nombreOriginal} (editado)";

        var respuesta = await client.PatchAsJsonAsync(
            $"/api/Cliente/ModificarCliente?idCliente={id}",
            new { nombreCompleto = nombreNuevo }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var cliente = await contexto.Clientes.FindAsync(id);
        cliente!.NombreCompleto.Should().Be(nombreNuevo);
    }

    [Fact]
    public async Task ModificarCliente_Inexistente_Devuelve404()
    {
        using var client = await CrearClienteAutenticadoAsync();

        var respuesta = await client.PatchAsJsonAsync(
            "/api/Cliente/ModificarCliente?idCliente=999999",
            new { nombreCompleto = "X" }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task EliminarCliente_Existente_LoElimina()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var crear = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = NombreUnico() }
        );
        using var creado = JsonDocument.Parse(await crear.Content.ReadAsStringAsync());
        var id = creado.RootElement.GetProperty("id").GetInt32();

        var respuesta = await client.DeleteAsync($"/api/Cliente/EliminarCliente?idCliente={id}");

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        (await contexto.Clientes.FindAsync(id)).Should().BeNull();
    }

    [Fact]
    public async Task EliminarCliente_Inexistente_Devuelve404()
    {
        using var client = await CrearClienteAutenticadoAsync();

        var respuesta = await client.DeleteAsync("/api/Cliente/EliminarCliente?idCliente=999999");

        respuesta.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CrearMovimiento_ConClienteExistente_ActualizaElBalance()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var crear = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = NombreUnico() }
        );
        using var creado = JsonDocument.Parse(await crear.Content.ReadAsStringAsync());
        var idCliente = creado.RootElement.GetProperty("id").GetInt32();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Cliente/CrearMovimiento",
            new { monto = 1000m, descripcion = "Pago inicial", fecha = "2026-08-08", tipo = "Pago", idCliente }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var cliente = await contexto.Clientes.Include(c => c.Balance).FirstAsync(c => c.Id == idCliente);
        cliente.Balance.Should().NotBeNull();
    }
}
```

---

## 6. `ClienteListaVaciaApiTests.cs` — TC-CLI-06 (BD fresca dedicada)

```csharp
using System.Net;
using FluentAssertions;

namespace ShopMGR.Tests.Integration;

// Clase DEDICADA: el 404 de lista vacía solo es válido con BD sin clientes.
// Cada clase tiene su propio factory → su propia BD :memory: recién migrada
// (el Bootstrap solo siembra el usuario admin, nunca clientes).
public class ClienteListaVaciaApiTests : ApiTestsBase
{
    public ClienteListaVaciaApiTests(ShopMGRWebApplicationFactory factory) : base(factory) { }

    [Fact]
    public async Task ObtenerListaClientes_SinClientes_Devuelve404()
    {
        using var client = await CrearClienteAutenticadoAsync();

        var respuesta = await client.GetAsync("/api/Cliente/ObtenerListaClientes");

        respuesta.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await respuesta.Content.ReadAsStringAsync()).Should().Contain("No se encontraron clientes");
    }
}
```

---

## 7. `TrabajoApiTests.cs` — TC-TRA-01..13

```csharp
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Enums;

namespace ShopMGR.Tests.Integration;

public class TrabajoApiTests : ApiTestsBase
{
    public TrabajoApiTests(ShopMGRWebApplicationFactory factory) : base(factory) { }

    private async Task<int> CrearClienteAsync(HttpClient client)
    {
        var respuesta = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = $"Cliente Trabajo {Guid.NewGuid():N}" }
        );
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("id").GetInt32();
    }

    private async Task<int> CrearTrabajoAsync(HttpClient client, int idCliente, string titulo)
    {
        var respuesta = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { titulo, idCliente, estado = "Pendiente" }
        );
        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("id").GetInt32();
    }

    [Fact]
    public async Task CrearTrabajo_ConClienteValido_PersisteYDevuelveElTrabajo()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var idCliente = await CrearClienteAsync(client);
        var titulo = $"Trabajo {Guid.NewGuid():N}";

        var respuesta = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { titulo, idCliente, estado = "Pendiente" }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("titulo").GetString().Should().Be(titulo);
        doc.RootElement.GetProperty("estado").GetString().Should().Be(EstadoTrabajo.Pendiente.ToString());

        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        (await contexto.Trabajos.AnyAsync(t => t.Titulo == titulo)).Should().BeTrue();
    }

    [Fact]
    public async Task CrearTrabajo_SinTitulo_Devuelve400()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var idCliente = await CrearClienteAsync(client);

        var respuesta = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { idCliente }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CrearTrabajo_SinToken_Devuelve401()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { titulo = "X", idCliente = 1 }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ObtenerListaTrabajos_ConDatos_DevuelveLosTrabajos()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var idCliente = await CrearClienteAsync(client);
        var titulo = $"Trabajo {Guid.NewGuid():N}";
        await CrearTrabajoAsync(client, idCliente, titulo);

        var respuesta = await client.GetAsync("/api/Trabajos/ObtenerListaTrabajos");

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        var valores = LeerValores(doc.RootElement);
        valores.EnumerateArray().Select(t => t.GetProperty("titulo").GetString())
            .Should().Contain(titulo);
    }

    [Fact]
    public async Task ObtenerTrabajoPorId_Inexistente_Devuelve404()
    {
        using var client = await CrearClienteAutenticadoAsync();

        var respuesta = await client.GetAsync("/api/Trabajos/ObtenerTrabajoPorId?idTrabajo=999999");

        respuesta.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await respuesta.Content.ReadAsStringAsync()).Should().Contain("No existe un trabajo");
    }

    [Fact]
    public async Task ObtenerTrabajosPorCliente_SinTrabajos_Devuelve404()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var idCliente = await CrearClienteAsync(client);

        var respuesta = await client.GetAsync($"/api/Trabajos/ObtenerTrabajosPorCliente?idCliente={idCliente}");

        respuesta.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ObtenerTrabajosPorEstado_SinResultados_Devuelve404()
    {
        using var client = await CrearClienteAutenticadoAsync();

        var respuesta = await client.GetAsync($"/api/Trabajos/ObtenerTrabajosPorEstado?estado={EstadoTrabajo.Terminado}");

        respuesta.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task IniciarTrabajo_CambiaElEstadoAIniciado()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var idCliente = await CrearClienteAsync(client);
        var id = await CrearTrabajoAsync(client, idCliente, $"Trabajo {Guid.NewGuid():N}");

        var respuesta = await client.PatchAsync($"/api/Trabajos/IniciarTrabajo?idTrabajo={id}", null);

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        (await contexto.Trabajos.FindAsync(id))!.Estado.Should().Be(EstadoTrabajo.Iniciado);
    }

    [Fact]
    public async Task TerminarTrabajo_CambiaElEstadoATerminado()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var idCliente = await CrearClienteAsync(client);
        var id = await CrearTrabajoAsync(client, idCliente, $"Trabajo {Guid.NewGuid():N}");
        await client.PatchAsync($"/api/Trabajos/IniciarTrabajo?idTrabajo={id}", null);

        var respuesta = await client.PatchAsync($"/api/Trabajos/TerminarTrabajo?idTrabajo={id}", null);

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        (await contexto.Trabajos.FindAsync(id))!.Estado.Should().Be(EstadoTrabajo.Terminado);
    }

    [Fact]
    public async Task AgregarHorasDeTrabajo_ConTrabajoExistente_PersisteLasHoras()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var idCliente = await CrearClienteAsync(client);
        var id = await CrearTrabajoAsync(client, idCliente, $"Trabajo {Guid.NewGuid():N}");

        var respuesta = await client.PostAsJsonAsync(
            "/api/Trabajos/AgregarHorasDeTrabajo",
            new HorasYDescripcionDTO { Horas = 2, Descripcion = "Diagnóstico", Fecha = new DateOnly(2026, 8, 8), IdTrabajo = id }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        (await contexto.HorasYDescripcion.AnyAsync(h => h.IdTrabajo == id && h.Descripcion == "Diagnóstico")).Should().BeTrue();
    }

    [Fact]
    public async Task AgregarHorasDeTrabajo_ConTrabajoInexistente_Devuelve404()
    {
        using var client = await CrearClienteAutenticadoAsync();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Trabajos/AgregarHorasDeTrabajo",
            new HorasYDescripcionDTO { Horas = 2, Descripcion = "X", Fecha = new DateOnly(2026, 8, 8), IdTrabajo = 999999 }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task EliminarTrabajo_Existente_LoElimina()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var idCliente = await CrearClienteAsync(client);
        var id = await CrearTrabajoAsync(client, idCliente, $"Trabajo {Guid.NewGuid():N}");

        var respuesta = await client.DeleteAsync($"/api/Trabajos/EliminarTrabajo?idTrabajo={id}");

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        (await contexto.Trabajos.FindAsync(id)).Should().BeNull();
    }

    [Fact]
    public async Task EliminarTrabajo_Inexistente_Devuelve404()
    {
        using var client = await CrearClienteAutenticadoAsync();

        var respuesta = await client.DeleteAsync("/api/Trabajos/EliminarTrabajo?idTrabajo=999999");

        respuesta.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
```

---

## 8. `PresupuestoApiTests.cs` — TC-PRE-01..11

```csharp
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Enums;

namespace ShopMGR.Tests.Integration;

public class PresupuestoApiTests : ApiTestsBase
{
    public PresupuestoApiTests(ShopMGRWebApplicationFactory factory) : base(factory) { }

    private async Task<int> CrearClienteAsync(HttpClient client)
    {
        var respuesta = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = $"Cliente Presupuesto {Guid.NewGuid():N}" }
        );
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("id").GetInt32();
    }

    private async Task<int> CrearPresupuestoAsync(HttpClient client, int idCliente)
    {
        var respuesta = await client.PostAsJsonAsync(
            "/api/Presupuestos/CrearPresupuesto",
            new
            {
                titulo = $"Presupuesto {Guid.NewGuid():N}",
                descripcion = "Reparación general",
                horasEstimadas = 3,
                idCliente,
                materiales = new[]
                {
                    new { descripcion = "Perno M8", precio = 150.5m, cantidad = 4d },
                },
            }
        );
        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("id").GetInt32();
    }

    [Fact]
    public async Task CrearPresupuesto_ConMateriales_PersistePresupuestoYMateriales()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var idCliente = await CrearClienteAsync(client);
        var titulo = $"Presupuesto {Guid.NewGuid():N}";

        var respuesta = await client.PostAsJsonAsync(
            "/api/Presupuestos/CrearPresupuesto",
            new
            {
                titulo,
                horasEstimadas = 3,
                idCliente,
                materiales = new[]
                {
                    new { descripcion = "Perno M8", precio = 150.5m, cantidad = 4d },
                },
            }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var presupuesto = await contexto
            .Presupuestos.Include(p => p.Materiales)
            .FirstAsync(p => p.Titulo == titulo);
        presupuesto.Materiales.Should().ContainSingle(m => m.Descripcion == "Perno M8");
    }

    [Fact]
    public async Task CrearPresupuesto_SinTitulo_Devuelve400()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var idCliente = await CrearClienteAsync(client);

        var respuesta = await client.PostAsJsonAsync(
            "/api/Presupuestos/CrearPresupuesto",
            new { horasEstimadas = 3, idCliente }
        );

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ListarPresupuestos_ConDatos_DevuelveLosPresupuestos()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var idCliente = await CrearClienteAsync(client);
        var titulo = $"Presupuesto {Guid.NewGuid():N}";
        var respuestaCrear = await client.PostAsJsonAsync(
            "/api/Presupuestos/CrearPresupuesto",
            new { titulo, horasEstimadas = 2, idCliente }
        );
        respuestaCrear.StatusCode.Should().Be(HttpStatusCode.OK);

        var respuesta = await client.GetAsync("/api/Presupuestos/ListarPresupuestos");

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        var valores = LeerValores(doc.RootElement);
        valores.EnumerateArray().Select(p => p.GetProperty("titulo").GetString())
            .Should().Contain(titulo);
    }

    [Fact]
    public async Task ObtenerPresupuestoPorId_Inexistente_Devuelve404()
    {
        using var client = await CrearClienteAutenticadoAsync();

        var respuesta = await client.GetAsync("/api/Presupuestos/ObtenerPresupuestoPorId?idPresupuesto=999999");

        respuesta.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await respuesta.Content.ReadAsStringAsync()).Should().Contain("No existe un presupuesto");
    }

    [Fact]
    public async Task ObtenerPresupuestosPorCliente_SinDatos_Devuelve404()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var idCliente = await CrearClienteAsync(client);

        var respuesta = await client.GetAsync($"/api/Presupuestos/ObtenerPresupuestosPorCliente?idCliente={idCliente}");

        respuesta.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task AceptarPresupuesto_CambiaElEstado()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var idCliente = await CrearClienteAsync(client);
        var id = await CrearPresupuestoAsync(client, idCliente);

        var respuesta = await client.PatchAsync($"/api/Presupuestos/AceptarPresupuesto?idPresupuesto={id}", null);

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        (await contexto.Presupuestos.FindAsync(id))!.Estado.Should().Be(EstadoPresupuesto.Aceptado);
    }

    [Fact]
    public async Task RechazarPresupuesto_CambiaElEstado()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var idCliente = await CrearClienteAsync(client);
        var id = await CrearPresupuestoAsync(client, idCliente);

        var respuesta = await client.PatchAsync($"/api/Presupuestos/RechazarPresupuesto?idPresupuesto={id}", null);

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        (await contexto.Presupuestos.FindAsync(id))!.Estado.Should().Be(EstadoPresupuesto.Rechazado);
    }

    [Fact]
    public async Task EliminarPresupuesto_Existente_LoElimina()
    {
        using var client = await CrearClienteAutenticadoAsync();
        var idCliente = await CrearClienteAsync(client);
        var id = await CrearPresupuestoAsync(client, idCliente);

        var respuesta = await client.DeleteAsync($"/api/Presupuestos/EliminarPresupuesto?idPresupuesto={id}");

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        (await contexto.Presupuestos.FindAsync(id)).Should().BeNull();
    }

    [Fact]
    public async Task ObtenerCostoHoraDeTrabajo_DevuelveUnDecimal()
    {
        using var client = await CrearClienteAutenticadoAsync();

        var respuesta = await client.GetAsync("/api/Presupuestos/ObtenerCostoHoraDeTrabajo");

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        await respuesta.Content.ReadFromJsonAsync<decimal>();
    }

    [Fact]
    public async Task ActualizarCostoHoraDeTrabajo_PersisteElNuevoValor()
    {
        using var client = await CrearClienteAutenticadoAsync();

        var respuesta = await client.PatchAsync("/api/Presupuestos/ActualizarCostoHoraDeTrabajo?nuevoCosto=150", null);

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        var posterior = await client.GetAsync("/api/Presupuestos/ObtenerCostoHoraDeTrabajo");
        var valor = await posterior.Content.ReadFromJsonAsync<decimal>();
        valor.Should().Be(150m);
    }
}
```

---

## 9. Comandos de ejecución

```bash
# Suite completa (unit + integración)
dotnet test ShopMGR.Tests

# Solo integración nueva
dotnet test ShopMGR.Tests --filter "FullyQualifiedName~ApiTests"

# Cobertura
dotnet test ShopMGR.Tests --collect:"XPlat Code Coverage"
```

---

## 10. Notas de implementación (para el dueño)

1. **Los tests NO deben usar `Thread.Sleep` ni retries**: toda espera de red en el host de test es síncrona dentro de la request.
2. **`Assert` de estado en BD** vía `Factory.Services.CreateScope()` — es el mismo SQLite compartido que atiende las requests.
3. **Si un test falla contra la implementación actual, es un bug a reportar** (issue + severity), no un test a modificar — mismo criterio que `AuthControllerTests.cs` del proyecto.
4. **`SKIP` solo con razón + issue#** (regla de comentarios QA). Ej: `// SKIP: pendiente de fix #<n> en backend`.
5. **Fallback documentado** (si SQLite diera un problema provider-específico): cambiar el factory a `.UseInMemoryDatabase("Integracion-" + Guid.NewGuid())` — aceptando las salvedades de `test-plan.md` (V4: `ExecuteDeleteAsync` no soportado → log de error del hosted service; V12: FK no validadas).
