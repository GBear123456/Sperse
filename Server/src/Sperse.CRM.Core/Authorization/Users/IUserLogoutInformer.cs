using System.Collections.Generic;
using Abp.Dependency;
using Abp.RealTime;

namespace Sperse.CRM.Authorization.Users
{
    public interface IUserLogoutInformer
    {
        void InformClients(IReadOnlyList<IOnlineClient> clients);
    }
}
