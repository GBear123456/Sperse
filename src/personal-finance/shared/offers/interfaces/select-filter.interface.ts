import { MatSelectChange } from '@angular/material/select';
import { FilterSettingInterface } from '@root/personal-finance/shared/offers/interfaces/filter-setting.interface';

export interface SelectFilterInterface extends FilterSettingInterface {
    templateName?: string;
    onChange?: (e: MatSelectChange) => void;
}
