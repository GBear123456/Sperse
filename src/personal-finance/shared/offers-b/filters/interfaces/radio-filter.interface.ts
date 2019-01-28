import { FilterSettingInterface } from 'personal-finance/shared/offers/filters/interfaces/filter-setting.interface';
import { MatRadioChange } from '@angular/material/radio';

export interface RadioFilterInterface extends FilterSettingInterface {
    onChange?: (e: MatRadioChange) => void;
}
