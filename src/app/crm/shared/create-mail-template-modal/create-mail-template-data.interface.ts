import {
    FileInfo,
    EmailTemplateType,
} from "@shared/service-proxies/service-proxies";

export interface CreateEmailTemplateData {
    title: string;
    previewText: string;
    body: string;
    subject: string;
    type: EmailTemplateType;
    id?: number | null;
    cc: string[] | undefined;
    bcc: string[] | undefined;
    attachments: FileInfo[] | undefined;
}
