export class InplaceEditModel {
    id: number;
    value: string;
    validationRules: InplaceEditValidationRule[];
    isEditDialogEnabled: boolean = false;
    isDeleteEnabled: boolean = false;
    lEntityName: string;
    lEditPlaceholder: string;
    lDeleteConfirmTitle: string;
    lDeleteConfirmMessage: string;
}

export class InplaceEditValidationRule {
    type: string;
    lErrorMessage: string;
}