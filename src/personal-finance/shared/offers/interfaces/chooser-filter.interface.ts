import { FilterSettingInterface } from 'personal-finance/shared/offers/interfaces/filter-setting.interface';
import {
    ChooserDesign,
    ChooserType
} from '@root/personal-finance/shared/offers/filters-settings/chooser-filter-setting';
import { ChooserOption } from '@root/personal-finance/shared/offers/filters/chooser-filter/chooser-filter.component';

export interface ChooserFilterInterface extends FilterSettingInterface {
    chooserType: ChooserType;
    chooserDesign: ChooserDesign;
    onChange?: (e: ChooserOption[]) => void;
}
