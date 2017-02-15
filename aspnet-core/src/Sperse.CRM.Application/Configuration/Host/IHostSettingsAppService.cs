using System.Threading.Tasks;
using Abp.Application.Services;
using Sperse.CRM.Configuration.Host.Dto;

namespace Sperse.CRM.Configuration.Host
{
    public interface IHostSettingsAppService : IApplicationService
    {
        Task<HostSettingsEditDto> GetAllSettings();

        Task UpdateAllSettings(HostSettingsEditDto input);

        Task SendTestEmail(SendTestEmailInput input);
    }
}
