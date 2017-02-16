using System.ComponentModel.DataAnnotations;

namespace Sperse.CRM.Authorization.Users.Dto
{
    public class ChangeUserLanguageDto
    {
        [Required]
        public string LanguageName { get; set; }
    }
}
