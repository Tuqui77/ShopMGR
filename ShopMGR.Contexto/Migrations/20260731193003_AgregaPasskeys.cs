using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopMGR.Contexto.Migrations
{
    /// <inheritdoc />
    public partial class AgregaPasskeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Challenges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Tipo = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    ChallengeBase64 = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    OpcionesJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IdUsuario = table.Column<int>(type: "int", nullable: true),
                    FechaExpiracion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Challenges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Challenges_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Passkeys",
                columns: table => new
                {
                    IdCredencial = table.Column<byte[]>(type: "varbinary(1024)", maxLength: 1024, nullable: false),
                    ClavePublica = table.Column<byte[]>(type: "varbinary(512)", maxLength: 512, nullable: false),
                    ContadorLogin = table.Column<long>(type: "bigint", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "date", nullable: false),
                    UltimoUso = table.Column<DateTime>(type: "date", nullable: true),
                    Attestation = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    IdUsuario = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Passkeys", x => x.IdCredencial);
                    table.ForeignKey(
                        name: "FK_Passkeys_Usuarios_IdUsuario",
                        column: x => x.IdUsuario,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Challenges_UsuarioId",
                table: "Challenges",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "PasskeyChallenges_ChallengeNoExpirado",
                table: "Challenges",
                columns: new[] { "ChallengeBase64", "FechaExpiracion" });

            migrationBuilder.CreateIndex(
                name: "PasskeyChallenges_FechaExpiracion",
                table: "Challenges",
                column: "FechaExpiracion");

            migrationBuilder.CreateIndex(
                name: "IX_Passkeys_IdUsuario",
                table: "Passkeys",
                column: "IdUsuario");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Challenges");

            migrationBuilder.DropTable(
                name: "Passkeys");
        }
    }
}
