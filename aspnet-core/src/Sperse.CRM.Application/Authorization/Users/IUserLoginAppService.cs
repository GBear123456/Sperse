using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Sperse.CRM.Authorization.Users.Dto;

namespace Sperse.CRM.Authorization.Users
{
    public interface IUserLoginAppService : IApplicationService
    {
        Task<ListResultDto<UserLoginAttemptDto>> GetRecentUserLoginAttempts();
    }
}
