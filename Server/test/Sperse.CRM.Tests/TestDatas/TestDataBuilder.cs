using EntityFramework.DynamicFilters;
using Sperse.CRM.EntityFramework;

namespace Sperse.CRM.Tests.TestDatas
{
    public class TestDataBuilder
    {
        private readonly CRMDbContext _context;
        private readonly int _tenantId;

        public TestDataBuilder(CRMDbContext context, int tenantId)
        {
            _context = context;
            _tenantId = tenantId;
        }

        public void Create()
        {
            _context.DisableAllFilters();

            new TestOrganizationUnitsBuilder(_context, _tenantId).Create();

            _context.SaveChanges();
        }
    }
}
