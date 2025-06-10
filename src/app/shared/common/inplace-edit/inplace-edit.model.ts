export class InplaceEditModel {
    id: number;
    displayValue?: string;
    value: string;
    link?: string;
    validationRules?: object[];
    isReadOnlyField?= false;
    isEditDialogEnabled?= false;
    isEditEnabled?= true;
    isDeleteEnabled?= false;
    lEntityName: string;
    editPlaceholder?: string;
    lDeleteConfirmTitle?: string;
    lDeleteConfirmMessage?: string;
}
