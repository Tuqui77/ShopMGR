using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopMGR.Contexto.Migrations
{
    /// <inheritdoc />
    public partial class CambiaFotoRutaCompletaporFotoRutaRelativa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Balance",
                table: "Clientes");

            migrationBuilder.RenameColumn(
                name: "RutaCompleta",
                table: "Fotos",
                newName: "RutaRelativa");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "RutaRelativa",
                table: "Fotos",
                newName: "RutaCompleta");

            migrationBuilder.AddColumn<decimal>(
                name: "Balance",
                table: "Clientes",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
