using Sperse.CRM.Dto;

namespace Sperse.CRM.Common.Dto
{
    public class FindUsersInput : PagedAndFilteredInputDto
    {
        public int? TenantId { get; set; }
    }
}