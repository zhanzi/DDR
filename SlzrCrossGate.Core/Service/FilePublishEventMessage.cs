using SlzrCrossGate.Core.Models;
using System.ComponentModel.DataAnnotations;

public class FilePublishEventMessage
{
    /// <summary>
    /// "Publish" or "Cancel"
    /// </summary>
    public string ActionType { get; set; } // "Publish" or "Cancel"

    public int FilePublishID { get; set; }
    public string MerchantID { get; set; }

    public string FileTypeID { get; set; }

    public string FilePara { get; set; }

    public string FileFullType { get; set; }

    public string Ver { get; set; }
    public string FileCrc { get; set; }
    public int FileSize { get; set; }

    public string Operator { get; set; }

    public PublishTypeOption PublishType { get; set; }//1:商户 2:线路 3:终端 

    public required string PublishTarget { get; set; }
}
