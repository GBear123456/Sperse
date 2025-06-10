/** Core imports */
import {Component, ViewChild, AfterViewInit, HostListener} from '@angular/core';

/** Third party imports */
import { DxDateBoxComponent } from 'devextreme-angular/ui/date-box';
import * as moment from 'moment-timezone';
import { first } from 'rxjs/operators';

/** Application imports */
import { SyncDatePickerService } from './sync-date-picker.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { DateHelper } from '@shared/helpers/DateHelper';

@Component({
  selector: 'sync-date-picker',
  templateUrl: './sync-date-picker.component.html',
  styleUrls: ['./sync-date-picker.component.less']
})
export class SyncDatePickerComponent implements AfterViewInit {
    @ViewChild(DxDateBoxComponent) dateBox: DxDateBoxComponent;
    maxDate = moment();

    @HostListener('click') onClick() {
        this.dateBox.instance.open();
    }

    constructor(
        public syncService: SyncDatePickerService,
        public ls: AppLocalizationService
    ) {}

    ngAfterViewInit() {
        this.syncService.maxSyncDate$.pipe(first()).subscribe(date => {
            if (date && date.isValid())
                this.dateBox.instance.option('value', date.toDate());
        });
    }

    apply(event) {
        let date = event.value;
        if (event.event && date != event.previousValue && (
            !date || !event.previousValue ||
            moment(date).diff(event.previousValue, 'days')
        )) {
            if (date && !(date instanceof moment))
                date = moment(DateHelper.removeTimezoneOffset(date));
            this.syncService.setMaxVisibleDate(date);
        }
    }
}
