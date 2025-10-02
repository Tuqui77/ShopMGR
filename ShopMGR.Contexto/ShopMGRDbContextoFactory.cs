using System.Reflection;
using System.Runtime.InteropServices;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace ShopMGR.Contexto;

public class ShopMGRDbContextoFactory : IDesignTimeDbContextFactory<ShopMGRDbContexto>
{
    public ShopMGRDbContexto CreateDbContext(string[] args)
    {
        IConfigurationRoot configuracion = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json")
            .AddUserSecrets(Assembly.GetExecutingAssembly(), optional: true)
            .Build();
        
        var connectionString = configuracion.GetConnectionString("ShopMGRDbContexto");

        var optionsBuilder = new DbContextOptionsBuilder<ShopMGRDbContexto>();
        optionsBuilder.UseSqlServer(connectionString);
        return new ShopMGRDbContexto(optionsBuilder.Options);
    }
}