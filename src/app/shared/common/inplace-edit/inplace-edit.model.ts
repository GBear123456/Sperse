export class InplaceEditModel {
    id: number;
    displayValue: string;
    value: string;
    link: string;
    validationRules: object[];
    isReadOnlyField = false;
    isEditDialogEnabled = false;
    isDeleteEnabled = false;
    lEntityName: string;
    lEditPlaceholder: string;
    lDeleteConfirmTitle: string;
    lDeleteConfirmMessage: string;
}