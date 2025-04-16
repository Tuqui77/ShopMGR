using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopMGR.Contexto.Migrations
{
    /// <inheritdoc />
    public partial class Inicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Clientes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreCompleto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Cuit = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Balance = table.Column<decimal>(type: "decimal(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clientes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Direccion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Calle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Altura = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Piso = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Departamento = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CodigoPostal = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MapsID = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IdCliente = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Direccion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Direccion_Clientes_IdCliente",
                        column: x => x.IdCliente,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Presupuestos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ValorHoraDeTrabajo = table.Column<int>(type: "int", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HorasEstimadas = table.Column<double>(type: "float", nullable: false),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CostoMateriales = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CostoLabor = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CostoInsumos = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Total = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Estado = table.Column<int>(type: "int", nullable: false),
                    IdCliente = table.Column<int>(type: "int", nullable: false),
                    IdTrabajo = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Presupuestos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Presupuestos_Clientes_IdCliente",
                        column: x => x.IdCliente,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TelefonoCliente",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Telefono = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IdCliente = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TelefonoCliente", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TelefonoCliente_Clientes_IdCliente",
                        column: x => x.IdCliente,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Materiales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Precio = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Cantidad = table.Column<double>(type: "float", nullable: false),
                    IdPresupuesto = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Materiales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Materiales_Presupuestos_IdPresupuesto",
                        column: x => x.IdPresupuesto,
                        principalTable: "Presupuestos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Trabajos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Estado = table.Column<int>(type: "int", nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Titulo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IdCliente = table.Column<int>(type: "int", nullable: false),
                    IdPresupuesto = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trabajos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Trabajos_Clientes_IdCliente",
                        column: x => x.IdCliente,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Trabajos_Presupuestos_IdPresupuesto",
                        column: x => x.IdPresupuesto,
                        principalTable: "Presupuestos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Fotos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Enlace = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IdTrabajo = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fotos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Fotos_Trabajos_IdTrabajo",
                        column: x => x.IdTrabajo,
                        principalTable: "Trabajos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HorasYDescripcion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Horas = table.Column<float>(type: "real", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TrabajoId = table.Column<int>(type: "int", nullable: false),
                    IdTrabajo = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HorasYDescripcion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HorasYDescripcion_Trabajos_TrabajoId",
                        column: x => x.TrabajoId,
                        principalTable: "Trabajos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Direccion_IdCliente",
                table: "Direccion",
                column: "IdCliente");

            migrationBuilder.CreateIndex(
                name: "IX_Fotos_IdTrabajo",
                table: "Fotos",
                column: "IdTrabajo");

            migrationBuilder.CreateIndex(
                name: "IX_HorasYDescripcion_TrabajoId",
                table: "HorasYDescripcion",
                column: "TrabajoId");

            migrationBuilder.CreateIndex(
                name: "IX_Materiales_IdPresupuesto",
                table: "Materiales",
                column: "IdPresupuesto");

            migrationBuilder.CreateIndex(
                name: "IX_Presupuestos_IdCliente",
                table: "Presupuestos",
                column: "IdCliente");

            migrationBuilder.CreateIndex(
                name: "IX_TelefonoCliente_IdCliente",
                table: "TelefonoCliente",
                column: "IdCliente");

            migrationBuilder.CreateIndex(
                name: "IX_Trabajos_IdCliente",
                table: "Trabajos",
                column: "IdCliente");

            migrationBuilder.CreateIndex(
                name: "IX_Trabajos_IdPresupuesto",
                table: "Trabajos",
                column: "IdPresupuesto",
                unique: true,
                filter: "[IdPresupuesto] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Direccion");

            migrationBuilder.DropTable(
                name: "Fotos");

            migrationBuilder.DropTable(
                name: "HorasYDescripcion");

            migrationBuilder.DropTable(
                name: "Materiales");

            migrationBuilder.DropTable(
                name: "TelefonoCliente");

            migrationBuilder.DropTable(
                name: "Trabajos");

            migrationBuilder.DropTable(
                name: "Presupuestos");

            migrationBuilder.DropTable(
                name: "Clientes");
        }
    }
}
