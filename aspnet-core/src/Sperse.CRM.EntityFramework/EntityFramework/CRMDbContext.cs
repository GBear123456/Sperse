using System.Data.Common;
using System.Data.Entity;
using Abp.Zero.EntityFramework;
using Microsoft.Extensions.Configuration;
using Sperse.CRM.Authorization.Roles;
using Sperse.CRM.Authorization.Users;
using Sperse.CRM.Chat;
using Sperse.CRM.Configuration;
using Sperse.CRM.Friendships;
using Sperse.CRM.MultiTenancy;
using Sperse.CRM.Storage;
using Sperse.CRM.Web;

namespace Sperse.CRM.EntityFramework
{
    [DbConfigurationType(typeof(CRMDbConfiguration))]
    public class CRMDbContext : AbpZeroDbContext<Tenant, Role, User>
    {
        /* Define an IDbSet for each entity of the application */

        public virtual IDbSet<BinaryObject> BinaryObjects { get; set; }

        public virtual IDbSet<Friendship> Friendships { get; set; }

        public virtual IDbSet<ChatMessage> ChatMessages { get; set; }

        /* Default constructor is needed for EF command line tool. */
        public CRMDbContext()
            : base(GetConnectionString())
        {
            
        }

        private static string GetConnectionString()
        {
            var configuration = AppConfigurations.Get(
                WebContentDirectoryFinder.CalculateContentRootFolder()
                );

            return configuration.GetConnectionString(
                CRMConsts.ConnectionStringName
                );
        }

        /* This constructor is used by ABP to pass connection string defined in CRMDataModule.PreInitialize.
         * Notice that, actually you will not directly create an instance of CRMDbContext since ABP automatically handles it.
         */
        public CRMDbContext(string nameOrConnectionString)
            : base(nameOrConnectionString)
        {

        }

        /* This constructor is used in tests to pass a fake/mock connection. */
        public CRMDbContext(DbConnection dbConnection)
            : base(dbConnection, true)
        {

        }
    }

    public class CRMDbConfiguration : DbConfiguration
    {
        public CRMDbConfiguration()
        {
            SetProviderServices(
                "System.Data.SqlClient",
                System.Data.Entity.SqlServer.SqlProviderServices.Instance
            );
        }
    }
}
