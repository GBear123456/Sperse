import { RangeFilterInterface } from '@root/personal-finance/shared/offers/interfaces/range-filter.interface';
import { FilterType } from '@root/personal-finance/shared/offers/filter-type.enum';
import { FilterSettingConstructor } from '@root/personal-finance/shared/offers/filters-settings/filter-setting-constructor';
import { TypeInterface } from '@root/personal-finance/shared/offers/interfaces/type-interface';

export class RangeFilterSetting extends FilterSettingConstructor implements TypeInterface, RangeFilterInterface {
    type = FilterType.Range;
    name?: string;
    constructor(data?: RangeFilterInterface) {
        super(data);
    }
}
