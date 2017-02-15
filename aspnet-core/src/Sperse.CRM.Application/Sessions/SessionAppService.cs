using System.Threading.Tasks;
using Abp.Auditing;
using Abp.AutoMapper;
using Sperse.CRM.Sessions.Dto;

namespace Sperse.CRM.Sessions
{
    public class SessionAppService : CRMAppServiceBase, ISessionAppService
    {
        [DisableAuditing]
        public async Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformations()
        {
            var output = new GetCurrentLoginInformationsOutput
            {
                Application = new ApplicationInfoDto
                {
                    Version = AppVersionHelper.Version,
                    ReleaseDate = AppVersionHelper.ReleaseDate
                }
            };

            if (AbpSession.TenantId.HasValue)
            {
                output.Tenant = (await GetCurrentTenantAsync()).MapTo<TenantLoginInfoDto>();
            }

            if (AbpSession.UserId.HasValue)
            {
                output.User = (await GetCurrentUserAsync()).MapTo<UserLoginInfoDto>();
            }

            return output;
        }
    }
}