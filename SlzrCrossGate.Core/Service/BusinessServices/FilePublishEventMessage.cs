using SlzrCrossGate.Core.Models;
using System.ComponentModel.DataAnnotations;

public class FilePublishEventMessage
{
    /// <summary>
    /// "Publish" or "Cancel"
    /// </summary>
    public FilePublishEventActionType ActionType { get; set; } // "Publish" or "Cancel"
    public DateTime ActionTime { get; set; } = DateTime.Now;

    public int FilePublishID { get; set; }
    public required string MerchantID { get; set; }

    public required string FileTypeID { get; set; }

    public required string FilePara { get; set; }

    public required string FileFullType { get; set; }

    public required string Ver { get; set; }
    public required string FileCrc { get; set; }
    public int FileSize { get; set; }

    public required string Operator { get; set; }

    public PublishTypeOption PublishType { get; set; }//1:�̻� 2:��· 3:�ն�

    public required string PublishTarget { get; set; }
}

public enum FilePublishEventActionType
{
    Publish,
    Cancel
}
