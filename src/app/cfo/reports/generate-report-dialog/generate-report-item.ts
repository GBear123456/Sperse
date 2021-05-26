import { ReportType } from "../enums/reportType.enum";
import { ReportTemplate } from "@shared/service-proxies/service-proxies";

export class GenerateReportItem {
    id: string;
    text: string;
    type: ReportType;
    template?: ReportTemplate;
    fileType?: 'pdf' | 'excel';
    hidden?: boolean;
    isReadOnly?: boolean;
    items?: GenerateReportItem[];
}
