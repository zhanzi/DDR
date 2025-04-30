using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SlzrCrossGate.Core.Migrations
{
    /// <inheritdoc />
    public partial class updatefilepublish2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OperationType",
                table: "FilePublishHistories",
                type: "varchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_FilePublishs_MerchantID_FileTypeID_PublishTime",
                table: "FilePublishs",
                columns: new[] { "MerchantID", "FileTypeID", "PublishTime" });

            migrationBuilder.CreateIndex(
                name: "IX_FilePublishHistories_PublishTime",
                table: "FilePublishHistories",
                column: "PublishTime",
                descending: new bool[0]);

            migrationBuilder.AddCheckConstraint(
                name: "CK_FilePublishHistory_OperationType",
                table: "FilePublishHistories",
                sql: "OperationType IN ('Publish', 'Revoke')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_FilePublishs_MerchantID_FileTypeID_PublishTime",
                table: "FilePublishs");

            migrationBuilder.DropIndex(
                name: "IX_FilePublishHistories_PublishTime",
                table: "FilePublishHistories");

            migrationBuilder.DropCheckConstraint(
                name: "CK_FilePublishHistory_OperationType",
                table: "FilePublishHistories");

            migrationBuilder.DropColumn(
                name: "OperationType",
                table: "FilePublishHistories");
        }
    }
}
