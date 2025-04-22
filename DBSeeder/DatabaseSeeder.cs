using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ShopMGR.Contexto;

namespace DBSeeder
{
    public class DatabaseSeeder
    {
        public static async Task Main(string[] args)
        {
            var host = Host.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((context, config) =>
                {
                    config.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
                })
                .ConfigureServices((context, services) =>
                {
                    services.AddDbContext<ShopMGRDbContexto>(options =>
                        options.UseSqlServer(context.Configuration.GetConnectionString("ShopMGRDbContexto")));

                    services.AddTransient<DatabaseSeeder>();
                })
                .Build();

            using var scope = host.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
            var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
            db.Database.Migrate();
            await seeder.SeedAsync();

            Console.WriteLine("Seeding completo.");
        }
        private readonly ShopMGRDbContexto _contexto;

        public DatabaseSeeder(ShopMGRDbContexto contexto)
        {
            _contexto = contexto;
        }


        public async Task SeedAsync()
        {
            var sql = """
                    -- Seteo de IdPresupuesto en NULL para evitar conflictos de FK antes del DELETE
                    UPDATE [dbo].[Presupuestos]
                    SET IdTrabajo = NULL;

                    -- Limpieza previa
                    DELETE FROM [dbo].[Fotos];
                    DELETE FROM [dbo].[Materiales];
                    DELETE FROM [dbo].[Trabajos];
                    DELETE FROM [dbo].[Presupuestos];
                    DELETE FROM [dbo].[Direccion];
                    DELETE FROM [dbo].[TelefonoCliente];
                    DELETE FROM [dbo].[Clientes];
                    DELETE FROM [dbo].[Configuraciones];

                    -- Insert en Clientes
                    SET IDENTITY_INSERT [dbo].[Clientes] ON
                    INSERT [dbo].[Clientes] ([Id], [NombreCompleto], [Balance], [CUIT]) VALUES 
                    (1, N'Juan Perez', 500.00, N'20304050607'),
                    (2, N'Maria Lopez', 1500.50, N'27384920123'),
                    (3, N'Carlos Fernandez', 0.00, N'30293847561'),
                    (4, N'Ana Gonzalez', 730.75, N'20938475612'),
                    (5, N'Luis Rodriguez', 1040.00, N'27483920194'),
                    (6, N'Cliente Test', 0.00, N'12345678901'),
                    (18, N'Cliente Demostracion', 0.00, N'4862763091')
                    SET IDENTITY_INSERT [dbo].[Clientes] OFF
                    
                    -- Insert en Presupuestos
                    SET IDENTITY_INSERT [dbo].[Presupuestos] ON
                    INSERT [dbo].[Presupuestos] (
                        [Id], [IdCliente], [Titulo], [Descripcion], [Fecha], [Total], [Estado],
                        [IdTrabajo], [CostoMateriales], [CostoLabor], [CostoInsumos], [HorasEstimadas]
                    ) VALUES 
                    (1, 1, N'Reparacion general', N'Se requiere reparacion completa de equipos.', '2023-12-15', 1500.00, 0, NULL, 600.00, 700.00, 200.00, 12),
                    (2, 2, N'Mantenimiento programado', N'Revision y limpieza de sistemas.', '2024-01-10', 800.00, 1, NULL, 300.00, 400.00, 100.00, 8),
                    (3, 3, N'Instalacion electrica', N'Instalacion de nuevo sistema de iluminacion.', '2024-02-05', 2300.00, 0, NULL, 1000.00, 1000.00, 300.00, 16),
                    (4, 4, N'Actualizacion de software', N'Se requiere migracion y configuracion.', '2024-02-28', 1200.00, 2, NULL, 500.00, 600.00, 100.00, 6),
                    (5, 5, N'Presupuesto personalizado', N'Detalles entregados por el cliente.', '2024-03-01', 1750.00, 1, NULL, 800.00, 800.00, 150.00, 10),
                    (6, 18, N'Servicio especial', N'Servicio premium personalizado.', '2024-04-01', 10000.00, 0, NULL, 3000.00, 5000.00, 2000.00, 20)
                    SET IDENTITY_INSERT [dbo].[Presupuestos] OFF

                    -- Insert en Trabajos
                    SET IDENTITY_INSERT [dbo].[Trabajos] ON
                    INSERT [dbo].[Trabajos] ([Id], [Titulo], [IdCliente], [IdPresupuesto], [Estado], [FechaInicio]) VALUES 
                    (1, N'Reparacion general', 1, 1, 1, '2024-01-15'),
                    (2, N'Mantenimiento programado', 2, 2, 1, '2024-03-02'),
                    (3, N'Instalacion electrica', 3, 3, 0, NULL)
                    SET IDENTITY_INSERT [dbo].[Trabajos] OFF

                    -- Insert en Materiales
                    SET IDENTITY_INSERT [dbo].[Materiales] ON
                    INSERT [dbo].[Materiales] ([Id], [IdPresupuesto], [Descripcion], [Precio], [Cantidad]) VALUES 
                    (1, 1, N'Cable electrico', 200.00, 10),
                    (2, 1, N'Interruptores', 150.00, 5),
                    (3, 2, N'Software licencia', 500.00, 1),
                    (4, 2, N'Teclado inalambrico', 300.00, 2),
                    (5, 3, N'Kit instalacion avanzada', 750.00, 1),
                    (6, 3, N'Modulo de control', 450.00, 2),
                    (13, 3, N'Lubricante industrial', 10000.00, 1)
                    SET IDENTITY_INSERT [dbo].[Materiales] OFF

                    -- Insert en TelefonoCliente
                    SET IDENTITY_INSERT [dbo].[TelefonoCliente] ON
                    INSERT [dbo].[TelefonoCliente] ([Id], [IdCliente], [Telefono], [Descripcion]) VALUES 
                    (1, 1, N'1122334455', N'Principal'),
                    (2, 2, N'2233445566', N'Secundario'),
                    (3, 3, N'3344556677', N'Principal'),
                    (4, 4, N'4455667788', N'Secundario'),
                    (5, 5, N'5566778899', N'Principal'),
                    (6, 6, N'6677889900', N'Contacto alternativo'),
                    (7, 18, N'7788990011', N'Contacto principal')
                    SET IDENTITY_INSERT [dbo].[TelefonoCliente] OFF

                    -- Insert en Direccion
                    SET IDENTITY_INSERT [dbo].[Direccion] ON
                    INSERT [dbo].[Direccion] ([Id], [IdCliente], [Descripcion], [Calle], [Altura], [Piso], [Departamento], [CodigoPostal], [MapsID]) VALUES 
                    (1, 1, N'Domicilio particular', N'25 de Mayo', '7648', NULL, NULL, '2452', 'https://maps.app.goo.gl/rBVYMxgruycNTEDm8?g_st=aw'),
                    (2, 2, N'Domicilio laboral', N'Colon', '1213', NULL, NULL, '2452', 'https://maps.app.goo.gl/CWtJtokPSFwRjPRFA?g_st=aw'),
                    (3, 3, NULL, N'Dorrego', '6806', NULL, NULL, '2452', NULL),
                    (4, 4, NULL, N'Sarmiento', '3461', '5', '5F', '2452', NULL),
                    (5, 5, NULL, N'San Luis', '8788', NULL, NULL, '2452', NULL),
                    (6, 6, NULL, N'Corrientes', '7109', NULL, NULL, '2452', NULL),
                    (7, 18, NULL, N'Lisandro de la Torre', '3738', '2', '2A', '2452', NULL)
                    SET IDENTITY_INSERT [dbo].[Direccion] OFF

                    -- Insert en Configuraciones
                    SET IDENTITY_INSERT [dbo].[Configuraciones] ON
                    INSERT [dbo].[Configuraciones] ([Id], [Clave], [Valor]) VALUES 
                    (1, N'ValorHoraDeTrabajo', '10000')
                    SET IDENTITY_INSERT [dbo].[Configuraciones] OFF

                    -- Actualización de Presupuestos para asignar IdTrabajo correspondiente
                    UPDATE P
                    SET P.IdTrabajo = T.Id
                    FROM [dbo].[Presupuestos] P
                    INNER JOIN [dbo].[Trabajos] T ON P.Id = T.IdPresupuesto;

                    """;

            await _contexto.Database.ExecuteSqlRawAsync(sql);
        }
    }

}
