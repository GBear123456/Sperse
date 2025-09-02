import {
    FileInfo,
    EmailTemplateType,
} from "@shared/service-proxies/service-proxies";
import { EmailAttachment } from '@app/crm/shared/email-template-dialog/email-attachment';


export interface CreateEmailTemplateData {
    title: string;
    previewText: string;
    body: string;
    subject: string;
    type?: EmailTemplateType;
    id?: number | null;
    cc: string[] | undefined;
    bcc: string[] | undefined;
    attachments: Partial<EmailAttachment>[];
    saveAttachmentsToDocuments: boolean;

    
}
