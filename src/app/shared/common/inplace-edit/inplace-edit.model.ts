export class InplaceEditModel {
    id: number;
    value: any;
    validationRules: InplaceEditValidationRule[];
    isEditDialogEnabled: boolean;
    lEntityName: string;
    lEditPlaceholder: string;
    lDeleteConfirmTitle: string;
    lDeleteConfirmMessage: string;
}

export class InplaceEditValidationRule {
    type: string;
    lErrorMessage: string;
}