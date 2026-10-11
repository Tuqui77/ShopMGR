using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopMGR.Contexto.Migrations
{
    /// <inheritdoc />
    public partial class AgregaIndicesBusquedasFrecuentes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Descripcion",
                table: "MovimientoBalance",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.CreateIndex(
                name: "IX_Trabajos_Estado",
                table: "Trabajos",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Presupuestos_Estado",
                table: "Presupuestos",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_NombreCompleto",
                table: "Clientes",
                column: "NombreCompleto");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Trabajos_Estado",
                table: "Trabajos");

            migrationBuilder.DropIndex(
                name: "IX_Presupuestos_Estado",
                table: "Presupuestos");

            migrationBuilder.DropIndex(
                name: "IX_Clientes_NombreCompleto",
                table: "Clientes");

            migrationBuilder.AlterColumn<string>(
                name: "Descripcion",
                table: "MovimientoBalance",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);
        }
    }
}
