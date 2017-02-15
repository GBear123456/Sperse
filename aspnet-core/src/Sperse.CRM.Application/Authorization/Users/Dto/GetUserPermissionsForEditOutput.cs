using System.Collections.Generic;
using Sperse.CRM.Authorization.Permissions.Dto;

namespace Sperse.CRM.Authorization.Users.Dto
{
    public class GetUserPermissionsForEditOutput
    {
        public List<FlatPermissionDto> Permissions { get; set; }

        public List<string> GrantedPermissionNames { get; set; }
    }
}