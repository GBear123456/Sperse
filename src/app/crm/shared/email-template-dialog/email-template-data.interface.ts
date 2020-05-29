import { EmailAttachment } from '@app/crm/shared/email-template-dialog/email-attachment';
import { EmailTemplateType } from '@shared/service-proxies/service-proxies';

export interface EmailTemplateData {
    title: string;
    saveTitle: string;
    suggestionEmails: string[];
    attachments: Partial<EmailAttachment>[];
    from: string[];
    to: string[];
    body: string;
    subject: string;
    cc: string[];
    bcc: string[];
    templateId: number;
    replyTo: string;
    templateType: EmailTemplateType;
    switchTemplate: EmailTemplateType;
}