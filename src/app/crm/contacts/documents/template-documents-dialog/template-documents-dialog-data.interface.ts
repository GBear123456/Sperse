export interface TemplateDocumentsDialogData {
    title?: string;
    showUpload?: boolean;    
    showDocuments?: boolean;
    contactId: number;
    fullHeight: boolean;
    invalidate?: () => void;
    dropFiles?: () => void;
}