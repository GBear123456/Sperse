using System.ComponentModel.DataAnnotations;
using Sperse.CRM.Authorization.Users;

namespace Sperse.CRM.Configuration.Host.Dto
{
    public class SendTestEmailInput
    {
        [Required]
        [MaxLength(User.MaxEmailAddressLength)]
        public string EmailAddress { get; set; }
    }
}