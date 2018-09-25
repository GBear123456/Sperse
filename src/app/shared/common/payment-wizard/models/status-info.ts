import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';

export interface StatusInfo {
    status: PaymentStatusEnum;
    statusText?: string;
    errorDetailsText?: string;
}
