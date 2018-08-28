import { FeatureStatus } from '@app/shared/common/payment-wizard/models/feature-status.enum';

export interface Feature {
    name: string;
    status: FeatureStatus;
}
