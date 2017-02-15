using System.Threading.Tasks;
using Abp;
using Abp.Notifications;
using Sperse.CRM.Authorization.Users;
using Sperse.CRM.MultiTenancy;

namespace Sperse.CRM.Notifications
{
    public interface IAppNotifier
    {
        Task WelcomeToTheApplicationAsync(User user);

        Task NewUserRegisteredAsync(User user);

        Task NewTenantRegisteredAsync(Tenant tenant);

        Task SendMessageAsync(UserIdentifier user, string message, NotificationSeverity severity = NotificationSeverity.Info);
    }
}
