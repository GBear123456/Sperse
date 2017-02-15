using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Sperse.CRM.Auditing.Dto;
using Sperse.CRM.Dto;

namespace Sperse.CRM.Auditing
{
    public interface IAuditLogAppService : IApplicationService
    {
        Task<PagedResultDto<AuditLogListDto>> GetAuditLogs(GetAuditLogsInput input);

        Task<FileDto> GetAuditLogsToExcel(GetAuditLogsInput input);
    }
}