using System;
using Abp.Modules;
using Abp.MultiTenancy;
using Abp.TestBase;
using Abp.Zero.Configuration;
using Castle.MicroKernel.Registration;
using Sperse.CRM.EntityFramework;
using Sperse.CRM.Tests.Url;
using Sperse.CRM.Web.Url;
using NSubstitute;

namespace Sperse.CRM.Tests
{
    [DependsOn(
        typeof(CRMApplicationModule),
        typeof(CRMEntityFrameworkModule),
        typeof(AbpTestBaseModule))]
    public class CRMTestModule : AbpModule
    {
        public override void PreInitialize()
        {
            Configuration.UnitOfWork.Timeout = TimeSpan.FromMinutes(30);

            //Use database for language management
            Configuration.Modules.Zero().LanguageManagement.EnableDbLocalization();

            RegisterFakeService<IAbpZeroDbMigrator>();

            IocManager.Register<IAppUrlService, FakeAppUrlService>();
        }

        private void RegisterFakeService<TService>()
            where TService : class
        {
            IocManager.IocContainer.Register(
                Component.For<TService>()
                    .UsingFactoryMethod(() => Substitute.For<TService>())
                    .LifestyleSingleton()
            );
        }
    }
}
