namespace Sperse.CRM.Web.Models.TokenAuth
{
    public class SwitchedAccountAuthenticateResultModel
    {
        public string AccessToken { get; set; }

        public int ExpireInSeconds { get; set; }
    }
}