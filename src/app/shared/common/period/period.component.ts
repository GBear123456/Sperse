import { Component, Output, EventEmitter } from '@angular/core';
import { PeriodService } from '@app/shared/common/period/period.service';
import { Period } from '@app/shared/common/period/period.enum';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-period',
    templateUrl: './period.component.html',
    styleUrls: [
        '../../../shared/common/styles/select-box.less',
        './period.component.less'
    ]
})
export class PeriodComponent  {
    @Output() onChange: EventEmitter<Period> = new EventEmitter();
    selectedPeriod: Period = this.periodService.selectedPeriod.period;
    availablePeriods: { value: Period, displayValue: string }[] = this.periodService.availablePeriods.map((period: Period) => ({
        value: period,
        displayValue: this.ls.l(period)
    }));

    constructor(
        private periodService: PeriodService,
        private ls: AppLocalizationService
    ) {}

    onPeriodChanged($event) {
        this.periodService.selectedPeriod = this.periodService.getDatePeriod($event.value);
        this.periodService.saveSelectedPeriodInCache($event.value);
        this.onChange.emit($event.value);
    }
}
