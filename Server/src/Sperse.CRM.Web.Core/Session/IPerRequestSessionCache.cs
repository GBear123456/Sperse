using System.Threading.Tasks;
using Sperse.CRM.Sessions.Dto;

namespace Sperse.CRM.Web.Session
{
    public interface IPerRequestSessionCache
    {
        Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformationsAsync();
    }
}
