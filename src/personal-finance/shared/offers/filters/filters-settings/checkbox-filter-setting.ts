import { CheckboxFilterInterface } from 'personal-finance/shared/offers/filters/interfaces/checkbox-filter.interface';
import { FilterType } from 'personal-finance/shared/offers/filter-type.enum';
import { FilterSettingConstructor } from 'personal-finance/shared/offers/filters/filters-settings/filter-setting-constructor';
import { TypeInterface } from 'personal-finance/shared/offers/filters/interfaces/type-interface';

export class CheckboxFilterSetting extends FilterSettingConstructor implements TypeInterface, CheckboxFilterInterface {
    type = FilterType.Checkbox;
    name?: string;
    constructor(data?: CheckboxFilterInterface) {
        super(data);
    }
}
