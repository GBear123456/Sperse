import { FilterSettingInterface } from 'personal-finance/shared/offers/filters/interfaces/filter-setting.interface';
import {
    ChooserDesign,
    ChooserType
} from 'personal-finance/shared/offers/filters/filters-settings/chooser-filter-setting';
import { ChooserOption } from 'personal-finance/shared/offers/filters/chooser-filter/chooser-filter.component';

export interface ChooserFilterInterface extends FilterSettingInterface {
    chooserType: ChooserType;
    chooserDesign: ChooserDesign;
    onChange?: (e: ChooserOption[]) => void;
}
