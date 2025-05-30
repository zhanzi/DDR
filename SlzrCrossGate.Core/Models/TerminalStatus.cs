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

        public DateTime LastActiveTime { get; set; } = DateTime.MinValue;
        public DeviceActiveStatus ActiveStatus { get; set; }
        public DateTime LoginInTime { get; set; } = DateTime.MinValue;
        public DateTime LoginOffTime { get; set; } = DateTime.MinValue;
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

        // 缓存字段，避免重复反序列化
        [NotMapped]
        private Dictionary<string, VersionOptions>? _fileVersionMetadataCache;

        [NotMapped]
        private string? _lastFileVersionsValue;

        [NotMapped]
        public Dictionary<string, VersionOptions> FileVersionMetadata
        {
            get
            {
                // 如果缓存为空或者 FileVersions 值已改变，则重新反序列化
                if (_fileVersionMetadataCache == null || _lastFileVersionsValue != FileVersions)
                {
                    _fileVersionMetadataCache = string.IsNullOrEmpty(FileVersions)
                        ? new Dictionary<string, VersionOptions>()
                        : JsonSerializer.Deserialize<Dictionary<string, VersionOptions>>(FileVersions) ?? new Dictionary<string, VersionOptions>();
                    _lastFileVersionsValue = FileVersions;
                }
                return _fileVersionMetadataCache;
            }
            set
            {
                _fileVersionMetadataCache = value;
                _lastFileVersionsValue = FileVersions = JsonSerializer.Serialize(value);
            }
        }

        // PropertyMetadata 缓存字段
        [NotMapped]
        private Dictionary<string, string>? _propertyMetadataCache;

        [NotMapped]
        private string? _lastPropertiesValue;

        [NotMapped]
        public Dictionary<string, string> PropertyMetadata
        {
            get
            {
                // 如果缓存为空或者 Properties 值已改变，则重新反序列化
                if (_propertyMetadataCache == null || _lastPropertiesValue != Properties)
                {
                    _propertyMetadataCache = string.IsNullOrEmpty(Properties)
                        ? []
                        : JsonSerializer.Deserialize<Dictionary<string, string>>(Properties) ?? [];
                    _lastPropertiesValue = Properties;
                }
                return _propertyMetadataCache;
            }
            set
            {
                _propertyMetadataCache = value;
                _lastPropertiesValue = Properties = JsonSerializer.Serialize(value);
            }
        }

        /// <summary>
        /// 更新 FileVersionMetadata 中的特定文件版本信息，并自动同步到 FileVersions 字段
        /// </summary>
        public void UpdateFileVersion(string fileType, Action<VersionOptions> updateAction)
        {
            var metadata = FileVersionMetadata; // 利用缓存获取字典
            if (metadata.TryGetValue(fileType, out var version))
            {
                updateAction(version);
                // 更新缓存和 FileVersions 字段
                SyncFileVersionsInternal();
            }
        }

        /// <summary>
        /// 批量更新 FileVersionMetadata 并自动同步到 FileVersions 字段
        /// </summary>
        public void UpdateFileVersions(Action<Dictionary<string, VersionOptions>> updateAction)
        {
            var metadata = FileVersionMetadata; // 利用缓存获取字典
            updateAction(metadata);
            // 更新缓存和 FileVersions 字段
            SyncFileVersionsInternal();
        }

        /// <summary>
        /// 添加新的文件版本信息
        /// </summary>
        public void AddFileVersion(string fileType, VersionOptions version)
        {
            var metadata = FileVersionMetadata; // 利用缓存获取字典
            metadata.TryAdd(fileType, version);
            // 更新缓存和 FileVersions 字段
            SyncFileVersionsInternal();
        }


        /// <summary>
        /// 内部同步方法，更新 FileVersions 字段并保持缓存一致性
        /// </summary>
        private void SyncFileVersionsInternal()
        {
            if (_fileVersionMetadataCache != null)
            {
                _lastFileVersionsValue = FileVersions = JsonSerializer.Serialize(_fileVersionMetadataCache);
            }
        }

        /// <summary>
        /// 清除缓存，强制下次访问时重新反序列化
        /// </summary>
        public void ClearFileVersionCache()
        {
            _fileVersionMetadataCache = null;
            _lastFileVersionsValue = null;
        }

        #region PropertyMetadata 辅助方法

        /// <summary>
        /// 更新 PropertyMetadata 中的特定属性，并自动同步到 Properties 字段
        /// </summary>
        public void UpdateProperty(string key, string value)
        {
            var metadata = PropertyMetadata; // 利用缓存获取字典
            metadata[key] = value;
            // 更新缓存和 Properties 字段
            SyncPropertiesInternal();
        }

        /// <summary>
        /// 批量更新 PropertyMetadata 并自动同步到 Properties 字段
        /// </summary>
        public void UpdateProperties(Action<Dictionary<string, string>> updateAction)
        {
            var metadata = PropertyMetadata; // 利用缓存获取字典
            updateAction(metadata);
            // 更新缓存和 Properties 字段
            SyncPropertiesInternal();
        }

        /// <summary>
        /// 获取属性值
        /// </summary>
        public string? GetProperty(string key)
        {
            return PropertyMetadata.TryGetValue(key, out var value) ? value : null;
        }

        /// <summary>
        /// 移除属性
        /// </summary>
        public bool RemoveProperty(string key)
        {
            var metadata = PropertyMetadata; // 利用缓存获取字典
            var removed = metadata.Remove(key);
            if (removed)
            {
                // 更新缓存和 Properties 字段
                SyncPropertiesInternal();
            }
            return removed;
        }

        /// <summary>
        /// 强制同步 PropertyMetadata 到 Properties 字段
        /// </summary>
        public void SyncProperties()
        {
            SyncPropertiesInternal();
        }

        /// <summary>
        /// 内部同步方法，更新 Properties 字段并保持缓存一致性
        /// </summary>
        private void SyncPropertiesInternal()
        {
            if (_propertyMetadataCache != null)
            {
                _lastPropertiesValue = Properties = JsonSerializer.Serialize(_propertyMetadataCache);
            }
        }

        /// <summary>
        /// 清除属性缓存，强制下次访问时重新反序列化
        /// </summary>
        public void ClearPropertyCache()
        {
            _propertyMetadataCache = null;
            _lastPropertiesValue = null;
        }

        /// <summary>
        /// 清除所有缓存
        /// </summary>
        public void ClearAllCaches()
        {
            ClearFileVersionCache();
            ClearPropertyCache();
        }

        #endregion

        #region 使用示例和最佳实践

        /// <summary>
        /// 使用示例：推荐的属性操作方式
        /// </summary>
        /// <example>
        /// // 读取属性（利用缓存，高性能）
        /// var deviceModel = terminalStatus.GetProperty("DeviceModel");
        ///
        /// // 设置单个属性（自动同步）
        /// terminalStatus.UpdateProperty("DeviceModel", "POS-2000");
        ///
        /// // 批量设置属性（只序列化一次）
        /// terminalStatus.UpdateProperties(props => {
        ///     props["DeviceModel"] = "POS-2000";
        ///     props["FirmwareVersion"] = "1.2.3";
        ///     props["LastMaintenance"] = DateTime.Now.ToString();
        /// });
        ///
        /// // 文件版本操作
        /// terminalStatus.SetFileVersion("APP", "1.0.0", "abc123", 1024, PublishTypeOption.Merchant);
        ///
        /// // 批量文件版本更新
        /// terminalStatus.UpdateFileVersions(versions => {
        ///     foreach (var version in versions.Values) {
        ///         version.IsExpired = false;
        ///     }
        /// });
        /// </example>
        private void UsageExamples() { /* 仅用于文档，不会被调用 */ }

        #endregion

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
        public PublishTypeOption PublishType { get; set; } = PublishTypeOption.None;

        /// <summary>
        /// �����汾�Ƿ����(�ѹ��ڵ������汾����������Ҫ���²�ѯ��ȷ��)
        /// </summary>
        public bool IsExpired { get; set; } = true;
    }

}
