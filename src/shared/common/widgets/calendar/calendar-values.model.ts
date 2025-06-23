import { Period } from '@app/shared/common/period/period.enum';

export class CalendarValuesModel {
    from: { value: Date };
    to: { value: Date };
    period?: Period;
}
