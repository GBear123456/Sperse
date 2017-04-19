using Abp.AspNetCore.Mvc.Authorization;

namespace Sperse.CRM.Web.Controllers
{
    [AbpMvcAuthorize]
    public class ProfileController : ProfileControllerBase
    {
        public ProfileController(IAppFolders appFolders)
            : base(appFolders)
        {
        }
    }
}