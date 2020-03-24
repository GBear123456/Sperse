/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output
} from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';

/** Application imports */
import { SettingScopes, NameValueDto, TimingServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'timezone-combo',
    template: `<select class='form-control'
                       [(ngModel)]='selectedTimeZone'
                       (ngModelChange)='selectedTimeZoneChange.emit($event)'>
                        <option *ngFor='let timeZone of timeZones$ | async' [value]='timeZone.value'>{{timeZone.name}}</option>
                </select>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeZoneComboComponent implements OnInit {
    @Input() selectedTimeZone: string = undefined;
    @Input() defaultTimezoneScope: SettingScopes;
    @Output() selectedTimeZoneChange: EventEmitter<string> = new EventEmitter<string>();
    timeZones$: Observable<NameValueDto[]>;

    constructor(private timingService: TimingServiceProxy) {}

    ngOnInit() {
        this.timeZones$ = this.timingService.getTimezones(this.defaultTimezoneScope).pipe(
            pluck('items')
        );
    }
}
