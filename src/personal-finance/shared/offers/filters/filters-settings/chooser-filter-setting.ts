import { FilterSettingConstructor } from 'personal-finance/shared/offers/filters/filters-settings/filter-setting-constructor';
import { FilterType } from 'personal-finance/shared/offers/filter-type.enum';
import { TypeInterface } from 'personal-finance/shared/offers/filters/interfaces/type-interface';
import { ChooserFilterInterface } from 'personal-finance/shared/offers/filters/interfaces/chooser-filter.interface';

export enum ChooserType {
    Single,
    Multi
}

export enum ChooserDesign {
    Combined = 'combined',
    Separate = 'separate'
}

export class ChooserFilterSetting extends FilterSettingConstructor implements TypeInterface, ChooserFilterInterface {
    type = FilterType.Chooser;
    chooserType: ChooserType;
    chooserDesign: ChooserDesign;
    name?: string;
    constructor(data?: ChooserFilterInterface) {
        super(data);
    }
}
