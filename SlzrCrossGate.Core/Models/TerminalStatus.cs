using SlzrCrossGate.Core.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
public class TerminalStatus
{
    [Key]
    [MaxLength(20)]
    public required string ID { get; set; }

    public DateTime LastActiveTime { get; set; }
    public DeviceActiveStatus ActiveStatus { get; set; }
    public DateTime LoginInTime { get; set; }
    public DateTime LoginOffTime { get; set; }
    [MaxLength(200)]
    public string? Token { get; set; }
    [MaxLength(20)]
    public string? ConnectionProtocol { get; set; }
    [MaxLength(200)]
    public string? EndPoint { get; set; }

    [MaxLength(2000)]
    public string FileVersions { get; set; } = "";

    [MaxLength(2000)]
    public string Properties { get; set; } = "";

    [NotMapped]
    public Dictionary<string, VersionOptions> FileVersionMetadata
    {
        get => JsonSerializer.Deserialize<Dictionary<string, VersionOptions>>(FileVersions) ?? [];
        set => FileVersions = JsonSerializer.Serialize(value);
    }

    [NotMapped]
    public Dictionary<string, string> PropertyMetadata
    {
        get => JsonSerializer.Deserialize<Dictionary<string, string>>(Properties) ?? [];
        set => Properties = JsonSerializer.Serialize(value);
    }

    // ��������
    [ForeignKey("ID")]
    public virtual Terminal? Terminal { get; set; }
}

public class VersionOptions
{
    /// <summary>
    /// ��ǰ�汾
    /// </summary>
    public string Current { get; set; }

    /// <summary>
    /// Ԥ�ڰ汾
    /// </summary>
    public string Expected { get; set; }

    /// <summary>
    /// �����汾�Ƿ����(�ѹ��ڵ������汾����������Ҫ����ȷ��)
    /// </summary>
    public bool IsExpired { get; set; } = true;
}

