using Abp.Notifications;
using Sperse.CRM.Dto;

namespace Sperse.CRM.Notifications.Dto
{
    public class GetUserNotificationsInput : PagedInputDto
    {
        public UserNotificationState? State { get; set; }
    }
}