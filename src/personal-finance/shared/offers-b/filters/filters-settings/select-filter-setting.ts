import { SelectFilterInterface } from 'personal-finance/shared/offers/filters/interfaces/select-filter.interface';
import { FilterSettingConstructor } from 'personal-finance/shared/offers/filters/filters-settings/filter-setting-constructor';
import { FilterType } from 'personal-finance/shared/offers/filter-type.enum';
import { TypeInterface } from 'personal-finance/shared/offers/filters/interfaces/type-interface';
import { Observable } from '@node_modules/rxjs';

export class SelectFilterModel {
    name: string;
    value: string;
}

export class SelectFilterSetting extends FilterSettingConstructor implements TypeInterface, SelectFilterInterface {
    type = FilterType.Select;
    name?: string;
    values$: Observable<SelectFilterModel[]>;
    templateName?: string;
    constructor(data?: SelectFilterInterface) {
        super(data);
    }
}
