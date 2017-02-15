using System;
using System.Threading;
using Abp.Configuration.Startup;
using Abp.Dependency;
using Abp.Extensions;
using Abp.MultiTenancy;
using Abp.Runtime.Session;
using Microsoft.AspNetCore.Http;
using Sperse.CRM.MultiTenancy;

namespace Sperse.CRM.Web.MultiTenancy
{
    /// <summary>
    /// Implements <see cref="ITenantIdAccessor"/> to try to find current tenant id.
    /// </summary>
    public class TenantIdAccessor : ITenantIdAccessor, ISingletonDependency
    {
        private const string HttpContextKey = "AbpZeroCurrentTenantCacheItem";

        private readonly ITenantCache _tenantCache;
        private readonly IIocResolver _iocResolver;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IWebUrlService _webUrlService;
        private readonly IMultiTenancyConfig _multiTenancyConfig;

        private readonly Lazy<IAbpSession> _abpSession;

        private readonly AsyncLocal<int?> _currentTenant;

        private int? CurrentTenantId
        {
            get
            {
                if (_httpContextAccessor.HttpContext != null)
                {
                    _currentTenant.Value = _httpContextAccessor.HttpContext.Items[HttpContextKey] as int?;
                    return _currentTenant.Value;
                }

                return _currentTenant.Value;
            }

            set
            {
                _currentTenant.Value = value;
                if (_httpContextAccessor.HttpContext != null)
                {
                    _httpContextAccessor.HttpContext.Items[HttpContextKey] = _currentTenant.Value;
                }
            }
        }

        public TenantIdAccessor(
            ITenantCache tenantCache,
            IIocResolver iocResolver,
            IHttpContextAccessor httpContextAccessor,
            IWebUrlService webUrlService, 
            IMultiTenancyConfig multiTenancyConfig)
        {
            _tenantCache = tenantCache;
            _iocResolver = iocResolver;
            _httpContextAccessor = httpContextAccessor;
            _webUrlService = webUrlService;
            _multiTenancyConfig = multiTenancyConfig;

            _currentTenant = new AsyncLocal<int?>();
            _abpSession = new Lazy<IAbpSession>(() => _iocResolver.Resolve<IAbpSession>(), true);
        }

        /// <summary>
        /// Gets current tenant id.
        /// Use <see cref="IAbpSession.TenantId"/> wherever possible (if user logged in).
        /// This method tries to get current tenant id even if current user did not log in.
        /// </summary>
        /// <param name="useSession">Set false to skip session usage</param>
        public int? GetCurrentTenantIdOrNull(bool useSession = true)
        {
            if (useSession)
            {
                return _abpSession.Value.TenantId;
            }

            return CurrentTenantId;
        }

        /// <summary>
        /// This method is called on request beginning to obtain current tenant id.
        /// </summary>
        public void SetCurrentTenantId()
        {
            CurrentTenantId = GetVerifiedTenantIdOrNull();
        }

        private int? GetVerifiedTenantIdOrNull()
        {
            var tenancyName = GetCurrentTenancyNameFromUrlOrNull();
            if (tenancyName != null)
            {
                return _tenantCache.GetOrNull(tenancyName)?.Id;
            }

            if (_webUrlService.SupportsTenancyNameInUrl)
            {
                return null;
            }

            var tenantIdFromClient = GetFromHeaderOrNull() ?? GetFromCookieOrNull();

            if (tenantIdFromClient != null)
            {
                return _tenantCache.GetOrNull(tenantIdFromClient.Value)?.Id;
            }

            return null;
        }

        private int? GetFromHeaderOrNull()
        {
            if (_httpContextAccessor.HttpContext == null)
            {
                return null;
            }

            var header = _httpContextAccessor.HttpContext.Request.Headers["Abp.TenantId"];
            if (header.Count <= 0)
            {
                return null;
            }

            int tenantId;
            return int.TryParse(header[0], out tenantId) ? (int?)tenantId : null;
        }

        private int? GetFromCookieOrNull()
        {
            if (_httpContextAccessor.HttpContext == null)
            {
                return null;
            }

            var cookieValue = _httpContextAccessor.HttpContext.Request.Cookies["Abp.TenantId"];
            if (cookieValue.IsNullOrEmpty())
            {
                return null;
            }

            int tenantId;
            return int.TryParse(cookieValue, out tenantId) ? (int?) tenantId : null;
        }

        private string GetCurrentTenancyNameFromUrlOrNull()
        {
            if (!_multiTenancyConfig.IsEnabled)
            {
                return Tenant.DefaultTenantName;
            }

            if (_httpContextAccessor.HttpContext == null)
            {
                //Can not find current URL
                return null;
            }

            return _webUrlService.ExtractTenancyNameFromUrl(GetCurrentSiteRootAddress().EnsureEndsWith('/'));
        }

        private string GetCurrentSiteRootAddress()
        {
            return _httpContextAccessor.HttpContext.Request.Scheme + Uri.SchemeDelimiter + _httpContextAccessor.HttpContext.Request.Host;
        }
    }
}