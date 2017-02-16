using Abp.Zero.Ldap.Authentication;
using Abp.Zero.Ldap.Configuration;
using Sperse.CRM.Authorization.Users;
using Sperse.CRM.MultiTenancy;

namespace Sperse.CRM.Authorization.Ldap
{
    public class AppLdapAuthenticationSource : LdapAuthenticationSource<Tenant, User>
    {
        public AppLdapAuthenticationSource(ILdapSettings settings, IAbpZeroLdapModuleConfig ldapModuleConfig)
            : base(settings, ldapModuleConfig)
        {
        }
    }
}
