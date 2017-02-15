using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Sperse.CRM.Caching.Dto;

namespace Sperse.CRM.Caching
{
    public interface ICachingAppService : IApplicationService
    {
        ListResultDto<CacheDto> GetAllCaches();

        Task ClearCache(EntityDto<string> input);

        Task ClearAllCaches();
    }
}
