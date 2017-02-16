using Abp.AspNetCore.Mvc.Controllers;
using Abp.IdentityFramework;
using Microsoft.AspNet.Identity;

namespace Sperse.CRM.Web.Controllers
{
    public abstract class CRMControllerBase : AbpController
    {
        protected CRMControllerBase()
        {
            LocalizationSourceName = CRMConsts.LocalizationSourceName;
        }

        protected void CheckErrors(IdentityResult identityResult)
        {
            identityResult.CheckErrors(LocalizationManager);
        }
    }
}