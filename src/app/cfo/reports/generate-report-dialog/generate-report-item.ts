import { ReportType } from "../reportType.enum";
import { ReportTemplate } from "@shared/service-proxies/service-proxies";

export class GenerateReportItem {
    id: string;
    text: string;
    type: ReportType;
    template?: ReportTemplate;
    fileType?: 'pdf' | 'excel';
    isReadOnly?: boolean;
    items?: GenerateReportItem[];
}
