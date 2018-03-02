export class InplaceSelectBoxModel {
    options: InplaceSelectBoxOption[];
    name: string;
    value: any;
    validationRules: InplaceEditValidationRule[];
}

export class InplaceSelectBoxOption{
    id: any;
    name: string;
}

export class InplaceEditValidationRule {
    type: string;
    lErrorMessage: string;
}