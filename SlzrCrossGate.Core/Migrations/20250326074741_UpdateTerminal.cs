using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SlzrCrossGate.Core.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTerminal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SavePath",
                table: "UploadFiles");

            migrationBuilder.DropColumn(
                name: "Size",
                table: "UploadFiles");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "UploadFiles",
                newName: "FileName");

            migrationBuilder.RenameColumn(
                name: "CreateTime",
                table: "UploadFiles",
                newName: "UploadTime");

            migrationBuilder.RenameColumn(
                name: "MachineNO",
                table: "Terminals",
                newName: "DeviceNO");

            migrationBuilder.AddColumn<string>(
                name: "FilePath",
                table: "UploadFiles",
                type: "varchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<long>(
                name: "FileSize",
                table: "UploadFiles",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<bool>(
                name: "IsDelete",
                table: "Merchants",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FilePath",
                table: "UploadFiles");

            migrationBuilder.DropColumn(
                name: "FileSize",
                table: "UploadFiles");

            migrationBuilder.DropColumn(
                name: "IsDelete",
                table: "Merchants");

            migrationBuilder.RenameColumn(
                name: "UploadTime",
                table: "UploadFiles",
                newName: "CreateTime");

            migrationBuilder.RenameColumn(
                name: "FileName",
                table: "UploadFiles",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "DeviceNO",
                table: "Terminals",
                newName: "MachineNO");

            migrationBuilder.AddColumn<string>(
                name: "SavePath",
                table: "UploadFiles",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "Size",
                table: "UploadFiles",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
