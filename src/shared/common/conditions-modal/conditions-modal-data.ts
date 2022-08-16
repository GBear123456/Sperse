import { ConditionsType } from '@shared/AppEnums';

export class ContditionsModalData {
    title?: string;
    type: ConditionsType;
    bodyUrl?: string;
    downloadDisabled?: boolean;
    onlyHost?: boolean;
}