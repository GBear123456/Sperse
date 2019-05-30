import { Component, Output, EventEmitter } from '@angular/core';
import { PeriodService } from '@app/shared/common/period/period.service';

@Component({
    selector: 'app-period',
    templateUrl: './period.component.html',
    styleUrls: [ '../../../shared/common/styles/select-box.less']
})
export class PeriodComponent  {
    @Output() onChange = new EventEmitter();
    selectedPeriod: string = this.periodService.selectedPeriod.name;
    availablePeriods: string[] = this.periodService.availablePeriods;

    constructor(
        private periodService: PeriodService
    ) {}

    onPeriodChanged($event) {
        this.periodService.saveSelectedPeriodInCache($event.value);
        this.onChange.emit($event.value);
    }
}
