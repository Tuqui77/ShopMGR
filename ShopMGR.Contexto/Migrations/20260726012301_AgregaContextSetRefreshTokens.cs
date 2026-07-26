using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopMGR.Contexto.Migrations
{
    /// <inheritdoc />
    public partial class AgregaContextSetRefreshTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RefreshToken_Usuarios_IdUsuario",
                table: "RefreshToken");

            migrationBuilder.DropPrimaryKey(
                name: "PK_RefreshToken",
                table: "RefreshToken");

            migrationBuilder.RenameTable(
                name: "RefreshToken",
                newName: "RefreshTokens");

            migrationBuilder.RenameIndex(
                name: "IX_RefreshToken_IdUsuario",
                table: "RefreshTokens",
                newName: "IX_RefreshTokens_IdUsuario");

            migrationBuilder.RenameIndex(
                name: "IX_RefreshToken_Id",
                table: "RefreshTokens",
                newName: "IX_RefreshTokens_Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_RefreshTokens",
                table: "RefreshTokens",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_RefreshTokens_Usuarios_IdUsuario",
                table: "RefreshTokens",
                column: "IdUsuario",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RefreshTokens_Usuarios_IdUsuario",
                table: "RefreshTokens");

            migrationBuilder.DropPrimaryKey(
                name: "PK_RefreshTokens",
                table: "RefreshTokens");

            migrationBuilder.RenameTable(
                name: "RefreshTokens",
                newName: "RefreshToken");

            migrationBuilder.RenameIndex(
                name: "IX_RefreshTokens_IdUsuario",
                table: "RefreshToken",
                newName: "IX_RefreshToken_IdUsuario");

            migrationBuilder.RenameIndex(
                name: "IX_RefreshTokens_Id",
                table: "RefreshToken",
                newName: "IX_RefreshToken_Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_RefreshToken",
                table: "RefreshToken",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_RefreshToken_Usuarios_IdUsuario",
                table: "RefreshToken",
                column: "IdUsuario",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
