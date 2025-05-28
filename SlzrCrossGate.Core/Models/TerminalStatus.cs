using SlzrCrossGate.Core.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace SlzrCrossGate.Core.Models
{
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
        /// �豸��ǰ�汾
        /// </summary>
        public required string Current { get; set; }

        /// <summary>
        /// Ԥ�ڰ汾�����Ϊ�գ������û����Ӧ�汾������
        /// </summary>
        public required string Expected { get; set; }
        public int ExpectedFileSize { get; set; }
        public required string ExpectedFileCrc { get; set; }
        public PublishTypeOption PublishType { get; set; }

        /// <summary>
        /// �����汾�Ƿ����(�ѹ��ڵ������汾����������Ҫ���²�ѯ��ȷ��)
        /// </summary>
        public bool IsExpired { get; set; } = true;
    }

}