using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SlzrCrossGate.Core.Migrations
{
    /// <inheritdoc />
    public partial class updatefilepublish : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreateTime",
                table: "FilePublishs");

            migrationBuilder.RenameColumn(
                name: "UpdateTime",
                table: "FilePublishs",
                newName: "PublishTime");

            migrationBuilder.AlterColumn<string>(
                name: "Ver",
                table: "FilePublishs",
                type: "char(4)",
                maxLength: 4,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(4)",
                oldMaxLength: 4)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "UploadFileID",
                table: "FilePublishs",
                type: "varchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "MerchantID",
                table: "FilePublishHistories",
                type: "varchar(8)",
                maxLength: 8,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "char(4)")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Crc",
                table: "FilePublishHistories",
                type: "varchar(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "FileSize",
                table: "FilePublishHistories",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FileVerID",
                table: "FilePublishHistories",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "UploadFileID",
                table: "FilePublishHistories",
                type: "varchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UploadFileID",
                table: "FilePublishs");

            migrationBuilder.DropColumn(
                name: "Crc",
                table: "FilePublishHistories");

            migrationBuilder.DropColumn(
                name: "FileSize",
                table: "FilePublishHistories");

            migrationBuilder.DropColumn(
                name: "FileVerID",
                table: "FilePublishHistories");

            migrationBuilder.DropColumn(
                name: "UploadFileID",
                table: "FilePublishHistories");

            migrationBuilder.RenameColumn(
                name: "PublishTime",
                table: "FilePublishs",
                newName: "UpdateTime");

            migrationBuilder.AlterColumn<string>(
                name: "Ver",
                table: "FilePublishs",
                type: "varchar(4)",
                maxLength: 4,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "char(4)",
                oldMaxLength: 4)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreateTime",
                table: "FilePublishs",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<string>(
                name: "MerchantID",
                table: "FilePublishHistories",
                type: "char(4)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(8)",
                oldMaxLength: 8)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
