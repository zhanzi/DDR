using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Models;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SlzrCrossGate.WebAdmin.Services
{
    public class WechatAuthService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<WechatAuthService> _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly HttpClient _httpClient;
        private readonly Dictionary<string, WechatLoginSession> _loginSessions = new Dictionary<string, WechatLoginSession>();
        private readonly string _appId;
        private readonly string _appSecret;
        private readonly string _redirectUrl;
        private readonly int _qrCodeExpiryMinutes;

        public WechatAuthService(
            IConfiguration configuration,
            ILogger<WechatAuthService> logger,
            UserManager<ApplicationUser> userManager,
            IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _logger = logger;
            _userManager = userManager;
            _httpClient = httpClientFactory.CreateClient("WechatApi");

            // 从配置中读取微信相关设置
            _appId = _configuration["Wechat:AppId"] ?? throw new ArgumentNullException("Wechat:AppId");
            _appSecret = _configuration["Wechat:AppSecret"] ?? throw new ArgumentNullException("Wechat:AppSecret");
            _redirectUrl = _configuration["Wechat:RedirectUrl"] ?? throw new ArgumentNullException("Wechat:RedirectUrl");
            _qrCodeExpiryMinutes = int.Parse(_configuration["Wechat:QrCodeExpiryMinutes"] ?? "5");
        }

        // 创建微信登录会话
        public async Task<WechatLoginSession> CreateLoginSessionAsync()
        {
            try
            {
                var loginId = Guid.NewGuid().ToString();
                var session = new WechatLoginSession
                {
                    LoginId = loginId,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(_qrCodeExpiryMinutes),
                    Status = WechatLoginStatus.Pending,
                    OpenId = string.Empty,
                    UnionId = string.Empty,
                    Nickname = string.Empty
                };

                // 生成微信授权URL
                // 实际项目中，应该使用微信开放平台的接口
                // 这里使用微信公众平台的网页授权接口作为示例
                var state = loginId; // 使用loginId作为state，用于回调时识别会话
                var authUrl = $"https://open.weixin.qq.com/connect/qrconnect" +
                              $"?appid={_appId}" +
                              $"&redirect_uri={Uri.EscapeDataString(_redirectUrl)}" +
                              $"&response_type=code" +
                              $"&scope=snsapi_login" +
                              $"&state={state}" +
                              $"#wechat_redirect";

                // 在实际项目中，可以使用微信提供的二维码生成接口
                // 这里简化处理，直接使用授权URL作为二维码内容
                session.QrCodeUrl = authUrl;

                // 存储会话
                _loginSessions[loginId] = session;

                return session;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "创建微信登录会话失败");
                throw;
            }
        }

        // 处理微信授权回调
        public async Task<WechatLoginSession?> HandleWechatCallbackAsync(string code, string state)
        {
            try
            {
                // 验证state，确保是我们发起的请求
                if (!_loginSessions.TryGetValue(state, out var session))
                {
                    _logger.LogWarning("未找到对应的微信登录会话: {State}", state);
                    return null;
                }

                // 使用code获取access_token
                var tokenUrl = $"https://api.weixin.qq.com/sns/oauth2/access_token" +
                               $"?appid={_appId}" +
                               $"&secret={_appSecret}" +
                               $"&code={code}" +
                               $"&grant_type=authorization_code";

                var tokenResponse = await _httpClient.GetFromJsonAsync<WechatTokenResponse>(tokenUrl);
                if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.AccessToken))
                {
                    _logger.LogError("获取微信access_token失败");
                    return null;
                }

                // 使用access_token获取用户信息
                var userInfoUrl = $"https://api.weixin.qq.com/sns/userinfo" +
                                  $"?access_token={tokenResponse.AccessToken}" +
                                  $"&openid={tokenResponse.OpenId}" +
                                  $"&lang=zh_CN";

                var userInfoResponse = await _httpClient.GetFromJsonAsync<WechatUserInfoResponse>(userInfoUrl);
                if (userInfoResponse == null)
                {
                    _logger.LogError("获取微信用户信息失败");
                    return null;
                }

                // 更新会话信息
                session.OpenId = tokenResponse.OpenId;
                session.UnionId = tokenResponse.UnionId ?? string.Empty;
                session.Nickname = userInfoResponse.Nickname;
                session.Status = WechatLoginStatus.Scanned;
                session.ScannedAt = DateTime.UtcNow;

                return session;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "处理微信授权回调失败");
                return null;
            }
        }

        // 检查登录会话状态
        public WechatLoginSession GetLoginSession(string loginId)
        {
            if (_loginSessions.TryGetValue(loginId, out var session))
            {
                // 检查是否过期
                if (DateTime.UtcNow > session.ExpiresAt)
                {
                    session.Status = WechatLoginStatus.Expired;
                }
                return session;
            }
            return null;
        }

        // 更新登录会话状态（模拟微信扫码成功）
        public async Task<bool> UpdateLoginSessionAsync(string loginId, string openId, string unionId, string nickname)
        {
            if (_loginSessions.TryGetValue(loginId, out var session))
            {
                if (session.Status == WechatLoginStatus.Pending && DateTime.UtcNow <= session.ExpiresAt)
                {
                    session.OpenId = openId;
                    session.UnionId = unionId;
                    session.Nickname = nickname;
                    session.Status = WechatLoginStatus.Scanned;
                    session.ScannedAt = DateTime.UtcNow;
                    return true;
                }
            }
            return false;
        }

        // 确认登录（模拟用户在微信中确认登录）
        public async Task<bool> ConfirmLoginAsync(string loginId)
        {
            if (_loginSessions.TryGetValue(loginId, out var session))
            {
                if (session.Status == WechatLoginStatus.Scanned && DateTime.UtcNow <= session.ExpiresAt)
                {
                    session.Status = WechatLoginStatus.Confirmed;
                    session.ConfirmedAt = DateTime.UtcNow;
                    return true;
                }
            }
            return false;
        }

        // 查找或创建与微信账号关联的用户
        public async Task<ApplicationUser> FindOrCreateUserByWechatAsync(string openId, string unionId, string nickname)
        {
            // 首先尝试通过OpenID查找用户
            var user = await _userManager.Users.Where(u => u.WechatOpenId == openId).FirstOrDefaultAsync();
            if (user != null)
            {
                return user;
            }

            // 如果有UnionID，也尝试通过UnionID查找
            if (!string.IsNullOrEmpty(unionId))
            {
                user = await _userManager.Users.Where(u => u.WechatUnionId == unionId).FirstOrDefaultAsync();
                if (user != null)
                {
                    // 更新OpenID（如果之前没有）
                    if (string.IsNullOrEmpty(user.WechatOpenId))
                    {
                        user.WechatOpenId = openId;
                        await _userManager.UpdateAsync(user);
                    }
                    return user;
                }
            }

            // 用户不存在，创建新用户
            return null; // 在实际应用中，可能需要创建新用户或返回null
        }

        // 绑定微信账号到现有用户
        public async Task<bool> BindWechatToUserAsync(ApplicationUser user, string openId, string unionId, string nickname)
        {
            if (user == null)
            {
                return false;
            }

            // 检查OpenID是否已被其他用户使用
            var existingUser = await _userManager.Users.Where(u => u.WechatOpenId == openId && u.Id != user.Id).FirstOrDefaultAsync();
            if (existingUser != null)
            {
                _logger.LogWarning($"微信OpenID已被用户{existingUser.UserName}使用，无法绑定到用户{user.UserName}");
                return false;
            }

            // 检查UnionID是否已被其他用户使用
            if (!string.IsNullOrEmpty(unionId))
            {
                existingUser = await _userManager.Users.Where(u => u.WechatUnionId == unionId && u.Id != user.Id).FirstOrDefaultAsync();
                if (existingUser != null)
                {
                    _logger.LogWarning($"微信UnionID已被用户{existingUser.UserName}使用，无法绑定到用户{user.UserName}");
                    return false;
                }
            }

            // 更新用户的微信信息
            user.WechatOpenId = openId;
            user.WechatUnionId = unionId;
            user.WechatNickname = nickname;
            user.WechatBindTime = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            return result.Succeeded;
        }

        // 解绑微信账号
        public async Task<bool> UnbindWechatFromUserAsync(ApplicationUser user)
        {
            if (user == null || string.IsNullOrEmpty(user.WechatOpenId))
            {
                return false;
            }

            user.WechatOpenId = null;
            user.WechatUnionId = null;
            user.WechatNickname = null;
            user.WechatBindTime = null;

            var result = await _userManager.UpdateAsync(user);
            return result.Succeeded;
        }

        // 清理过期的登录会话
        public void CleanupExpiredSessions()
        {
            var expiredKeys = _loginSessions.Where(kv => DateTime.UtcNow > kv.Value.ExpiresAt)
                                           .Select(kv => kv.Key)
                                           .ToList();

            foreach (var key in expiredKeys)
            {
                _loginSessions.Remove(key);
            }
        }
    }

    public class WechatLoginSession
    {
        public string LoginId { get; set; } = string.Empty;
        public string QrCodeUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public WechatLoginStatus Status { get; set; }
        public DateTime? ScannedAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public string OpenId { get; set; } = string.Empty;
        public string UnionId { get; set; } = string.Empty;
        public string Nickname { get; set; } = string.Empty;
        public ApplicationUser? User { get; set; }
    }

    public enum WechatLoginStatus
    {
        Pending,    // 等待扫码
        Scanned,    // 已扫码
        Confirmed,  // 已确认
        Expired,    // 已过期
        Canceled    // 已取消
    }

    public class WechatTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }

        [JsonPropertyName("refresh_token")]
        public string RefreshToken { get; set; } = string.Empty;

        [JsonPropertyName("openid")]
        public string OpenId { get; set; } = string.Empty;

        [JsonPropertyName("scope")]
        public string Scope { get; set; } = string.Empty;

        [JsonPropertyName("unionid")]
        public string? UnionId { get; set; }
    }

    public class WechatUserInfoResponse
    {
        [JsonPropertyName("openid")]
        public string OpenId { get; set; } = string.Empty;

        [JsonPropertyName("nickname")]
        public string Nickname { get; set; } = string.Empty;

        [JsonPropertyName("sex")]
        public int Sex { get; set; }

        [JsonPropertyName("province")]
        public string Province { get; set; } = string.Empty;

        [JsonPropertyName("city")]
        public string City { get; set; } = string.Empty;

        [JsonPropertyName("country")]
        public string Country { get; set; } = string.Empty;

        [JsonPropertyName("headimgurl")]
        public string HeadImgUrl { get; set; } = string.Empty;

        [JsonPropertyName("privilege")]
        public List<string> Privilege { get; set; } = new List<string>();

        [JsonPropertyName("unionid")]
        public string? UnionId { get; set; }
    }
}
