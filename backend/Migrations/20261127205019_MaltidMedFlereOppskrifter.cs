using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mealmate.Api.Migrations
{
    /// <inheritdoc />
    public partial class MaltidMedFlereOppskrifter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. New columns. Existing måltider get the default of 2 porsjoner.
            migrationBuilder.AddColumn<string>(
                name: "Notat",
                table: "Måltider",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Porsjoner",
                table: "Måltider",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            // 2. Join table for måltid ↔ oppskrift (many-to-many)
            migrationBuilder.CreateTable(
                name: "MåltidOppskrift",
                columns: table => new
                {
                    MåltidId = table.Column<Guid>(type: "uuid", nullable: false),
                    OppskriftId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MåltidOppskrift", x => new { x.MåltidId, x.OppskriftId });
                    table.ForeignKey(
                        name: "FK_MåltidOppskrift_Måltider_MåltidId",
                        column: x => x.MåltidId,
                        principalTable: "Måltider",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MåltidOppskrift_Oppskrifter_OppskriftId",
                        column: x => x.OppskriftId,
                        principalTable: "Oppskrifter",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // 3. Keep existing data: copy each måltid's single oppskrift into the join table
            migrationBuilder.Sql(
                """
                INSERT INTO "MåltidOppskrift" ("MåltidId", "OppskriftId")
                SELECT "Id", "OppskriftId" FROM "Måltider";
                """);

            // 4. Now the old one-oppskrift column can go
            migrationBuilder.DropForeignKey(
                name: "FK_Måltider_Oppskrifter_OppskriftId",
                table: "Måltider");

            migrationBuilder.DropIndex(
                name: "IX_Måltider_OppskriftId",
                table: "Måltider");

            migrationBuilder.DropIndex(
                name: "IX_Måltider_UkesmenyId",
                table: "Måltider");

            migrationBuilder.DropColumn(
                name: "OppskriftId",
                table: "Måltider");

            // 5. One måltid per dag + måltidstype
            migrationBuilder.CreateIndex(
                name: "IX_Måltider_UkesmenyId_Dag_Måltidstype",
                table: "Måltider",
                columns: new[] { "UkesmenyId", "Dag", "Måltidstype" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MåltidOppskrift_OppskriftId",
                table: "MåltidOppskrift",
                column: "OppskriftId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Back to one oppskrift per måltid: keep one of them, drop måltider without any
            migrationBuilder.AddColumn<Guid>(
                name: "OppskriftId",
                table: "Måltider",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "Måltider" m
                SET "OppskriftId" = (
                    SELECT mo."OppskriftId" FROM "MåltidOppskrift" mo
                    WHERE mo."MåltidId" = m."Id" LIMIT 1);
                DELETE FROM "Måltider" WHERE "OppskriftId" IS NULL;
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "OppskriftId",
                table: "Måltider",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.DropTable(
                name: "MåltidOppskrift");

            migrationBuilder.DropIndex(
                name: "IX_Måltider_UkesmenyId_Dag_Måltidstype",
                table: "Måltider");

            migrationBuilder.DropColumn(
                name: "Notat",
                table: "Måltider");

            migrationBuilder.DropColumn(
                name: "Porsjoner",
                table: "Måltider");

            migrationBuilder.CreateIndex(
                name: "IX_Måltider_OppskriftId",
                table: "Måltider",
                column: "OppskriftId");

            migrationBuilder.CreateIndex(
                name: "IX_Måltider_UkesmenyId",
                table: "Måltider",
                column: "UkesmenyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Måltider_Oppskrifter_OppskriftId",
                table: "Måltider",
                column: "OppskriftId",
                principalTable: "Oppskrifter",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
