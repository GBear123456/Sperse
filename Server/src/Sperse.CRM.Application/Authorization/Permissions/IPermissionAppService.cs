using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Sperse.CRM.Authorization.Permissions.Dto;

namespace Sperse.CRM.Authorization.Permissions
{
    public interface IPermissionAppService : IApplicationService
    {
        ListResultDto<FlatPermissionWithLevelDto> GetAllPermissions();
    }
}
