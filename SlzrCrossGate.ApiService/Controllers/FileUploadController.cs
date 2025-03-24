using Microsoft.AspNetCore.Mvc;
using SlzrCrossGate.Core.Services;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace SlzrCrossGate.ApiService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FileUploadController : ControllerBase
    {
        private readonly IFileService _fileService;

        public FileUploadController(IFileService fileService)
        {
            _fileService = fileService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadFile([FromForm] IFormFile file, [FromForm] string uploadedBy)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            try
            {
                var filePath = await _fileService.UploadFileAsync(file, uploadedBy);
                return Ok(new { FilePath = filePath });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("upload-local-file")]
        public async Task<IActionResult> UploadLocalFile([FromForm] string localFilePath, [FromForm] string uploadedBy, [FromForm] string storageType)
        {
            if (string.IsNullOrEmpty(localFilePath) || !System.IO.File.Exists(localFilePath))
            {
                return BadRequest("Invalid local file path.");
            }

            try
            {
                using (var stream = new FileStream(localFilePath, FileMode.Open, FileAccess.Read))
                {
                    var fileName = Path.GetFileName(localFilePath);
                    var formFile = new FormFile(stream, 0, stream.Length, null, fileName)
                    {
                        Headers = new HeaderDictionary(),
                        ContentType = "application/octet-stream"
                    };

                    var filePath = await _fileService.UploadFileAsync(formFile, uploadedBy, storageType);
                    return Ok(new { FilePath = filePath });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
