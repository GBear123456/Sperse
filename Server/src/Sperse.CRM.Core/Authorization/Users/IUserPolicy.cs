using System.Threading.Tasks;
using Abp.Domain.Policies;

namespace Sperse.CRM.Authorization.Users
{
    public interface IUserPolicy : IPolicy
    {
        Task CheckMaxUserCountAsync(int tenantId);
    }
}
