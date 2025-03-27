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
            // �����ļ�����ָ��
            _logger.LogInformation("�����ļ�����ָ��");

            var response = new Iso8583Message(_schema);
            response.MessageType = "0850"; // �ļ�������Ӧ
            response.SetField(3, "806003");
            response.SetDateTime(12, DateTime.Now);
            response.SetDateTime(13, DateTime.Now);


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

                _logger.LogInformation("�ļ���������: �ն�ID={terminalId}, �ļ�={fileCode}, �汾={fileVersion}, ƫ��={fileOffset}, ����={requestLength}", terminalId, fileCode, fileVersion, fileOffset, requestLength);

                // �����ļ�
                var filePublish = await FindFilePublishAsync(merchantId, fileCode, fileVersion);
                if (filePublish == null)
                {
                    _logger.LogWarning($"�ļ�������: �̻�={merchantId}, �ļ�={fileCode}, �汾={fileVersion}");
                    return await SendErrorResponseAsync(context, response, message, "0006", "�ļ�������");
                }

                // ��ȡ�ļ�����
                byte[] fileData = await _fileService.GetFileContentAsync(filePublish.FilePath);

                if (fileData == null)
                {
                    _logger.LogWarning($"�ļ�����Ϊ��: {filePublish.FilePath}");
                    return await SendErrorResponseAsync(context, response, message, "0006", "�ļ�������");
                }

                // ��������ƫ�ƺͳ����Ƿ���Ч
                if (fileOffset + requestLength > fileData.Length)
                {
                    _logger.LogWarning($"������ļ����ȹ���: ƫ��={fileOffset}, ���󳤶�={requestLength}, �ļ�����={fileData.Length}");
                    return await SendErrorResponseAsync(context, response, message, "0007", "������ļ����ȹ���");
                }

                // ���óɹ���Ӧ
                response.SetField(39, "0000");
                response.SetField(41, machineId);
                response.SetField(42, merchantId);

                if (message.Exist(43))
                    response.SetField(43, message.GetString(43));

                if (message.Exist(44))
                    response.SetField(44, message.GetString(44));

                // �����ļ�·����Ϣ
                if (isNewVersion)
                {
                    response.SetField(50, filePathInfo);
                }
                else
                {
                    response.SetField(47, filePathInfo);
                }

                // ��ȡ�������ļ�Ƭ��
                byte[] fileFragment = new byte[requestLength];
                Array.Copy(fileData, fileOffset, fileFragment, 0, requestLength);
                response.SetField(48, DataConvert.BytesToHex(fileFragment));

                // ������ļ���һ��Ƭ��
                if (fileOffset == 0)
                {
                    _logger.LogInformation($"��ʼ�����ļ�: {fileCode}, �汾: {fileVersion}, �ܴ�С: {fileData.Length}�ֽ�");
                }

                // ������ļ����һ��Ƭ��
                if (fileOffset + requestLength >= fileData.Length)
                {
                    _logger.LogInformation($"�ļ��������: {fileCode}, �汾: {fileVersion}");

                    // ��¼�ļ�����״̬
                    if (_publishFileOnlyNotifyOnce)
                    {
                        var clientFiles = _clientPublishFile.GetOrAdd(terminalId, _ => new SortedSet<string>());
                        string fileKey = $"{fileCode}{fileVersion}";

                        lock (clientFiles)
                        {
                            if (!clientFiles.Contains(fileKey))
                            {
                                clientFiles.Add(fileKey);
                                _logger.LogInformation($"�ļ�������¼�����: �ն�={terminalId}, �ļ�={fileCode}, �汾={fileVersion}");

                                // �����ڴ˴���ӷ�����ʷ��¼�����ݿ�
                                _ = RecordFileDownloadHistoryAsync(terminalId, merchantId, filePublish);
                            }
                        }
                    }
                }

                response.SetField(64, "00000000"); // MACֵ����������Ϊ��

                var responseBytes = response.Pack();
                await context.Transport.Output.WriteAsync(responseBytes);
                await context.Transport.Output.FlushAsync();

                _logger.LogInformation($"�ѷ����ļ�Ƭ��: ƫ��={fileOffset}, ����={requestLength}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "�����ļ���������ʱ��������");
                await SendErrorResponseAsync(context, response, message, "0009", "�ڲ��������");
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
                _logger.LogError(ex, "��¼�ļ�������ʷʱ����");
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

            response.SetField(64, "00000000"); // MACֵ����������Ϊ��

            var responseBytes = response.Pack();
            await context.Transport.Output.WriteAsync(responseBytes);
            await context.Transport.Output.FlushAsync();

            _logger.LogWarning($"���ʹ�����Ӧ: {errorCode} - {errorMessage}");
            return;
        }
    }
}


