using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopMGR.Contexto.Migrations
{
    /// <inheritdoc />
    public partial class MovimientoBalance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MovimientoBalance",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Monto = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    IdCliente = table.Column<int>(type: "int", nullable: false),
                    IdTrabajo = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovimientoBalance", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MovimientoBalance_Clientes_IdCliente",
                        column: x => x.IdCliente,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MovimientoBalance_Trabajos_IdTrabajo",
                        column: x => x.IdTrabajo,
                        principalTable: "Trabajos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovimientoBalance_Id",
                table: "MovimientoBalance",
                column: "Id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovimientoBalance_IdCliente",
                table: "MovimientoBalance",
                column: "IdCliente");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientoBalance_IdTrabajo",
                table: "MovimientoBalance",
                column: "IdTrabajo");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MovimientoBalance");
        }
    }
}
