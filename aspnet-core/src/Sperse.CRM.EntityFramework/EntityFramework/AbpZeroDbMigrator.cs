using Abp.Dependency;
using Abp.Domain.Uow;
using Abp.MultiTenancy;
using Abp.Zero.EntityFramework;

namespace Sperse.CRM.EntityFramework
{
    public class AbpZeroDbMigrator : AbpZeroDbMigrator<CRMDbContext, Migrations.Configuration>
    {
        public AbpZeroDbMigrator(
            IUnitOfWorkManager unitOfWorkManager,
            IDbPerTenantConnectionStringResolver connectionStringResolver,
            IIocResolver iocResolver) :
            base(
                unitOfWorkManager,
                connectionStringResolver,
                iocResolver)
        {

        }
    }
}
