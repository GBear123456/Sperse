import { EmailAttachment } from '@app/crm/shared/email-template-dialog/email-attachment';
import { EmailTemplateType, ContactInfoDto } from '@shared/service-proxies/service-proxies';

export interface EmailTemplateData {
    contact: ContactInfoDto;
    title: string;
    saveTitle: string;
    saveDisabled: boolean;
    suggestionEmails: string[];
    attachments: Partial<EmailAttachment>[];
    from: string;
    to: string[];
    body: string;
    subject: string;
    cc: string[];
    bcc: string[];
    templateId: number;
    replyTo: string;
    templateType: EmailTemplateType;
    switchTemplate: EmailTemplateType;
    tags: { [key: string]: string; } | undefined;
    hideContextMenu?: boolean;
    addMode?: boolean;
    addDefaultTemplate?: boolean;
    showEmptyCCAndBcc?: boolean
}