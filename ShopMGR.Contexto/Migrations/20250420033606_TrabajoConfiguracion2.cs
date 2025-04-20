using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopMGR.Contexto.Migrations
{
    /// <inheritdoc />
    public partial class TrabajoConfiguracion2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Fotos_Trabajos_IdTrabajo",
                table: "Fotos");

            migrationBuilder.DropIndex(
                name: "IX_Fotos_IdTrabajo",
                table: "Fotos");

            migrationBuilder.AlterColumn<string>(
                name: "Estado",
                table: "Trabajos",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<int>(
                name: "TrabajoId",
                table: "Fotos",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Fotos_TrabajoId",
                table: "Fotos",
                column: "TrabajoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Fotos_Trabajos_TrabajoId",
                table: "Fotos",
                column: "TrabajoId",
                principalTable: "Trabajos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Fotos_Trabajos_TrabajoId",
                table: "Fotos");

            migrationBuilder.DropIndex(
                name: "IX_Fotos_TrabajoId",
                table: "Fotos");

            migrationBuilder.DropColumn(
                name: "TrabajoId",
                table: "Fotos");

            migrationBuilder.AlterColumn<string>(
                name: "Estado",
                table: "Trabajos",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(10)",
                oldMaxLength: 10);

            migrationBuilder.CreateIndex(
                name: "IX_Fotos_IdTrabajo",
                table: "Fotos",
                column: "IdTrabajo");

            migrationBuilder.AddForeignKey(
                name: "FK_Fotos_Trabajos_IdTrabajo",
                table: "Fotos",
                column: "IdTrabajo",
                principalTable: "Trabajos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
