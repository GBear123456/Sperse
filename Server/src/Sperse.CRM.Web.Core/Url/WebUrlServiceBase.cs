using Abp.Extensions;
using Abp.MultiTenancy;
using Microsoft.AspNetCore.Hosting;
using Sperse.CRM.Web.Configuration;

namespace Sperse.CRM.Web.Url
{
    public abstract class WebUrlServiceBase
    {
        public const string TenancyNamePlaceHolder = "{TENANCY_NAME}";

        public abstract string WebSiteRootAddressFormatKey { get; }

        public string WebSiteRootAddressFormat
        {
            get
            {
                return _hostingEnvironment.GetAppConfiguration()[WebSiteRootAddressFormatKey] ?? "http://localhost:62114/";
            }
        }

        public bool SupportsTenancyNameInUrl
        {
            get
            {
                var siteRootFormat = WebSiteRootAddressFormat;
                return !siteRootFormat.IsNullOrEmpty() && siteRootFormat.Contains(TenancyNamePlaceHolder);
            }
        }

        private readonly ITenantCache _tenantCache;
        private readonly IHostingEnvironment _hostingEnvironment;

        public WebUrlServiceBase(
            IHostingEnvironment hostingEnvironment,
            ITenantCache tenantCache
        )
        {
            _hostingEnvironment = hostingEnvironment;
            _tenantCache = tenantCache;
        }

        public string GetSiteRootAddress(string tenancyName = null)
        {
            var siteRootFormat = WebSiteRootAddressFormat;

            if (!siteRootFormat.Contains(TenancyNamePlaceHolder))
            {
                return siteRootFormat;
            }

            if (siteRootFormat.Contains(TenancyNamePlaceHolder + "."))
            {
                siteRootFormat = siteRootFormat.Replace(TenancyNamePlaceHolder + ".", TenancyNamePlaceHolder);
            }

            if (tenancyName.IsNullOrEmpty())
            {
                return siteRootFormat.Replace(TenancyNamePlaceHolder, "");
            }

            return siteRootFormat.Replace(TenancyNamePlaceHolder, tenancyName + ".");
        }
    }
}