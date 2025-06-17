using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SlzrCrossGate.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddFilePulisFileVerIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TerminalEvents_MerchantID_TerminalID_EventTime",
                table: "TerminalEvents");

            migrationBuilder.DropIndex(
                name: "IX_TerminalEvents_MerchantID_TerminalID_EventType_EventTime",
                table: "TerminalEvents");

            migrationBuilder.DropIndex(
                name: "IX_FileVers_MerchantID_FileFullType_Ver",
                table: "FileVers");

            migrationBuilder.DropIndex(
                name: "IX_FileVers_MerchantID_FileTypeID_FilePara_Ver",
                table: "FileVers");

            migrationBuilder.DropIndex(
                name: "IX_FilePublishs_MerchantID_FileFullType_Ver",
                table: "FilePublishs");

            migrationBuilder.DropIndex(
                name: "IX_FilePublishs_MerchantID_FileTypeID_FilePara_Ver",
                table: "FilePublishs");

            migrationBuilder.DropIndex(
                name: "IX_FilePublishHistories_MerchantID_FileTypeID_FilePara_Ver",
                table: "FilePublishHistories");

            migrationBuilder.CreateIndex(
                name: "IX_TerminalEvents_TerminalID_EventTime",
                table: "TerminalEvents",
                columns: new[] { "TerminalID", "EventTime" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_MsgContents_MerchantID_CreateTime",
                table: "MsgContents",
                columns: new[] { "MerchantID", "CreateTime" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_MsgBoxes_SendTime",
                table: "MsgBoxes",
                column: "SendTime",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "IX_FileVers_CreateTime",
                table: "FileVers",
                column: "CreateTime",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "IX_FileVers_MerchantID_FileFullType_Ver",
                table: "FileVers",
                columns: new[] { "MerchantID", "FileFullType", "Ver" });

            migrationBuilder.CreateIndex(
                name: "IX_FileVers_MerchantID_FileTypeID_FilePara_Ver",
                table: "FileVers",
                columns: new[] { "MerchantID", "FileTypeID", "FilePara", "Ver" });

            migrationBuilder.CreateIndex(
                name: "IX_FilePublishs_MerchantID_FileFullType_PublishType_PublishTarg~",
                table: "FilePublishs",
                columns: new[] { "MerchantID", "FileFullType", "PublishType", "PublishTarget" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FilePublishs_MerchantID_FileTypeID_FilePara_PublishType_Publ~",
                table: "FilePublishs",
                columns: new[] { "MerchantID", "FileTypeID", "FilePara", "PublishType", "PublishTarget" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FilePublishs_PublishTime",
                table: "FilePublishs",
                column: "PublishTime",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "IX_FilePublishHistories_MerchantID_FileTypeID_FilePara_Ver",
                table: "FilePublishHistories",
                columns: new[] { "MerchantID", "FileTypeID", "FilePara", "Ver" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TerminalEvents_TerminalID_EventTime",
                table: "TerminalEvents");

            migrationBuilder.DropIndex(
                name: "IX_MsgContents_MerchantID_CreateTime",
                table: "MsgContents");

            migrationBuilder.DropIndex(
                name: "IX_MsgBoxes_SendTime",
                table: "MsgBoxes");

            migrationBuilder.DropIndex(
                name: "IX_FileVers_CreateTime",
                table: "FileVers");

            migrationBuilder.DropIndex(
                name: "IX_FileVers_MerchantID_FileFullType_Ver",
                table: "FileVers");

            migrationBuilder.DropIndex(
                name: "IX_FileVers_MerchantID_FileTypeID_FilePara_Ver",
                table: "FileVers");

            migrationBuilder.DropIndex(
                name: "IX_FilePublishs_MerchantID_FileFullType_PublishType_PublishTarg~",
                table: "FilePublishs");

            migrationBuilder.DropIndex(
                name: "IX_FilePublishs_MerchantID_FileTypeID_FilePara_PublishType_Publ~",
                table: "FilePublishs");

            migrationBuilder.DropIndex(
                name: "IX_FilePublishs_PublishTime",
                table: "FilePublishs");

            migrationBuilder.DropIndex(
                name: "IX_FilePublishHistories_MerchantID_FileTypeID_FilePara_Ver",
                table: "FilePublishHistories");

            migrationBuilder.CreateIndex(
                name: "IX_TerminalEvents_MerchantID_TerminalID_EventTime",
                table: "TerminalEvents",
                columns: new[] { "MerchantID", "TerminalID", "EventTime" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "IX_TerminalEvents_MerchantID_TerminalID_EventType_EventTime",
                table: "TerminalEvents",
                columns: new[] { "MerchantID", "TerminalID", "EventType", "EventTime" },
                descending: new[] { false, false, false, true });

            migrationBuilder.CreateIndex(
                name: "IX_FileVers_MerchantID_FileFullType_Ver",
                table: "FileVers",
                columns: new[] { "MerchantID", "FileFullType", "Ver" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FileVers_MerchantID_FileTypeID_FilePara_Ver",
                table: "FileVers",
                columns: new[] { "MerchantID", "FileTypeID", "FilePara", "Ver" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FilePublishs_MerchantID_FileFullType_Ver",
                table: "FilePublishs",
                columns: new[] { "MerchantID", "FileFullType", "Ver" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FilePublishs_MerchantID_FileTypeID_FilePara_Ver",
                table: "FilePublishs",
                columns: new[] { "MerchantID", "FileTypeID", "FilePara", "Ver" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FilePublishHistories_MerchantID_FileTypeID_FilePara_Ver",
                table: "FilePublishHistories",
                columns: new[] { "MerchantID", "FileTypeID", "FilePara", "Ver" },
                unique: true);
        }
    }
}
