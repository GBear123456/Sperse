import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';

export interface StatusInfo {
    status: PaymentStatusEnum;
    /** In a case that icon is different then status */
    icon?: PaymentStatusEnum;
    statusText?: string;
    errorDetailsText?: string;
    showBack?: boolean;
}
