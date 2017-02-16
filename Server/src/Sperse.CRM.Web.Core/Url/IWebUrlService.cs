namespace Sperse.CRM.Web
{
    public interface IWebUrlService
    {
        string WebSiteRootAddressFormat { get; }

        bool SupportsTenancyNameInUrl { get; }

        string GetSiteRootAddress(string tenancyName = null);

        string ExtractTenancyNameFromUrl(string url);
    }
}
