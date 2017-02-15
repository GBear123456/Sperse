using System.Threading.Tasks;
using Abp.Application.Services;
using Sperse.CRM.Sessions.Dto;

namespace Sperse.CRM.Sessions
{
    public interface ISessionAppService : IApplicationService
    {
        Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformations();
    }
}
