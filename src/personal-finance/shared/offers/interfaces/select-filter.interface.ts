import { MatSelectChange } from '@angular/material';
import { FilterSettingInterface } from '@root/personal-finance/shared/offers/interfaces/filter-setting.interface';

export interface SelectFilterInterface extends FilterSettingInterface {
    onChange?: (e: MatSelectChange) => void;
}
