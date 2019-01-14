import { FilterSettingInterface } from 'personal-finance/shared/offers/filters/interfaces/filter-setting.interface';
import { Observable } from 'rxjs';
import { CreditScore } from '@shared/service-proxies/service-proxies';

export class CreditScoreItem {
    name: string;
    value: CreditScore;
    min?: number;
    max?: number;
    checked?: boolean;
}

export interface ScoreFilterInterface extends FilterSettingInterface {
    values$: Observable<CreditScoreItem[]>;
    onChange?: (value: CreditScore) => void;
}
