import { FilterSettingConstructor } from '@root/personal-finance/shared/offers/filters-settings/filter-setting-constructor';
import { FilterType } from '@root/personal-finance/shared/offers/filter-type.enum';
import { TypeInterface } from '@root/personal-finance/shared/offers/interfaces/type-interface';
import { ChooserFilterInterface } from '@root/personal-finance/shared/offers/interfaces/chooser-filter.interface';

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
