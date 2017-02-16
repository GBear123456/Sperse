using Abp.Domain.Services;

namespace Sperse.CRM
{
    public abstract class CRMDomainServiceBase : DomainService
    {
        /* Add your common members for all your domain services. */

        protected CRMDomainServiceBase()
        {
            LocalizationSourceName = CRMConsts.LocalizationSourceName;
        }
    }
}
