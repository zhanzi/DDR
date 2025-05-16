using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SlzrCrossGate.Core.Migrations
{
    /// <inheritdoc />
    public partial class DbcontextFormat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TerminalEvents_MerchantID_TerminalID_EventType",
                table: "TerminalEvents");

            migrationBuilder.DropPrimaryKey(
                name: "PK_FileVers",
                table: "FileVers");

            migrationBuilder.AddPrimaryKey(
                name: "PK_FileVers",
                table: "FileVers",
                column: "ID");

            migrationBuilder.CreateIndex(
                name: "IX_TerminalEvents_EventTime",
                table: "TerminalEvents",
                column: "EventTime",
                descending: new bool[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TerminalEvents_EventTime",
                table: "TerminalEvents");

            migrationBuilder.DropPrimaryKey(
                name: "PK_FileVers",
                table: "FileVers");

            migrationBuilder.AddPrimaryKey(
                name: "PK_FileVers",
                table: "FileVers",
                columns: new[] { "ID", "MerchantID" });

            migrationBuilder.CreateIndex(
                name: "IX_TerminalEvents_MerchantID_TerminalID_EventType",
                table: "TerminalEvents",
                columns: new[] { "MerchantID", "TerminalID", "EventType" });
        }
    }
}
