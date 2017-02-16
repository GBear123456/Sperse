using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using Sperse.CRM.MultiTenancy;

namespace Sperse.CRM.Sessions.Dto
{
    [AutoMapFrom(typeof(Tenant))]
    public class TenantLoginInfoDto : EntityDto
    {
        public string TenancyName { get; set; }

        public string Name { get; set; }

        public string EditionDisplayName { get; set; }
    }
}