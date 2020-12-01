export interface TemplateDocumentsDialogData {
    title?: string;
    showDocuments?: boolean;
    contactId: number;
    fullHeight: boolean;
    invalidate?: () => void;
    dropFiles?: () => void;
}