using Abp.Application.Services;
using Sperse.CRM.Dto;
using Sperse.CRM.Logging.Dto;

namespace Sperse.CRM.Logging
{
    public interface IWebLogAppService : IApplicationService
    {
        GetLatestWebLogsOutput GetLatestWebLogs();

        FileDto DownloadWebLogs();
    }
}
