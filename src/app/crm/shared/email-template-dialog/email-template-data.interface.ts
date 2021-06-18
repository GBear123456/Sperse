import { EmailAttachment } from '@app/crm/shared/email-template-dialog/email-attachment';
import { EmailTemplateType, ContactInfoDto, EmailFromInfo, EmailSettingsSource } from '@shared/service-proxies/service-proxies';

export interface EmailTemplateData {
    contact: ContactInfoDto;
    title: string;
    saveTitle: string;
    saveDisabled: boolean;
    suggestionEmails: string[];
    emailSettingsSource: EmailSettingsSource;
    attachments: Partial<EmailAttachment>[];
    from: EmailFromInfo[];
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
}