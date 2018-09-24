export class InplaceEditModel {
    id: number;
    displayValue: string;
    value: string;
    link: string;
    validationRules: object[];
    isEditDialogEnabled: boolean = false;
    isDeleteEnabled: boolean = false;
    lEntityName: string;
    lEditPlaceholder: string;
    lDeleteConfirmTitle: string;
    lDeleteConfirmMessage: string;
}