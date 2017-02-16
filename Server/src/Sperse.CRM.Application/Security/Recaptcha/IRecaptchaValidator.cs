using System.Threading.Tasks;

namespace Sperse.CRM.Security.Recaptcha
{
    public interface IRecaptchaValidator
    {
        Task ValidateAsync(string captchaResponse);
    }
}