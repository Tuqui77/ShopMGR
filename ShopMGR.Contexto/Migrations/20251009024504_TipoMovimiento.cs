using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopMGR.Contexto.Migrations
{
    /// <inheritdoc />
    public partial class TipoMovimiento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Tipo",
                table: "MovimientoBalance",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "MovimientoBalance");
        }
    }
}
