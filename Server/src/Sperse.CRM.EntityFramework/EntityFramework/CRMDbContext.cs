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
    /* Constructors of this DbContext is important and each one has it's own use case.
     * - Default constructor is used by EF tooling on development time.
     * - constructor(nameOrConnectionString) is used by ABP on runtime.
     * - constructor(existingConnection) is used by unit tests.
     * - constructor(existingConnection,contextOwnsConnection) can be used by ABP if DbContextEfTransactionStrategy is used.
     * See http://www.aspnetboilerplate.com/Pages/Documents/EntityFramework-Integration for more.
     */

    [DbConfigurationType(typeof(CRMDbConfiguration))]
    public class CRMDbContext : AbpZeroDbContext<Tenant, Role, User>
    {
        /* Define an IDbSet for each entity of the application */

        public virtual IDbSet<BinaryObject> BinaryObjects { get; set; }

        public virtual IDbSet<Friendship> Friendships { get; set; }

        public virtual IDbSet<ChatMessage> ChatMessages { get; set; }

        public CRMDbContext()
            : base(GetConnectionString())
        {

        }

        private static string GetConnectionString()
        {
            //Notice that; this logic only works on development time.
            //It is used to get connection string from appsettings.json in the Web project.

            var configuration = AppConfigurations.Get(
                WebContentDirectoryFinder.CalculateContentRootFolder()
                );

            return configuration.GetConnectionString(
                CRMConsts.ConnectionStringName
                );
        }

        public CRMDbContext(string nameOrConnectionString)
            : base(nameOrConnectionString)
        {

        }

        public CRMDbContext(DbConnection existingConnection)
            : base(existingConnection, false)
        {

        }

        public CRMDbContext(DbConnection existingConnection, bool contextOwnsConnection)
            : base(existingConnection, contextOwnsConnection)
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
