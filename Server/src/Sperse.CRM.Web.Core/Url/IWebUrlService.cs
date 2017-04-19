namespace Sperse.CRM.Web.Url
{
    public interface IWebUrlService
    {
        string WebSiteRootAddressFormat { get; }

        bool SupportsTenancyNameInUrl { get; }

        string GetSiteRootAddress(string tenancyName = null);
    }
}
