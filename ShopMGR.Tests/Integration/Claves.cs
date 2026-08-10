namespace ShopMGR.Tests.Integration;

// Datos de entorno del host de test (ver test-plan.md §6).
// Si el dueño prefiere otras credenciales, se cambian solo acá.
public static class Claves
{
    public const string AdminUsername = "admin";
    public const string AdminPassword = "Admin123!";

    // Mínimo 64 bytes (512 bits) para HS512 que usa AdministrarAuth; Issuer/Audience reales vienen de appsettings.json.
    public const string JwtToken = "ClaveDePruebaShopMGR_0123456789abcdef012345678901234567890123456789";

    public const string ConexionSqlite = "Data Source=:memory:";
}
