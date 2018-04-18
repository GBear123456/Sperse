import {Component, Injector, OnInit, Input, EventEmitter, Output} from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';

@Component({
  selector: 'app-report-period',
  templateUrl: './report-period.component.html',
  styleUrls: ['./report-period.component.less']
})
export class ReportPeriodComponent extends CFOComponentBase implements OnInit {
    @Input() sliderReportPeriod: any;
    @Output() onPeriodSelected: EventEmitter<any> = new EventEmitter();

    reportPeriodTooltipVisible = false;

    constructor(
        injector: Injector,
    ) {
        super(injector);
    }

    toggleReportPeriodFilter() {
        this.reportPeriodTooltipVisible = !this.reportPeriodTooltipVisible;
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

    ngOnInit() {
    }

}
