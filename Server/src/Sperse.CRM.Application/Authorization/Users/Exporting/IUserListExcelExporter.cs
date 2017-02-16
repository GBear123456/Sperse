using System.Collections.Generic;
using Sperse.CRM.Authorization.Users.Dto;
using Sperse.CRM.Dto;

namespace Sperse.CRM.Authorization.Users.Exporting
{
    public interface IUserListExcelExporter
    {
        FileDto ExportToFile(List<UserListDto> userListDtos);
    }
}