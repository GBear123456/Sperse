using System.Threading.Tasks;
using Abp.Application.Services;
using Sperse.CRM.MultiTenancy.Dto;

namespace Sperse.CRM.MultiTenancy
{
    public interface ITenantRegistrationAppService: IApplicationService
    {
        Task<RegisterTenantOutput> RegisterTenant(RegisterTenantInput input);
    }
}