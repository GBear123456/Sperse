import { FilterSettingConstructor } from 'personal-finance/shared/offers/filters/filters-settings/filter-setting-constructor';
import { FilterType } from 'personal-finance/shared/offers/filter-type.enum';
import { TypeInterface } from 'personal-finance/shared/offers/filters/interfaces/type-interface';
import {
    CreditScoreItem,
    ScoreFilterInterface
} from '@root/personal-finance/shared/offers-b/filters/interfaces/score-filter.interface';
import { Observable } from '@node_modules/rxjs';

export class ScoreFilterSetting extends FilterSettingConstructor implements TypeInterface, ScoreFilterInterface {
    type = FilterType.Score;
    name?: string;
    values$: Observable<CreditScoreItem[]>;
    constructor(data?: ScoreFilterInterface) {
        super(data);
    }
}
