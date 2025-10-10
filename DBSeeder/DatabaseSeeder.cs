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
					config.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
						.AddUserSecrets<DatabaseSeeder>()
						.AddEnvironmentVariables();
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


		private async Task SeedAsync()
		{
//             var sql = """
//                     -- Limpieza previa
//                     DELETE FROM [dbo].[Fotos];
//                     DELETE FROM [dbo].[Materiales];
//                     DELETE FROM [dbo].[Trabajos];
//                     DELETE FROM [dbo].[Presupuestos];
//                     DELETE FROM [dbo].[Direccion];
//                     DELETE FROM [dbo].[TelefonoCliente];
//                     DELETE FROM [dbo].[Clientes];
//                     DELETE FROM [dbo].[Configuraciones];
//
//                     -- Insert en Clientes
//                     SET IDENTITY_INSERT [dbo].[Clientes] ON
//                     INSERT [dbo].[Clientes] ([Id], [NombreCompleto], [Balance], [CUIT]) VALUES 
//                     (1, N'Juan Perez', 500.00, N'20304050607'),
//                     (2, N'Maria Lopez', 1500.50, N'27384920123'),
//                     (3, N'Carlos Fernandez', 0.00, N'30293847561'),
//                     (4, N'Ana Gonzalez', 730.75, N'20938475612'),
//                     (5, N'Luis Rodriguez', 1040.00, N'27483920194'),
//                     (6, N'Cliente Test', 0.00, N'12345678901'),
//                     (18, N'Cliente Demostracion', 0.00, N'4862763091')
//                     SET IDENTITY_INSERT [dbo].[Clientes] OFF
//                     
//                     -- Insert en Presupuestos
//                     SET IDENTITY_INSERT [dbo].[Presupuestos] ON
//                     INSERT [dbo].[Presupuestos] (
//                         [Id], [IdCliente], [Titulo], [Descripcion], [Fecha], [Total], [Estado], 
//                         [CostoMateriales], [CostoLabor], [CostoInsumos], [HorasEstimadas]
//                     ) VALUES 
//                     (1, 1, N'Reparacion general', N'Se requiere reparacion completa de equipos.', '2023-12-15', 1500.00, N'Pendiente', 600.00, 700.00, 200.00, 12),
//                     (2, 2, N'Mantenimiento programado', N'Revision y limpieza de sistemas.', '2024-01-10', 800.00, N'Aceptado', 300.00, 400.00, 100.00, 8),
//                     (3, 3, N'Instalacion electrica', N'Instalacion de nuevo sistema de iluminacion.', '2024-02-05', 2300.00, N'Pendiente', 1000.00, 1000.00, 300.00, 16),
//                     (4, 4, N'Actualizacion de software', N'Se requiere migracion y configuracion.', '2024-02-28', 1200.00, N'Rechazado', 500.00, 600.00, 100.00, 6),
//                     (5, 5, N'Presupuesto personalizado', N'Detalles entregados por el cliente.', '2024-03-01', 1750.00, N'Aceptado', 800.00, 800.00, 150.00, 10),
//                     (6, 18, N'Servicio especial', N'Servicio premium personalizado.', '2024-04-01', 10000.00, N'Pendiente', 3000.00, 5000.00, 2000.00, 20)
//                     SET IDENTITY_INSERT [dbo].[Presupuestos] OFF
//
//                     -- Insert en Trabajos
//                     SET IDENTITY_INSERT [dbo].[Trabajos] ON
//                     INSERT [dbo].[Trabajos] ([Id], [Titulo], [IdCliente], [IdPresupuesto], [Estado], [FechaInicio]) VALUES 
//                     (1, N'Reparacion general', 1, 1, N'Iniciado', '2024-01-15'),
//                     (2, N'Mantenimiento programado', 2, 2, N'Iniciado', '2024-03-02'),
//                     (3, N'Instalacion electrica', 3, 3, N'Pendiente', NULL)
//                     SET IDENTITY_INSERT [dbo].[Trabajos] OFF
//
//                     -- Insert en Materiales
//                     SET IDENTITY_INSERT [dbo].[Materiales] ON
//                     INSERT [dbo].[Materiales] ([Id], [IdPresupuesto], [Descripcion], [Precio], [Cantidad]) VALUES 
//                     (1, 1, N'Cable electrico', 200.00, 10),
//                     (2, 1, N'Interruptores', 150.00, 5),
//                     (3, 2, N'Software licencia', 500.00, 1),
//                     (4, 2, N'Teclado inalambrico', 300.00, 2),
//                     (5, 3, N'Kit instalacion avanzada', 750.00, 1),
//                     (6, 3, N'Modulo de control', 450.00, 2),
//                     (13, 3, N'Lubricante industrial', 10000.00, 1)
//                     SET IDENTITY_INSERT [dbo].[Materiales] OFF
//
//                     -- Insert en TelefonoCliente
//                     SET IDENTITY_INSERT [dbo].[TelefonoCliente] ON
//                     INSERT [dbo].[TelefonoCliente] ([Id], [IdCliente], [Telefono], [Descripcion]) VALUES 
//                     (1, 1, N'1122334455', N'Principal'),
//                     (2, 2, N'2233445566', N'Secundario'),
//                     (3, 3, N'3344556677', N'Principal'),
//                     (4, 4, N'4455667788', N'Secundario'),
//                     (5, 5, N'5566778899', N'Principal'),
//                     (6, 6, N'6677889900', N'Contacto alternativo'),
//                     (7, 18, N'7788990011', N'Contacto principal')
//                     SET IDENTITY_INSERT [dbo].[TelefonoCliente] OFF
//
//                     -- Insert en Direccion
//                     SET IDENTITY_INSERT [dbo].[Direccion] ON
//                     INSERT [dbo].[Direccion] ([Id], [IdCliente], [Descripcion], [Calle], [Altura], [Piso], [Departamento], [CodigoPostal], [MapsID]) VALUES 
//                     (1, 1, N'Domicilio particular', N'25 de Mayo', '7648', NULL, NULL, '2452', 'https://maps.app.goo.gl/rBVYMxgruycNTEDm8?g_st=aw'),
//                     (2, 2, N'Domicilio laboral', N'Colon', '1213', NULL, NULL, '2452', 'https://maps.app.goo.gl/CWtJtokPSFwRjPRFA?g_st=aw'),
//                     (3, 3, NULL, N'Dorrego', '6806', NULL, NULL, '2452', NULL),
//                     (4, 4, NULL, N'Sarmiento', '3461', '5', '5F', '2452', NULL),
//                     (5, 5, NULL, N'San Luis', '8788', NULL, NULL, '2452', NULL),
//                     (6, 6, NULL, N'Corrientes', '7109', NULL, NULL, '2452', NULL),
//                     (7, 18, NULL, N'Lisandro de la Torre', '3738', '2', '2A', '2452', NULL)
//                     SET IDENTITY_INSERT [dbo].[Direccion] OFF
//
//                     -- Insert en Configuraciones
//                     SET IDENTITY_INSERT [dbo].[Configuraciones] ON
//                     INSERT [dbo].[Configuraciones] ([Id], [Clave], [Valor]) VALUES 
//                     (1, N'ValorHoraDeTrabajo', '10000')
//                     SET IDENTITY_INSERT [dbo].[Configuraciones] OFF
//                     """;

			var sql = """
			          -- ============================================
			          -- Script de Seed para Base de Datos
			          -- ============================================

			          -- Deshabilitar constraints temporalmente
			          ALTER TABLE MovimientoBalance NOCHECK CONSTRAINT ALL;
			          ALTER TABLE TelefonoCliente NOCHECK CONSTRAINT ALL;
			          ALTER TABLE Direccion NOCHECK CONSTRAINT ALL;
			          ALTER TABLE Fotos NOCHECK CONSTRAINT ALL;
			          ALTER TABLE HorasYDescripcion NOCHECK CONSTRAINT ALL;
			          ALTER TABLE Materiales NOCHECK CONSTRAINT ALL;
			          ALTER TABLE Trabajos NOCHECK CONSTRAINT ALL;
			          ALTER TABLE Presupuestos NOCHECK CONSTRAINT ALL;
			          ALTER TABLE Clientes NOCHECK CONSTRAINT ALL;

			          -- Limpiar datos existentes (en orden por dependencias)
			          DELETE FROM MovimientoBalance;
			          DELETE FROM HorasYDescripcion;
			          DELETE FROM Fotos;
			          DELETE FROM Materiales;
			          DELETE FROM Trabajos;
			          DELETE FROM Presupuestos;
			          DELETE FROM TelefonoCliente;
			          DELETE FROM Direccion;
			          DELETE FROM Clientes;
			          DELETE FROM Configuraciones;

			          -- Reiniciar identities
			          DBCC CHECKIDENT ('MovimientoBalance', RESEED, 0);
			          DBCC CHECKIDENT ('HorasYDescripcion', RESEED, 0);
			          DBCC CHECKIDENT ('Fotos', RESEED, 0);
			          DBCC CHECKIDENT ('Materiales', RESEED, 0);
			          DBCC CHECKIDENT ('Trabajos', RESEED, 0);
			          DBCC CHECKIDENT ('Presupuestos', RESEED, 0);
			          DBCC CHECKIDENT ('TelefonoCliente', RESEED, 0);
			          DBCC CHECKIDENT ('Direccion', RESEED, 0);
			          DBCC CHECKIDENT ('Clientes', RESEED, 0);
			          DBCC CHECKIDENT ('Configuraciones', RESEED, 0);

			          -- ============================================
			          -- CLIENTES
			          -- ============================================
			          INSERT INTO Clientes (NombreCompleto, Cuit, Balance) VALUES
			          ('Juan Pérez', '20-12345678-9', -15000.00),
			          ('María González', '27-23456789-0', 5000.00),
			          ('Carlos Rodríguez', '20-34567890-1', -8500.00),
			          ('Ana Martínez', NULL, 0.00),
			          ('Roberto Silva', '20-45678901-2', -22000.00),
			          ('Laura Fernández', '27-56789012-3', 3500.00);

			          -- ============================================
			          -- TELÉFONOS CLIENTES
			          -- ============================================
			          INSERT INTO TelefonoCliente (Telefono, Descripcion, IdCliente) VALUES
			          ('3425-123456', 'Celular personal', 1),
			          ('342-4567890', 'Teléfono fijo', 1),
			          ('3425-234567', 'Celular', 2),
			          ('3425-345678', 'WhatsApp', 3),
			          ('342-5678901', 'Casa', 3),
			          ('3425-456789', 'Celular', 4),
			          ('3425-567890', 'Trabajo', 5),
			          ('3425-678901', 'Celular', 6);

			          -- ============================================
			          -- DIRECCIONES
			          -- ============================================
			          INSERT INTO Direccion (Calle, Altura, Piso, Departamento, Descripcion, CodigoPostal, MapsID, IdCliente) VALUES
			          ('San Martín', '1234', NULL, NULL, 'Casa particular', '3000', NULL, 1),
			          ('Belgrano', '567', '3', 'B', 'Departamento', '3000', NULL, 2),
			          ('25 de Mayo', '890', NULL, NULL, 'Casa con portón azul', '3000', NULL, 3),
			          ('Rivadavia', '432', '1', 'A', NULL, '3000', NULL, 4),
			          ('Mitre', '765', NULL, NULL, 'Frente a la plaza', '3000', NULL, 5),
			          ('Sarmiento', '321', '2', NULL, NULL, '3000', NULL, 6);

			          -- ============================================
			          -- PRESUPUESTOS
			          -- ============================================
			          INSERT INTO Presupuestos (Titulo, Descripcion, HorasEstimadas, Fecha, CostoMateriales, CostoLabor, CostoInsumos, Total, Estado, IdCliente) VALUES
			          -- Presupuestos Aceptados (se convirtieron en trabajos)
			          ('Instalación eléctrica completa', 'Renovación de tablero y cableado', 20.0, '2024-09-15', 12000.00, 50000.00, 3000.00, 65000.00, 1, 1),
			          ('Reparación de baño', 'Cambio de grifería y arreglo de pérdidas', 8.0, '2024-10-01', 8000.00, 20000.00, 1500.00, 29500.00, 1, 3),
			          ('Pintura interior', 'Pintura de living y comedor', 12.0, '2024-10-05', 5000.00, 30000.00, 2000.00, 37000.00, 1, 5),
			          -- Presupuestos Pendientes
			          ('Instalación de aire acondicionado', 'Split 3500 frigorías en dormitorio', 6.0, '2024-10-08', 45000.00, 15000.00, 1000.00, 61000.00, 0, 2),
			          ('Ampliación de cocina', 'Agregar mesada y alacenas', 25.0, '2024-10-09', 35000.00, 62500.00, 4000.00, 101500.00, 0, 4),
			          -- Presupuesto Rechazado
			          ('Remodelación completa', 'Demolición y reconstrucción', 80.0, '2024-09-20', 150000.00, 200000.00, 15000.00, 365000.00, 2, 6);

			          -- ============================================
			          -- MATERIALES (para presupuestos)
			          -- ============================================
			          INSERT INTO Materiales (Descripcion, Precio, Cantidad, IdPresupuesto) VALUES
			          -- Materiales Presupuesto 1 (Instalación eléctrica)
			          ('Cable 2.5mm x 100m', 8500.00, 2, 1),
			          ('Tablero 12 bocas', 15000.00, 1, 1),
			          ('Llaves térmicas', 3500.00, 4, 1),
			          ('Disyuntor diferencial', 12000.00, 1, 1),
			          ('Tomas corriente', 450.00, 15, 1),
			          -- Materiales Presupuesto 2 (Reparación baño)
			          ('Grifería monocomando', 12000.00, 1, 2),
			          ('Caño PVC 50mm', 450.00, 6, 2),
			          ('Codos y conexiones', 2500.00, 1, 2),
			          ('Silicona', 800.00, 3, 2),
			          -- Materiales Presupuesto 3 (Pintura)
			          ('Pintura látex interior 20L', 18000.00, 3, 3),
			          ('Enduido', 3500.00, 2, 3),
			          ('Lija', 500.00, 10, 3),
			          ('Rodillos y pinceles', 2500.00, 1, 3),
			          -- Materiales Presupuesto 4 (Aire acondicionado)
			          ('Split 3500 frigorías', 42000.00, 1, 4),
			          ('Caños de cobre', 3500.00, 6, 4),
			          ('Soportes', 2000.00, 1, 4),
			          -- Materiales Presupuesto 5 (Ampliación cocina)
			          ('Mesada granito 2m', 25000.00, 1, 5),
			          ('Alacenas melamina', 18000.00, 3, 5),
			          ('Grifería cocina', 8000.00, 1, 5),
			          ('Bacha acero inoxidable', 7500.00, 1, 5);

			          -- ============================================
			          -- TRABAJOS
			          -- ============================================
			          INSERT INTO Trabajos (Estado, FechaInicio, FechaFin, Titulo, TotalLabor, IdCliente, IdPresupuesto) VALUES
			          -- Trabajo Terminado (Cliente 1)
			          (2, '2024-09-20', '2024-10-05', 'Instalación eléctrica completa', 50000.00, 1, 1),
			          -- Trabajo Iniciado (Cliente 3)
			          (1, '2024-10-05', NULL, 'Reparación de baño', 20000.00, 3, 2),
			          -- Trabajo Pendiente (Cliente 5)
			          (0, NULL, NULL, 'Pintura interior', 30000.00, 5, 3),
			          -- Trabajos sin presupuesto
			          (2, '2024-09-01', '2024-09-10', 'Reparación urgente de instalación', 12000.00, 2, NULL),
			          (1, '2024-10-01', NULL, 'Mantenimiento preventivo', 8000.00, 4, NULL);

			          -- ============================================
			          -- HORAS Y DESCRIPCIÓN
			          -- ============================================
			          INSERT INTO HorasYDescripcion (Horas, Descripcion, Fecha, IdTrabajo) VALUES
			          -- Trabajo 1 (Terminado)
			          (8.0, 'Relevamiento y desmontaje de instalación antigua', '2024-09-20', 1),
			          (6.5, 'Instalación de nuevo tablero eléctrico', '2024-09-22', 1),
			          (7.0, 'Tendido de cables nuevos en toda la casa', '2024-09-25', 1),
			          (5.5, 'Instalación de tomas y llaves', '2024-09-28', 1),
			          (4.0, 'Pruebas y puesta en marcha', '2024-10-05', 1),
			          -- Trabajo 2 (Iniciado)
			          (6.0, 'Detección y reparación de pérdidas', '2024-10-05', 2),
			          (4.5, 'Instalación de nueva grifería', '2024-10-07', 2),
			          -- Trabajo 4 (sin presupuesto, terminado)
			          (8.0, 'Reparación de corto circuito en cocina', '2024-09-01', 4),
			          (4.0, 'Revisión completa de instalación', '2024-09-10', 4),
			          -- Trabajo 5 (sin presupuesto, iniciado)
			          (5.0, 'Revisión de tablero y conexiones', '2024-10-01', 5);

			          -- ============================================
			          -- FOTOS
			          -- ============================================
			          INSERT INTO Fotos (Enlace, IdTrabajo) VALUES
			          -- Trabajo 1
			          ('https://ejemplo.com/fotos/trabajo1_antes1.jpg', 1),
			          ('https://ejemplo.com/fotos/trabajo1_antes2.jpg', 1),
			          ('https://ejemplo.com/fotos/trabajo1_proceso1.jpg', 1),
			          ('https://ejemplo.com/fotos/trabajo1_proceso2.jpg', 1),
			          ('https://ejemplo.com/fotos/trabajo1_despues1.jpg', 1),
			          ('https://ejemplo.com/fotos/trabajo1_despues2.jpg', 1),
			          -- Trabajo 2
			          ('https://ejemplo.com/fotos/trabajo2_antes1.jpg', 2),
			          ('https://ejemplo.com/fotos/trabajo2_proceso1.jpg', 2),
			          -- Trabajo 4
			          ('https://ejemplo.com/fotos/trabajo4_problema.jpg', 4),
			          ('https://ejemplo.com/fotos/trabajo4_solucion.jpg', 4);

			          -- ============================================
			          -- MOVIMIENTOS BALANCE
			          -- ============================================
			          INSERT INTO MovimientoBalance (Monto, Descripcion, Fecha, Tipo, IdCliente, IdTrabajo) VALUES
			          -- Cliente 1: Trabajo terminado, debe -15000
			          (5000.00, 'Anticipo por trabajo eléctrico', '2024-09-18', 2, 1, 1),
			          (-50000.00, 'Cargo por trabajo de instalación eléctrica', '2024-10-05', 1, 1, 1),
			          (40000.00, 'Pago parcial del trabajo', '2024-10-06', 0, 1, 1),
			          -- Cliente 2: Tiene saldo a favor +5000
			          (12000.00, 'Pago por reparación urgente', '2024-09-11', 0, 2, 4),
			          (-12000.00, 'Cargo por reparación urgente', '2024-09-10', 1, 2, 4),
			          (5000.00, 'Pago adelantado para futuras reparaciones', '2024-10-01', 2, 2, NULL),
			          -- Cliente 3: Trabajo iniciado, debe -8500
			          (5000.00, 'Anticipo para reparación de baño', '2024-10-03', 2, 3, 2),
			          (-13500.00, 'Cargo materiales y mano de obra baño', '2024-10-08', 3, 3, 2),
			          -- Cliente 4: Balance 0
			          -- Cliente 5: Trabajo pendiente pero ya tiene cargo, debe -22000
			          (8000.00, 'Anticipo pintura interior', '2024-10-04', 2, 5, 3),
			          (-30000.00, 'Cargo trabajo de pintura', '2024-10-07', 1, 5, 3),
			          -- Cliente 6: Saldo a favor por anticipo devuelto
			          (5000.00, 'Devolución anticipo por presupuesto rechazado', '2024-09-25', 4, 6, NULL),
			          (-1500.00, 'Ajuste contable', '2024-09-30', 4, 6, NULL);

			          -- Rehabilitar constraints
			          ALTER TABLE MovimientoBalance CHECK CONSTRAINT ALL;
			          ALTER TABLE TelefonoCliente CHECK CONSTRAINT ALL;
			          ALTER TABLE Direccion CHECK CONSTRAINT ALL;
			          ALTER TABLE Fotos CHECK CONSTRAINT ALL;
			          ALTER TABLE HorasYDescripcion CHECK CONSTRAINT ALL;
			          ALTER TABLE Materiales CHECK CONSTRAINT ALL;
			          ALTER TABLE Trabajos CHECK CONSTRAINT ALL;
			          ALTER TABLE Presupuestos CHECK CONSTRAINT ALL;
			          ALTER TABLE Clientes CHECK CONSTRAINT ALL;

			          """;
			await _contexto.Database.ExecuteSqlRawAsync(sql);
		}
	}
}