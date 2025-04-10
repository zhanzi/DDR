using SlzrCrossGate.Core.Models;
using System.ComponentModel.DataAnnotations;

public class FilePublishEventMessage
{
    public string ActionType { get; set; } // "Publish" or "Cancel"

    public int FilePublishID { get; set; }
    public string MerchantID { get; set; }

    public string FileTypeID { get; set; }

    public string FilePara { get; set; }

    public string FileFullType { get; set; }

    public string Ver { get; set; }

    public Operator { get; set; }

    public PublishTypeOption PublishType { get; set; }//1:�̻� 2:��· 3:�ն� 

    public required string PublishTarget { get; set; }
}
