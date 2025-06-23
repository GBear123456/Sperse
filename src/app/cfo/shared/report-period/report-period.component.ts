import { Component, Injector, Input, EventEmitter, Output } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';

@Component({
  selector: 'app-report-period',
  templateUrl: './report-period.component.html',
  styleUrls: ['./report-period.component.less']
})
export class ReportPeriodComponent extends CFOComponentBase {
    @Input() sliderReportPeriod: any;
    @Output() onPeriodSelected: EventEmitter<any> = new EventEmitter();

    reportPeriodTooltipVisible = false;

    constructor(
        injector: Injector,
    ) {
        super(injector);
    }

    apply() {
        let period = {
            start: this.sliderReportPeriod.start,
            end: this.sliderReportPeriod.end
        };
        this.onPeriodSelected.emit(period);
        this.reportPeriodTooltipVisible = false;
    }

    clear() {
        this.onPeriodSelected.emit({});
        this.reportPeriodTooltipVisible = false;
    }

}
