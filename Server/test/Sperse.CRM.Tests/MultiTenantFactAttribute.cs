using System;
using Sperse.CRM.Configuration;
using Xunit;
using Abp.Reflection.Extensions;

namespace Sperse.CRM.Tests
{
    public sealed class MultiTenantFactAttribute : FactAttribute
    {
        public MultiTenantFactAttribute()
        {
            var config = AppConfigurations.Get(
                 typeof(CRMTestModule).Assembly.GetDirectoryPathOrNull()
             );

            var multiTenancyConfig = config["MultiTenancyEnabled"];
            if (multiTenancyConfig != null && multiTenancyConfig.Equals("false", StringComparison.OrdinalIgnoreCase))
            {
                Skip = "MultiTenancy is disabled.";
            }
        }
    }
}
