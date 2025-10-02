using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopMGR.Contexto.Migrations
{
    /// <inheritdoc />
    public partial class FotosConfiguracion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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
                name: "Enlace",
                table: "Fotos",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_Fotos_Id",
                table: "Fotos",
                column: "Id",
                unique: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Fotos_Trabajos_IdTrabajo",
                table: "Fotos");

            migrationBuilder.DropIndex(
                name: "IX_Fotos_Id",
                table: "Fotos");

            migrationBuilder.DropIndex(
                name: "IX_Fotos_IdTrabajo",
                table: "Fotos");

            migrationBuilder.AlterColumn<string>(
                name: "Enlace",
                table: "Fotos",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

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
    }
}
