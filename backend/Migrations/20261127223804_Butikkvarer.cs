using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mealmate.Api.Migrations
{
    /// <inheritdoc />
    public partial class Butikkvarer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. The butikkvare register
            migrationBuilder.CreateTable(
                name: "Butikkvarer",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Navn = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Avdeling = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Butikkvarer", x => x.Id);
                });

            // 2. One butikkvare per distinct ingredient name (ignoring case and extra spaces),
            //    capitalised ("smør" → "Smør"), all in avdeling Annet to be sorted later
            migrationBuilder.Sql(
                """
                INSERT INTO "Butikkvarer" ("Id", "Navn", "Avdeling")
                SELECT gen_random_uuid(), upper(left(n, 1)) || substr(n, 2), 'Annet'
                FROM (
                    SELECT DISTINCT left(lower(regexp_replace(trim("Navn"), '\s+', ' ', 'g')), 100) AS n
                    FROM "Ingredienser"
                ) navn
                WHERE n <> '';
                """);

            // 3. New ingrediens columns (ButikkvareId nullable until it's filled in)
            migrationBuilder.AddColumn<Guid>(
                name: "ButikkvareId",
                table: "Ingredienser",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Merknad",
                table: "Ingredienser",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Rekkefølge",
                table: "Ingredienser",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.RenameColumn(
                name: "Enhet",
                table: "Ingredienser",
                newName: "GammelEnhet");

            migrationBuilder.AddColumn<string>(
                name: "Enhet",
                table: "Ingredienser",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            // 4. Move the data: link each ingrediens to its butikkvare, give each oppskrift's
            //    ingredienser a position, and translate free-text units to the fixed enheter.
            //    Units we don't recognise become stk, with the original text kept in Merknad.
            migrationBuilder.Sql(
                """
                UPDATE "Ingredienser" i
                SET "ButikkvareId" = b."Id"
                FROM "Butikkvarer" b
                WHERE lower(b."Navn") = left(lower(regexp_replace(trim(i."Navn"), '\s+', ' ', 'g')), 100);

                UPDATE "Ingredienser" i
                SET "Rekkefølge" = r.rn
                FROM (
                    SELECT "Id", row_number() OVER (PARTITION BY "OppskriftId" ORDER BY "Id") - 1 AS rn
                    FROM "Ingredienser"
                ) r
                WHERE i."Id" = r."Id";

                UPDATE "Ingredienser"
                SET "Enhet" = CASE replace(lower(trim("GammelEnhet")), '.', '')
                    WHEN 'g' THEN 'G' WHEN 'gr' THEN 'G' WHEN 'gram' THEN 'G'
                    WHEN 'kg' THEN 'Kg' WHEN 'kilo' THEN 'Kg' WHEN 'kilogram' THEN 'Kg'
                    WHEN 'ml' THEN 'Ml' WHEN 'milliliter' THEN 'Ml'
                    WHEN 'dl' THEN 'Dl' WHEN 'desiliter' THEN 'Dl'
                    WHEN 'l' THEN 'L' WHEN 'liter' THEN 'L'
                    WHEN 'ts' THEN 'Ts' WHEN 'tsk' THEN 'Ts' WHEN 'teskje' THEN 'Ts' WHEN 'teskjeer' THEN 'Ts'
                    WHEN 'ss' THEN 'Ss' WHEN 'spiseskje' THEN 'Ss' WHEN 'spiseskjeer' THEN 'Ss'
                    WHEN 'stk' THEN 'Stk' WHEN 'stykk' THEN 'Stk' WHEN 'stykker' THEN 'Stk'
                    WHEN 'fedd' THEN 'Fedd' WHEN 'båt' THEN 'Fedd' WHEN 'båter' THEN 'Fedd'
                    WHEN 'pk' THEN 'Pakke' WHEN 'pakke' THEN 'Pakke' WHEN 'pakker' THEN 'Pakke' WHEN 'pakning' THEN 'Pakke'
                    WHEN 'boks' THEN 'Boks' WHEN 'bokser' THEN 'Boks'
                    WHEN 'klype' THEN 'Klype' WHEN 'klyper' THEN 'Klype'
                    ELSE NULL
                END;

                UPDATE "Ingredienser"
                SET "Enhet" = 'Stk', "Merknad" = left(trim("GammelEnhet"), 200)
                WHERE "Enhet" IS NULL;
                """);

            // 5. Old columns go, new constraints come
            migrationBuilder.DropColumn(
                name: "GammelEnhet",
                table: "Ingredienser");

            migrationBuilder.DropColumn(
                name: "Navn",
                table: "Ingredienser");

            migrationBuilder.AlterColumn<decimal>(
                name: "Mengde",
                table: "Ingredienser",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<Guid>(
                name: "ButikkvareId",
                table: "Ingredienser",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ingredienser_ButikkvareId",
                table: "Ingredienser",
                column: "ButikkvareId");

            migrationBuilder.AddForeignKey(
                name: "FK_Ingredienser_Butikkvarer_ButikkvareId",
                table: "Ingredienser",
                column: "ButikkvareId",
                principalTable: "Butikkvarer",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // Butikkvare names are unique ignoring case (EF can't express this index itself)
            migrationBuilder.Sql(
                """
                CREATE UNIQUE INDEX "IX_Butikkvarer_Navn_Lower" ON "Butikkvarer" (lower("Navn"));
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Back to free-text name and unit on each ingrediens
            migrationBuilder.AddColumn<string>(
                name: "Navn",
                table: "Ingredienser",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(
                """
                UPDATE "Ingredienser" i SET "Navn" = b."Navn"
                FROM "Butikkvarer" b WHERE b."Id" = i."ButikkvareId";

                UPDATE "Ingredienser" SET "Mengde" = 1 WHERE "Mengde" IS NULL;
                UPDATE "Ingredienser" SET "Enhet" = lower(coalesce("Enhet", 'stk'));
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_Ingredienser_Butikkvarer_ButikkvareId",
                table: "Ingredienser");

            migrationBuilder.DropTable(
                name: "Butikkvarer");

            migrationBuilder.DropIndex(
                name: "IX_Ingredienser_ButikkvareId",
                table: "Ingredienser");

            migrationBuilder.DropColumn(
                name: "ButikkvareId",
                table: "Ingredienser");

            migrationBuilder.DropColumn(
                name: "Merknad",
                table: "Ingredienser");

            migrationBuilder.DropColumn(
                name: "Rekkefølge",
                table: "Ingredienser");

            migrationBuilder.AlterColumn<decimal>(
                name: "Mengde",
                table: "Ingredienser",
                type: "numeric",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Enhet",
                table: "Ingredienser",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10,
                oldNullable: true);
        }
    }
}
