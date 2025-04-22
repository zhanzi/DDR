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

            // 根据协议版本确定参数位置
            bool isNewVersion = Convert.ToInt32(message.ProtocolVer, 16) >= 0x0200;
            int codeLen = isNewVersion ? 22 : 6;

            string filePathInfo = isNewVersion
                ? message.GetString(50)
                : message.GetString(47);

            string deviceType = message.TerminalType;

            string terminalId = message.TerimalID;

            try
            {
                // 解析文件请求信息
                string fileCode = DataConvert.HexToString(filePathInfo.Substring(0, codeLen)).Replace("\0", "");
                string fileVersion = filePathInfo.Substring(codeLen, 4);
                int fileOffset = Convert.ToInt32(filePathInfo.Substring(codeLen + 4, 8), 16);
                int requestLength = Convert.ToInt32(filePathInfo.Substring(codeLen + 12, 8), 16);

                _logger.LogInformation("file download request:MerchantID={MerchantID},TerminalID={TerminalID}, fileCode={FileCode}, fileVersion={FileVersion}, fileOffset={FileOffset}, requestLength={RequestLength}", message.MerchantID, terminalId, fileCode, fileVersion, fileOffset, requestLength);

                // 查找文件
                var filePublish = await _publishFileSerice.GetFileInfoAsync(message.MerchantID, fileCode, fileVersion);
                if (filePublish == null)
                {
                    _logger.LogWarning("filePublish is null:MerchantID={MerchantID} fileCode={FileCode}, fileVersion={FileVersion}", message.MerchantID, fileCode, fileVersion);

                    response.Error("0006", "文件不存在");
                    return response;
                }
                var fileLength = filePublish.FileSize;

                // 检查文件偏移是否超出范围
                if (fileOffset >= fileLength)
                {
                    _logger.LogWarning("fileOffset >= fileLength:fileOffset={FileOffset}, fileLength={FileLength},MerchantID={MerchantID},TerminalID={TerminalID}, fileCode={FileCode}, fileVersion={FileVersion},fileID={FileID}", fileOffset, fileLength, message.MerchantID, message.TerimalID, fileCode, fileVersion, filePublish.ID);

                    response.Error("0007", "文件偏移超出范围");
                    return response;
                }

                if (fileOffset + requestLength > fileLength)
                {
                    requestLength = fileLength - fileOffset;
                }

                // 获取文件片段
                var fileSegment = await _fileService.GetFileSegmentAsync(filePublish.FilePath, fileOffset, requestLength);

                if (fileSegment == null)
                {
                    _logger.LogWarning("fileSegment is null:filePath={FilePath}, fileOffset={FileOffset}, requestLength={RequestLength},fileID={FileID}", filePublish.FilePath, fileOffset, requestLength, filePublish.ID);

                    response.Error("0008", "文件片段不存在");
                    return response;
                }
                response.SetField(48, fileSegment);

                // 设置文件路径信息
                if (isNewVersion)
                {
                    response.SetField(50, filePathInfo);
                }
                else
                {
                    response.SetField(47, filePathInfo);
                }

                // 设置成功响应
                response.Ok();


                // 如果是文件第一个片段
                if (fileOffset == 0)
                {
                    await _terminalEventService.RecordTerminalEventAsync(
                        message.MerchantID,
                        terminalId,
                        TerminalEventType.FileDownloadStart,
                        EventSeverity.Info,
                        $"FileCode={fileCode},FileVersion={fileVersion},FilePath={filePublish.FilePath},FileID={filePublish.ID}" // 事件内容
                        );
                }

                // 如果是文件最后一个片段
                if (fileOffset + requestLength >= fileLength)
                {
                    await _terminalEventService.RecordTerminalEventAsync(
                        message.MerchantID,
                        terminalId,
                        TerminalEventType.FileDownloadEnd,
                        EventSeverity.Info,
                        $"FileCode={fileCode},FileVersion={fileVersion},FilePath={filePublish.FilePath},FileID={filePublish.ID}" // 事件内容
                        );
                }

                return response;

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "handle file download error:MerchantID={MerchantID},TerminalID={TerminalID}, filePathInfo={filePathInfo}", message.MerchantID, terminalId, filePathInfo);

                response.SetField(39, "0009");
                response.SetField(38, "内部处理错误");
                return response;
            }
        }
    }
}


