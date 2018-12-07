import { CheckboxFilterInterface } from '@root/personal-finance/shared/offers/interfaces/checkbox-filter.interface';
import { FilterType } from '@root/personal-finance/shared/offers/filter-type.enum';
import { FilterSettingConstructor } from '@root/personal-finance/shared/offers/filters-settings/filter-setting-constructor';
import { TypeInterface } from '@root/personal-finance/shared/offers/interfaces/type-interface';

export class CheckboxFilterSetting extends FilterSettingConstructor implements TypeInterface, CheckboxFilterInterface {
    type = FilterType.Checkbox;
    name?: string;
    constructor(data?: CheckboxFilterInterface) {
        super(data);
    }
}
