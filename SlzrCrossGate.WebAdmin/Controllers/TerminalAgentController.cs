using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Service.FileStorage;
using SlzrCrossGate.WebAdmin.Services;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SlzrCrossGate.WebAdmin.Controllers
{
    [AllowAnonymous]
    [ApiController]
    public class TerminalAgentController(TcpDbContext dbContext, FileService fileService) : ControllerBase
    {
        private readonly TcpDbContext _dbContext = dbContext;
        private readonly FileService _fileService = fileService;

        [Route("File/Down")]
        [HttpGet]
        public async Task<IActionResult> Down(string merchant, string file, string ver)
        {
            var fileVersion = await _dbContext.FileVers
        .FirstOrDefaultAsync(f => f.MerchantID == merchant && f.FileFullType == file && f.Ver == ver);

            if (fileVersion == null)
            {
                //版本文件不存在
                return NotFound("版本文件不存在");
            }

            // 获取上传文件信息
            var uploadFile = await _dbContext.UploadFiles
                .FirstOrDefaultAsync(u => u.ID == fileVersion.UploadFileID);

            if (uploadFile == null)
            {
                //文件不存在
                return NotFound("文件不存在");
            }

            var fileBytes = await _fileService.GetFileContentAsync(uploadFile.FilePath);
            if (fileBytes == null)
            {
                //文件内容不存在
                return NotFound("文件内容不存在");
            }

            return File(fileBytes, "application/octet-stream", uploadFile.FileName);

        }


        [Route("File/GetVer")]
        [HttpGet]
        public async Task<string> GetVer(string merchant, string line, string machineid, string busno = "", string file = "")
        {
            if (string.IsNullOrEmpty(file))
            {
                return "";
            }
            var fileVersion = await _dbContext.FilePublishs.FirstOrDefaultAsync(f => f.MerchantID == merchant && f.FileFullType == file && f.PublishType == PublishTypeOption.Terminal && f.PublishTarget.Contains(machineid));
            if (fileVersion != null)
            {
                return fileVersion.Ver;
            }
            fileVersion = await _dbContext.FilePublishs.FirstOrDefaultAsync(f => f.MerchantID == merchant && f.FileFullType == file && f.PublishType == PublishTypeOption.Line && f.PublishTarget == line);
            if (fileVersion != null)
            {
                return fileVersion.Ver;
            }
            fileVersion = await _dbContext.FilePublishs.FirstOrDefaultAsync(f => f.MerchantID == merchant && f.FileFullType == file && f.PublishType == PublishTypeOption.Merchant && f.PublishTarget == merchant);
            if (fileVersion != null)
            {
                return fileVersion.Ver;
            }
            return "";
        }

        [Route("File/GetVerAndDate")]
        [HttpGet]
        public async Task<string> GetVerAndDate(string merchant, string line, string machineid, string busno = "", string file = "")
        {
            if (string.IsNullOrEmpty(file))
            {
                return "";
            }
            var fileVersion = await _dbContext.FilePublishs.FirstOrDefaultAsync(f => f.MerchantID == merchant && f.FileFullType == file && f.PublishType == PublishTypeOption.Terminal && f.PublishTarget.Contains(machineid));
            if (fileVersion != null)
            {
                return fileVersion.Ver + fileVersion.PublishTime.ToString("yyyyMMdd");
            }
            fileVersion = await _dbContext.FilePublishs.FirstOrDefaultAsync(f => f.MerchantID == merchant && f.FileFullType == file && f.PublishType == PublishTypeOption.Line && f.PublishTarget == line);
            if (fileVersion != null)
            {
                return fileVersion.Ver + fileVersion.PublishTime.ToString("yyyyMMdd");
            }
            fileVersion = await _dbContext.FilePublishs.FirstOrDefaultAsync(f => f.MerchantID == merchant && f.FileFullType == file && f.PublishType == PublishTypeOption.Merchant && f.PublishTarget == merchant);
            if (fileVersion != null)
            {
                return fileVersion.Ver + fileVersion.PublishTime.ToString("yyyyMMdd");
            }
            return "";
        }
    }
}