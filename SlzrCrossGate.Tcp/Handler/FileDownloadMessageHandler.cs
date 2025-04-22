using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SlzrCrossGate.Common;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Service.BusinessServices;
using SlzrCrossGate.Core.Service.FileStorage;
using SlzrCrossGate.Tcp.Protocol;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType(Iso8583MessageType.FileUpdateRequest)]
    public class FileDownloadMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<FileDownloadMessageHandler> _logger;
        private readonly PublishFileSerice  _publishFileSerice;
        private readonly FileService _fileService;
        private readonly Iso8583Schema _schema;
        private readonly TerminalEventService _terminalEventService;

        public FileDownloadMessageHandler(ILogger<FileDownloadMessageHandler> logger, 
            PublishFileSerice publishFileSerice, 
            FileService fileService,
            TerminalEventService terminalEventService,
            Iso8583Schema schema)
        {
            _logger = logger;
            _publishFileSerice = publishFileSerice;
            _fileService = fileService;
            _terminalEventService = terminalEventService;
            _schema = schema;
        }

        public async Task<Iso8583Message> HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            var response = new Iso8583Message(_schema, Iso8583MessageType.FileUpdateResponse);
            //response.SetField(3, "806003");

            // ����Э��汾ȷ������λ��
            bool isNewVersion = Convert.ToInt32(message.ProtocolVer, 16) >= 0x0200;
            int codeLen = isNewVersion ? 22 : 6;

            string filePathInfo = isNewVersion
                ? message.GetString(50)
                : message.GetString(47);

            string deviceType = message.TerminalType;

            string terminalId = message.TerimalID;

            try
            {
                // �����ļ�������Ϣ
                string fileCode = DataConvert.HexToString(filePathInfo.Substring(0, codeLen)).Replace("\0", "");
                string fileVersion = filePathInfo.Substring(codeLen, 4);
                int fileOffset = Convert.ToInt32(filePathInfo.Substring(codeLen + 4, 8), 16);
                int requestLength = Convert.ToInt32(filePathInfo.Substring(codeLen + 12, 8), 16);

                _logger.LogInformation("file download request:MerchantID={MerchantID},TerminalID={TerminalID}, fileCode={FileCode}, fileVersion={FileVersion}, fileOffset={FileOffset}, requestLength={RequestLength}", message.MerchantID, terminalId, fileCode, fileVersion, fileOffset, requestLength);

                // �����ļ�
                var filePublish = await _publishFileSerice.GetFileInfoAsync(message.MerchantID, fileCode, fileVersion);
                if (filePublish == null)
                {
                    _logger.LogWarning("filePublish is null:MerchantID={MerchantID} fileCode={FileCode}, fileVersion={FileVersion}", message.MerchantID, fileCode, fileVersion);

                    response.Error("0006", "�ļ�������");
                    return response;
                }
                var fileLength = filePublish.FileSize;

                // ����ļ�ƫ���Ƿ񳬳���Χ
                if (fileOffset >= fileLength)
                {
                    _logger.LogWarning("fileOffset >= fileLength:fileOffset={FileOffset}, fileLength={FileLength},MerchantID={MerchantID},TerminalID={TerminalID}, fileCode={FileCode}, fileVersion={FileVersion},fileID={FileID}", fileOffset, fileLength, message.MerchantID, message.TerimalID, fileCode, fileVersion, filePublish.ID);

                    response.Error("0007", "�ļ�ƫ�Ƴ�����Χ");
                    return response;
                }

                if (fileOffset + requestLength > fileLength)
                {
                    requestLength = fileLength - fileOffset;
                }

                // ��ȡ�ļ�Ƭ��
                var fileSegment = await _fileService.GetFileSegmentAsync(filePublish.FilePath, fileOffset, requestLength);

                if (fileSegment == null)
                {
                    _logger.LogWarning("fileSegment is null:filePath={FilePath}, fileOffset={FileOffset}, requestLength={RequestLength},fileID={FileID}", filePublish.FilePath, fileOffset, requestLength, filePublish.ID);

                    response.Error("0008", "�ļ�Ƭ�β�����");
                    return response;
                }
                response.SetField(48, fileSegment);

                // �����ļ�·����Ϣ
                if (isNewVersion)
                {
                    response.SetField(50, filePathInfo);
                }
                else
                {
                    response.SetField(47, filePathInfo);
                }

                // ���óɹ���Ӧ
                response.Ok();


                // ������ļ���һ��Ƭ��
                if (fileOffset == 0)
                {
                    await _terminalEventService.RecordTerminalEventAsync(
                        message.MerchantID,
                        terminalId,
                        TerminalEventType.FileDownloadStart,
                        EventSeverity.Info,
                        $"FileCode={fileCode},FileVersion={fileVersion},FilePath={filePublish.FilePath},FileID={filePublish.ID}" // �¼�����
                        );
                }

                // ������ļ����һ��Ƭ��
                if (fileOffset + requestLength >= fileLength)
                {
                    await _terminalEventService.RecordTerminalEventAsync(
                        message.MerchantID,
                        terminalId,
                        TerminalEventType.FileDownloadEnd,
                        EventSeverity.Info,
                        $"FileCode={fileCode},FileVersion={fileVersion},FilePath={filePublish.FilePath},FileID={filePublish.ID}" // �¼�����
                        );
                }

                return response;

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "handle file download error:MerchantID={MerchantID},TerminalID={TerminalID}, filePathInfo={filePathInfo}", message.MerchantID, terminalId, filePathInfo);

                response.SetField(39, "0009");
                response.SetField(38, "�ڲ��������");
                return response;
            }
        }
    }
}


