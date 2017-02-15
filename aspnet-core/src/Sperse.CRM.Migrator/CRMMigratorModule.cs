using System.Data.Entity;
using System.Reflection;
using Abp.Events.Bus;
using Abp.Modules;
using Abp.Reflection.Extensions;
using Castle.MicroKernel.Registration;
using Microsoft.Extensions.Configuration;
using Sperse.CRM.Configuration;
using Sperse.CRM.EntityFramework;

namespace Sperse.CRM.Migrator
{
    [DependsOn(typeof(CRMEntityFrameworkModule))]
    public class CRMMigratorModule : AbpModule
    {
        private readonly IConfigurationRoot _appConfiguration;

        public CRMMigratorModule()
        {
            _appConfiguration = AppConfigurations.Get(
                typeof(CRMMigratorModule).Assembly.GetDirectoryPathOrNull()
            );
        }

        public override void PreInitialize()
        {
            Database.SetInitializer<CRMDbContext>(null);

            Configuration.DefaultNameOrConnectionString = _appConfiguration.GetConnectionString(
                CRMConsts.ConnectionStringName
                );

            Configuration.BackgroundJobs.IsJobExecutionEnabled = false;
            Configuration.ReplaceService(typeof(IEventBus), () =>
            {
                IocManager.IocContainer.Register(
                    Component.For<IEventBus>().Instance(NullEventBus.Instance)
                );
            });
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(Assembly.GetExecutingAssembly());
        }
    }
}