using System.ComponentModel.DataAnnotations;

namespace Sperse.CRM.Localization.Dto
{
    public class CreateOrUpdateLanguageInput
    {
        [Required]
        public ApplicationLanguageEditDto Language { get; set; }
    }
}