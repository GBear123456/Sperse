using System.Threading.Tasks;
using Abp.Configuration;

namespace Sperse.CRM.Timing
{
    public interface ITimeZoneService
    {
        Task<string> GetDefaultTimezoneAsync(SettingScopes scope, int? tenantId);
    }
}
