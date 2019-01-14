import { RangeFilterInterface } from 'personal-finance/shared/offers/filters/interfaces/range-filter.interface';
import { FilterType } from 'personal-finance/shared/offers/filter-type.enum';
import { FilterSettingConstructor } from 'personal-finance/shared/offers/filters/filters-settings/filter-setting-constructor';
import { TypeInterface } from 'personal-finance/shared/offers/filters/interfaces/type-interface';

export class RangeFilterSetting extends FilterSettingConstructor implements TypeInterface, RangeFilterInterface {
    type = FilterType.Range;
    name?: string;
    constructor(data?: RangeFilterInterface) {
        super(data);
    }
}
