import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';
import {
    SettingScopes,
    NameValueDtoListResultDto,
    TimingServiceProxy
} from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'timezone-combo',
    template: `<select #TimeZoneCombobox
                    class='form-control'
                    [(ngModel)]='selectedTimeZone'
                    (ngModelChange)='selectedTimeZoneChange.emit($event)'>
                        <option *ngFor='let timeZone of timeZones$ | async' [value]='timeZone.value'>{{timeZone.name}}</option>
                </select>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeZoneComboComponent implements OnInit {
    @ViewChild('TimeZoneCombobox') timeZoneComboboxElement: ElementRef;
    @Input() selectedTimeZone: string = undefined;
    @Input() defaultTimezoneScope: SettingScopes;
    @Output() selectedTimeZoneChange: EventEmitter<string> = new EventEmitter<string>();
    timeZones$: Observable<NameValueDtoListResultDto[]>;

    constructor(private _timingService: TimingServiceProxy) {}

    ngOnInit() {
        this.timeZones$ = this._timingService.getTimezones(this.defaultTimezoneScope).pipe(
            pluck('items')
        );
    }
}
