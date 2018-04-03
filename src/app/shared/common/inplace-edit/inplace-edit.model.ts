export class InplaceEditModel {
    id: number;
    value: string;
    validationRules: object[];
    isEditDialogEnabled: boolean = false;
    isDeleteEnabled: boolean = false;
    lEntityName: string;
    lEditPlaceholder: string;
    lDeleteConfirmTitle: string;
    lDeleteConfirmMessage: string;
}