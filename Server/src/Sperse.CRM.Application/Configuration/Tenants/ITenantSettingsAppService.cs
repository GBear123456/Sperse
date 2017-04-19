using System.Threading.Tasks;
using Abp.Application.Services;
using Sperse.CRM.Configuration.Tenants.Dto;

namespace Sperse.CRM.Configuration.Tenants
{
    public interface ITenantSettingsAppService : IApplicationService
    {
        Task<TenantSettingsEditDto> GetAllSettings();

        Task UpdateAllSettings(TenantSettingsEditDto input);

        Task ClearLogo();

        Task ClearCustomCss();
    }
}
