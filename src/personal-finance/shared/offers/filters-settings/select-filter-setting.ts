import { SelectFilterInterface } from '@root/personal-finance/shared/offers/interfaces/select-filter.interface';
import { FilterSettingConstructor } from '@root/personal-finance/shared/offers/filters-settings/filter-setting-constructor';
import { FilterType } from '@root/personal-finance/shared/offers/filter-type.enum';
import { TypeInterface } from '@root/personal-finance/shared/offers/interfaces/type-interface';

export class SelectFilterSetting extends FilterSettingConstructor implements TypeInterface, SelectFilterInterface {
    type = FilterType.Select;
    name?: string;
    constructor(data?: SelectFilterInterface) {
        super(data);
    }
}
