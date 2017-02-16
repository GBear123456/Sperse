using Abp.Authorization;
using Sperse.CRM.Authorization.Roles;
using Sperse.CRM.Authorization.Users;
using Sperse.CRM.MultiTenancy;

namespace Sperse.CRM.Authorization
{
    /// <summary>
    /// Implements <see cref="PermissionChecker"/>.
    /// </summary>
    public class PermissionChecker : PermissionChecker<Tenant, Role, User>
    {
        public PermissionChecker(UserManager userManager)
            : base(userManager)
        {

        }
    }
}
