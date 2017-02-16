using System.Collections.Generic;
using Abp.Application.Services.Dto;
using Sperse.CRM.Editions.Dto;

namespace Sperse.CRM.MultiTenancy.Dto
{
    public class GetTenantFeaturesForEditOutput
    {
        public List<NameValueDto> FeatureValues { get; set; }

        public List<FlatFeatureDto> Features { get; set; }
    }
}