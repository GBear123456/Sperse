import { Component, Output, EventEmitter } from '@angular/core';
import { DashboardWidgetsService } from '@shared/crm/dashboard-widgets/dashboard-widgets.service';

@Component({
    selector: 'app-period',
    templateUrl: './period.component.html',
    styleUrls: [ '../../../shared/common/styles/select-box.less']
})
export class PeriodComponent  {
    @Output() onChange = new EventEmitter();
    selectedPeriod: string = this._dashboardWidgetsService.selectedPeriod;
    availablePeriods: string[] = this._dashboardWidgetsService.availablePeriods;

    constructor(
        private _dashboardWidgetsService: DashboardWidgetsService
    ) {}

    onPeriodChanged($event) {
        this._dashboardWidgetsService.periodChanged(this._dashboardWidgetsService.getDatePeriodFromName($event.value));
    }
}
