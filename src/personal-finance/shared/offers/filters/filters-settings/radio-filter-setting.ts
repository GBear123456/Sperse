import { FilterSettingConstructor } from 'personal-finance/shared/offers/filters/filters-settings/filter-setting-constructor';
import { RadioFilterInterface } from 'personal-finance/shared/offers/filters/interfaces/radio-filter.interface';
import { FilterType } from 'personal-finance/shared/offers/filter-type.enum';
import { TypeInterface } from 'personal-finance/shared/offers/filters/interfaces/type-interface';

export class RadioFilterSetting extends FilterSettingConstructor implements TypeInterface, RadioFilterInterface {
    type = FilterType.Radio;
    name?: string;
    constructor(data?: RadioFilterInterface) {
        super(data);
    }
}
