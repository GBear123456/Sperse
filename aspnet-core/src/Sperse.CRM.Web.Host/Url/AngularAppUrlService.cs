using Abp.MultiTenancy;

namespace Sperse.CRM.Web.Url
{
    public class AngularAppUrlService : AppUrlServiceBase
    {
        public override string EmailActivationRoute => "confirm-email";

        public override string PasswordResetRoute => "reset-password";

        public AngularAppUrlService(
                IWebUrlService webUrlService,
                ITenantCache tenantCache
            ) : base(
                webUrlService,
                tenantCache
            )
        {

        }
    }
}