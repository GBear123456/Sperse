using Abp.AutoMapper;
using Sperse.CRM.Web.Authentication.External;

namespace Sperse.CRM.Web.Models.TokenAuth
{
    [AutoMapFrom(typeof(ExternalLoginProviderInfo))]
    public class ExternalLoginProviderInfoModel
    {
        public string Name { get; set; }

        public string ClientId { get; set; }
    }
}
