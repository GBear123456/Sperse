using Abp.Auditing;
using Microsoft.AspNetCore.Mvc;

namespace Sperse.CRM.Web.Controllers
{
    public class HomeController : CRMControllerBase
    {
        public IActionResult Index()
        {
            return Redirect("/swagger/ui");
        }
    }
}
