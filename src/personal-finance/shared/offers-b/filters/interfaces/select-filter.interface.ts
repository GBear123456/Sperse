import { MatSelectChange } from '@angular/material/select';
import { FilterSettingInterface } from 'personal-finance/shared/offers/filters/interfaces/filter-setting.interface';

export interface SelectFilterInterface extends FilterSettingInterface {
    templateName?: string;
    onChange?: (e: MatSelectChange) => void;
}
