using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SlzrCrossGate.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddUnionPayKeyUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_UnionPayTerminalKeys_UP_MerchantID_UP_TerminalID",
                table: "UnionPayTerminalKeys",
                columns: new[] { "UP_MerchantID", "UP_TerminalID" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UnionPayTerminalKeys_UP_MerchantID_UP_TerminalID",
                table: "UnionPayTerminalKeys");
        }
    }
}
