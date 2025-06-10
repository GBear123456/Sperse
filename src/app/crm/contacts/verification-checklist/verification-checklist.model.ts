export enum VerificationChecklistItemType {
    Identity = 'Identity',
    Email = 'Email',
    Phone = 'Phone',
    Address = 'Address',
    Employment = 'Employment',
    Income = 'Income'
}

export enum VerificationChecklistItemStatus {
    success = 'success',
    unsuccess = 'unsuccess',
    pending = 'pending'
}

export class VerificationChecklistItem {
    type: VerificationChecklistItemType;
    status: VerificationChecklistItemStatus;
    confirmedCount: number;
    totalCount: number;
}