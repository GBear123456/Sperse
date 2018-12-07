import { FilterSettingConstructor } from '@root/personal-finance/shared/offers/filters-settings/filter-setting-constructor';
import { RadioFilterInterface } from '@root/personal-finance/shared/offers/interfaces/radio-filter-interface';
import { FilterType } from '@root/personal-finance/shared/offers/filter-type.enum';
import { TypeInterface } from '@root/personal-finance/shared/offers/interfaces/type-interface';

export class RadioFilterSetting extends FilterSettingConstructor implements TypeInterface, RadioFilterInterface {
    type = FilterType.Radio;
    name?: string;
    constructor(data?: RadioFilterInterface) {
        super(data);
    }
}
