using Abp.Application.Services;
using Sperse.CRM.Tenants.Dashboard.Dto;

namespace Sperse.CRM.Tenants.Dashboard
{
    public interface ITenantDashboardAppService : IApplicationService
    {
        GetMemberActivityOutput GetMemberActivity();
    }
}
