import { FilterSettingInterface } from 'personal-finance/shared/offers/interfaces/filter-setting.interface';
import { StepConditionInterface } from 'personal-finance/shared/offers/interfaces/step-condition.interface';
import { MatSliderChange } from '@angular/material/slider';

export interface RangeFilterInterface extends FilterSettingInterface {
    min?: number;
    max?: number;
    step?: number;
    stepsConditions?: StepConditionInterface[];
    minMaxDisplayFunction?: (value: number) => string;
    valueDisplayFunction?: (value: number) => string | { name: string, description: string };
    onChange?: (e: MatSliderChange) => void;
    fullBackground?: boolean;
}
