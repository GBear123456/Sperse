import { FilterSettingInterface } from 'personal-finance/shared/offers/interfaces/filter-setting.interface';
import { MatRadioChange } from '@angular/material/radio';

export interface RadioFilterInterface extends FilterSettingInterface {
    navigation?: boolean;
    onChange?: (e: MatRadioChange) => void;
}
