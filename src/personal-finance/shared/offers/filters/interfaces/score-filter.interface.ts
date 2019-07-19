import { FilterSettingInterface } from 'personal-finance/shared/offers/filters/interfaces/filter-setting.interface';
import { Observable } from 'rxjs';
import { CreditScoreRating } from '@shared/service-proxies/service-proxies';

export class CreditScoreItem {
    name: string;
    value: CreditScoreRating;
    min?: number;
    max?: number;
    checked?: boolean;
}

export interface ScoreFilterInterface extends FilterSettingInterface {
    values$: Observable<CreditScoreItem[]>;
    onChange?: (value: CreditScoreItem) => void;
}
