using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SlzrCrossGate.Common;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Service.FileStorage;
using SlzrCrossGate.Tcp.Protocol;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0840")]
    public class FileDownloadMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<FileDownloadMessageHandler> _logger;
        private readonly FileService _fileService;
        private readonly Iso8583Schema _schema;

        public FileDownloadMessageHandler(ILogger<FileDownloadMessageHandler> logger, FileService fileService, Iso8583Schema schema)
        {
            _logger = logger;
            _fileService = fileService;
            _schema = schema;
        }

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            // 处理文件下载指令
            _logger.LogInformation("处理文件下载指令");

            var response = new Iso8583Message(_schema);
            response.MessageType = "0850"; // 文件下载响应
            response.SetField(3, "806003");
            response.SetDateTime(12, DateTime.Now);
            response.SetDateTime(13, DateTime.Now);


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

                _logger.LogInformation("文件下载请求: 终端ID={terminalId}, 文件={fileCode}, 版本={fileVersion}, 偏移={fileOffset}, 长度={requestLength}", terminalId, fileCode, fileVersion, fileOffset, requestLength);

                // 查找文件
                var filePublish = await FindFilePublishAsync(merchantId, fileCode, fileVersion);
                if (filePublish == null)
                {
                    _logger.LogWarning($"文件不存在: 商户={merchantId}, 文件={fileCode}, 版本={fileVersion}");
                    return await SendErrorResponseAsync(context, response, message, "0006", "文件不存在");
                }

                // 获取文件内容
                byte[] fileData = await _fileService.GetFileContentAsync(filePublish.FilePath);

                if (fileData == null)
                {
                    _logger.LogWarning($"文件内容为空: {filePublish.FilePath}");
                    return await SendErrorResponseAsync(context, response, message, "0006", "文件不存在");
                }

                // 检查请求的偏移和长度是否有效
                if (fileOffset + requestLength > fileData.Length)
                {
                    _logger.LogWarning($"请求的文件长度过长: 偏移={fileOffset}, 请求长度={requestLength}, 文件长度={fileData.Length}");
                    return await SendErrorResponseAsync(context, response, message, "0007", "请求的文件长度过长");
                }

                // 设置成功响应
                response.SetField(39, "0000");
                response.SetField(41, machineId);
                response.SetField(42, merchantId);

                if (message.Exist(43))
                    response.SetField(43, message.GetString(43));

                if (message.Exist(44))
                    response.SetField(44, message.GetString(44));

                // 设置文件路径信息
                if (isNewVersion)
                {
                    response.SetField(50, filePathInfo);
                }
                else
                {
                    response.SetField(47, filePathInfo);
                }

                // 提取并设置文件片段
                byte[] fileFragment = new byte[requestLength];
                Array.Copy(fileData, fileOffset, fileFragment, 0, requestLength);
                response.SetField(48, DataConvert.BytesToHex(fileFragment));

                // 如果是文件第一个片段
                if (fileOffset == 0)
                {
                    _logger.LogInformation($"开始传输文件: {fileCode}, 版本: {fileVersion}, 总大小: {fileData.Length}字节");
                }

                // 如果是文件最后一个片段
                if (fileOffset + requestLength >= fileData.Length)
                {
                    _logger.LogInformation($"文件传输完成: {fileCode}, 版本: {fileVersion}");

                    // 记录文件发布状态
                    if (_publishFileOnlyNotifyOnce)
                    {
                        var clientFiles = _clientPublishFile.GetOrAdd(terminalId, _ => new SortedSet<string>());
                        string fileKey = $"{fileCode}{fileVersion}";

                        lock (clientFiles)
                        {
                            if (!clientFiles.Contains(fileKey))
                            {
                                clientFiles.Add(fileKey);
                                _logger.LogInformation($"文件发布记录已添加: 终端={terminalId}, 文件={fileCode}, 版本={fileVersion}");

                                // 可以在此处添加发布历史记录到数据库
                                _ = RecordFileDownloadHistoryAsync(terminalId, merchantId, filePublish);
                            }
                        }
                    }
                }

                response.SetField(64, "00000000"); // MAC值，这里设置为零

                var responseBytes = response.Pack();
                await context.Transport.Output.WriteAsync(responseBytes);
                await context.Transport.Output.FlushAsync();

                _logger.LogInformation($"已发送文件片段: 偏移={fileOffset}, 长度={requestLength}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "处理文件下载请求时发生错误");
                await SendErrorResponseAsync(context, response, message, "0009", "内部处理错误");
            }
        }

        private async Task<FilePublish> FindFilePublishAsync(string merchantId, string fileCode, string fileVersion)
        {
            return await Task.FromResult(_dbContext.FilePublishs.FirstOrDefault(f =>
                f.MerchantID == merchantId &&
                f.FileCode == fileCode &&
                f.Version == fileVersion &&
                f.Status == PublishStatus.Published));
        }

        private async Task RecordFileDownloadHistoryAsync(string terminalId, string merchantId, FilePublish filePublish)
        {
            try
            {
                var history = new FilePublishHistory
                {
                    FilePublishId = filePublish.ID,
                    TerminalID = terminalId,
                    MerchantID = merchantId,
                    DownloadTime = DateTime.Now,
                    Status = DownloadStatus.Success
                };

                await _dbContext.FilePublishHistories.AddAsync(history);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "记录文件下载历史时出错");
            }
        }

        private async Task SendErrorResponseAsync(TcpConnectionContext context, Iso8583Message response, Iso8583Message request, string errorCode, string errorMessage)
        {
            response.SetField(39, errorCode);
            response.SetField(38, errorMessage);

            if (request.Exist(41))
                response.SetField(41, request.GetString(41));

            if (request.Exist(42))
                response.SetField(42, request.GetString(42));

            if (request.Exist(43))
                response.SetField(43, request.GetString(43));

            if (request.Exist(44))
                response.SetField(44, request.GetString(44));

            response.SetField(64, "00000000"); // MAC值，这里设置为零

            var responseBytes = response.Pack();
            await context.Transport.Output.WriteAsync(responseBytes);
            await context.Transport.Output.FlushAsync();

            _logger.LogWarning($"发送错误响应: {errorCode} - {errorMessage}");
            return;
        }
    }
}


