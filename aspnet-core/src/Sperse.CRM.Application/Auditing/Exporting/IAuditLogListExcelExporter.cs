using System.Collections.Generic;
using Sperse.CRM.Auditing.Dto;
using Sperse.CRM.Dto;

namespace Sperse.CRM.Auditing.Exporting
{
    public interface IAuditLogListExcelExporter
    {
        FileDto ExportToFile(List<AuditLogListDto> auditLogListDtos);
    }
}
