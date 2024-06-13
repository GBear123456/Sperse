/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output
} from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';
import moment from 'moment-timezone';

/** Application imports */
import { SettingScopes, NameValueDto, TimingServiceProxy } from '@shared/service-proxies/service-proxies';
import { defaultCountryZone } from './timezone-combo.data';

@Component({
    selector: 'timezone-combo',
    templateUrl: './timezone-combo.component.html',
    styleUrls: ['./timezone-combo.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeZoneComboComponent implements OnInit {
    @Input() selectedTimeZone: string = undefined;
    @Input() defaultTimezoneScope: SettingScopes;
    @Output() selectedTimeZoneChange: EventEmitter<string> = new EventEmitter<string>();
    timeZones$: Observable<NameValueDto[]>;

    constructor(
        private timingService: TimingServiceProxy,
        private changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.timeZones$ = this.timingService.getTimezones(this.defaultTimezoneScope).pipe(
            pluck('items')
        );
    }

    setTimezoneByCountryCode(code: string) {
        let countryTimezone = defaultCountryZone[code];
        if (countryTimezone) {
            this.selectedTimeZone = countryTimezone;
            this.changeDetectorRef.detectChanges();
        }
    }
}
