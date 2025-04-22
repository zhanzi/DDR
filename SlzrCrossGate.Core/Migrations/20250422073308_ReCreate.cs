using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SlzrCrossGate.Core.Migrations
{
    /// <inheritdoc />
    public partial class ReCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_MsgTypes",
                table: "MsgTypes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_FileTypes",
                table: "FileTypes");

            migrationBuilder.DropColumn(
                name: "ActiveStatus",
                table: "Terminals");

            migrationBuilder.DropColumn(
                name: "ConnectionProtocol",
                table: "Terminals");

            migrationBuilder.DropColumn(
                name: "EndPoint",
                table: "Terminals");

            migrationBuilder.DropColumn(
                name: "FileVerInfo",
                table: "Terminals");

            migrationBuilder.DropColumn(
                name: "LastActiveTime",
                table: "Terminals");

            migrationBuilder.DropColumn(
                name: "LoginInTime",
                table: "Terminals");

            migrationBuilder.DropColumn(
                name: "PropertyInfo",
                table: "Terminals");

            migrationBuilder.DropColumn(
                name: "Token",
                table: "Terminals");

            migrationBuilder.RenameColumn(
                name: "LoginOffTime",
                table: "Terminals",
                newName: "StatusUpdateTime");

            migrationBuilder.AlterColumn<int>(
                name: "FileSize",
                table: "UploadFiles",
                type: "int",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint");

            migrationBuilder.AddColumn<string>(
                name: "TerminalType",
                table: "Terminals",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "EventType",
                table: "TerminalEvents",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Severity",
                table: "TerminalEvents",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "MerchantID",
                table: "MsgTypes",
                type: "varchar(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ExampleMessage",
                table: "MsgTypes",
                type: "varchar(1000)",
                maxLength: 1000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "MerchantID",
                table: "MsgContents",
                type: "varchar(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "MerchantID",
                table: "MsgBoxes",
                type: "varchar(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Crc",
                table: "FileVers",
                type: "varchar(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "FileSize",
                table: "FileVers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "MerchantID",
                table: "FileTypes",
                type: "varchar(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Crc",
                table: "FilePublishs",
                type: "varchar(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "FileSize",
                table: "FilePublishs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FileVerID",
                table: "FilePublishs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<byte[]>(
                name: "Buffer",
                table: "ConsumeDatas",
                type: "varbinary(2500)",
                maxLength: 2500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(2500)",
                oldMaxLength: 2500)
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MsgTypes",
                table: "MsgTypes",
                columns: new[] { "ID", "MerchantID" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_FileTypes",
                table: "FileTypes",
                columns: new[] { "ID", "MerchantID" });

            migrationBuilder.CreateTable(
                name: "IncrementContents",
                columns: table => new
                {
                    MerchantID = table.Column<string>(type: "varchar(8)", maxLength: 8, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IncrementType = table.Column<string>(type: "varchar(4)", maxLength: 4, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SerialNum = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreateTime = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncrementContents", x => new { x.MerchantID, x.IncrementType, x.SerialNum });
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "TerminalStatuses",
                columns: table => new
                {
                    ID = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LastActiveTime = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ActiveStatus = table.Column<int>(type: "int", nullable: false),
                    LoginInTime = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    LoginOffTime = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Token = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConnectionProtocol = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EndPoint = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FileVersions = table.Column<string>(type: "json", maxLength: 2000, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Properties = table.Column<string>(type: "json", maxLength: 2000, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TerminalStatuses", x => x.ID);
                    table.ForeignKey(
                        name: "FK_TerminalStatuses_Terminals_ID",
                        column: x => x.ID,
                        principalTable: "Terminals",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "UnionPayTerminalKeys",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MerchantID = table.Column<string>(type: "varchar(8)", maxLength: 8, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UP_MerchantID = table.Column<string>(type: "varchar(15)", maxLength: 15, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UP_TerminalID = table.Column<string>(type: "varchar(8)", maxLength: 8, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UP_Key = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UP_MerchantName = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsInUse = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    MachineID = table.Column<string>(type: "varchar(8)", maxLength: 8, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LineID = table.Column<string>(type: "varchar(8)", maxLength: 8, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MachineNO = table.Column<string>(type: "varchar(8)", maxLength: 8, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnionPayTerminalKeys", x => x.ID);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_TerminalEvents_MerchantID_TerminalID_EventTime",
                table: "TerminalEvents",
                columns: new[] { "MerchantID", "TerminalID", "EventTime" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "IX_TerminalEvents_MerchantID_TerminalID_EventType",
                table: "TerminalEvents",
                columns: new[] { "MerchantID", "TerminalID", "EventType" });

            migrationBuilder.CreateIndex(
                name: "IX_TerminalEvents_MerchantID_TerminalID_EventType_EventTime",
                table: "TerminalEvents",
                columns: new[] { "MerchantID", "TerminalID", "EventType", "EventTime" },
                descending: new[] { false, false, false, true });

            migrationBuilder.CreateIndex(
                name: "IX_MsgBoxes_MerchantID_Status_TerminalID_SendTime",
                table: "MsgBoxes",
                columns: new[] { "MerchantID", "Status", "TerminalID", "SendTime" });

            migrationBuilder.CreateIndex(
                name: "IX_FilePublishs_MerchantID_FileFullType_PublishType_PublishTarg~",
                table: "FilePublishs",
                columns: new[] { "MerchantID", "FileFullType", "PublishType", "PublishTarget" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UnionPayTerminalKeys_MerchantID_IsInUse",
                table: "UnionPayTerminalKeys",
                columns: new[] { "MerchantID", "IsInUse" });

            migrationBuilder.CreateIndex(
                name: "IX_UnionPayTerminalKeys_MerchantID_MachineID",
                table: "UnionPayTerminalKeys",
                columns: new[] { "MerchantID", "MachineID" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IncrementContents");

            migrationBuilder.DropTable(
                name: "TerminalStatuses");

            migrationBuilder.DropTable(
                name: "UnionPayTerminalKeys");

            migrationBuilder.DropIndex(
                name: "IX_TerminalEvents_MerchantID_TerminalID_EventTime",
                table: "TerminalEvents");

            migrationBuilder.DropIndex(
                name: "IX_TerminalEvents_MerchantID_TerminalID_EventType",
                table: "TerminalEvents");

            migrationBuilder.DropIndex(
                name: "IX_TerminalEvents_MerchantID_TerminalID_EventType_EventTime",
                table: "TerminalEvents");

            migrationBuilder.DropPrimaryKey(
                name: "PK_MsgTypes",
                table: "MsgTypes");

            migrationBuilder.DropIndex(
                name: "IX_MsgBoxes_MerchantID_Status_TerminalID_SendTime",
                table: "MsgBoxes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_FileTypes",
                table: "FileTypes");

            migrationBuilder.DropIndex(
                name: "IX_FilePublishs_MerchantID_FileFullType_PublishType_PublishTarg~",
                table: "FilePublishs");

            migrationBuilder.DropColumn(
                name: "TerminalType",
                table: "Terminals");

            migrationBuilder.DropColumn(
                name: "EventType",
                table: "TerminalEvents");

            migrationBuilder.DropColumn(
                name: "Severity",
                table: "TerminalEvents");

            migrationBuilder.DropColumn(
                name: "MerchantID",
                table: "MsgTypes");

            migrationBuilder.DropColumn(
                name: "ExampleMessage",
                table: "MsgTypes");

            migrationBuilder.DropColumn(
                name: "MerchantID",
                table: "MsgContents");

            migrationBuilder.DropColumn(
                name: "MerchantID",
                table: "MsgBoxes");

            migrationBuilder.DropColumn(
                name: "Crc",
                table: "FileVers");

            migrationBuilder.DropColumn(
                name: "FileSize",
                table: "FileVers");

            migrationBuilder.DropColumn(
                name: "MerchantID",
                table: "FileTypes");

            migrationBuilder.DropColumn(
                name: "Crc",
                table: "FilePublishs");

            migrationBuilder.DropColumn(
                name: "FileSize",
                table: "FilePublishs");

            migrationBuilder.DropColumn(
                name: "FileVerID",
                table: "FilePublishs");

            migrationBuilder.RenameColumn(
                name: "StatusUpdateTime",
                table: "Terminals",
                newName: "LoginOffTime");

            migrationBuilder.AlterColumn<long>(
                name: "FileSize",
                table: "UploadFiles",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "ActiveStatus",
                table: "Terminals",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ConnectionProtocol",
                table: "Terminals",
                type: "varchar(20)",
                maxLength: 20,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "EndPoint",
                table: "Terminals",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "FileVerInfo",
                table: "Terminals",
                type: "varchar(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastActiveTime",
                table: "Terminals",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "LoginInTime",
                table: "Terminals",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "PropertyInfo",
                table: "Terminals",
                type: "varchar(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Token",
                table: "Terminals",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Buffer",
                table: "ConsumeDatas",
                type: "varchar(2500)",
                maxLength: 2500,
                nullable: false,
                oldClrType: typeof(byte[]),
                oldType: "varbinary(2500)",
                oldMaxLength: 2500)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MsgTypes",
                table: "MsgTypes",
                column: "ID");

            migrationBuilder.AddPrimaryKey(
                name: "PK_FileTypes",
                table: "FileTypes",
                column: "ID");
        }
    }
}
