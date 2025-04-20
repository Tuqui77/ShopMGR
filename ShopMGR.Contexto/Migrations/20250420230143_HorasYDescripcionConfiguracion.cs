using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopMGR.Contexto.Migrations
{
    /// <inheritdoc />
    public partial class HorasYDescripcionConfiguracion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HorasYDescripcion_Trabajos_TrabajoId",
                table: "HorasYDescripcion");

            migrationBuilder.DropIndex(
                name: "IX_HorasYDescripcion_TrabajoId",
                table: "HorasYDescripcion");

            migrationBuilder.DropColumn(
                name: "TrabajoId",
                table: "HorasYDescripcion");

            migrationBuilder.AlterColumn<DateTime>(
                name: "Fecha",
                table: "HorasYDescripcion",
                type: "datetime",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<string>(
                name: "Descripcion",
                table: "HorasYDescripcion",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_HorasYDescripcion_Id",
                table: "HorasYDescripcion",
                column: "Id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HorasYDescripcion_IdTrabajo",
                table: "HorasYDescripcion",
                column: "IdTrabajo");

            migrationBuilder.AddForeignKey(
                name: "FK_HorasYDescripcion_Trabajos_IdTrabajo",
                table: "HorasYDescripcion",
                column: "IdTrabajo",
                principalTable: "Trabajos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HorasYDescripcion_Trabajos_IdTrabajo",
                table: "HorasYDescripcion");

            migrationBuilder.DropIndex(
                name: "IX_HorasYDescripcion_Id",
                table: "HorasYDescripcion");

            migrationBuilder.DropIndex(
                name: "IX_HorasYDescripcion_IdTrabajo",
                table: "HorasYDescripcion");

            migrationBuilder.AlterColumn<DateTime>(
                name: "Fecha",
                table: "HorasYDescripcion",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime");

            migrationBuilder.AlterColumn<string>(
                name: "Descripcion",
                table: "HorasYDescripcion",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<int>(
                name: "TrabajoId",
                table: "HorasYDescripcion",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_HorasYDescripcion_TrabajoId",
                table: "HorasYDescripcion",
                column: "TrabajoId");

            migrationBuilder.AddForeignKey(
                name: "FK_HorasYDescripcion_Trabajos_TrabajoId",
                table: "HorasYDescripcion",
                column: "TrabajoId",
                principalTable: "Trabajos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
