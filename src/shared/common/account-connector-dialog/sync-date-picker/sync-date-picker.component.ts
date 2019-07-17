/** Core imports */
import {Component, Injector, ViewChild, OnInit, EventEmitter, Output, HostListener} from '@angular/core';

/** Third party imports */
import { DxDateBoxComponent } from 'devextreme-angular/ui/date-box';
import * as moment from 'moment-timezone';

/** Application imports */
import { SyncDatePickerService } from './sync-date-picker.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
  selector: 'sync-date-picker',
  templateUrl: './sync-date-picker.component.html',
  styleUrls: ['./sync-date-picker.component.less']
})
export class SyncDatePickerComponent {
    @ViewChild(DxDateBoxComponent) dateBox: DxDateBoxComponent;

    @HostListener('click') onClick() {
        this.dateBox.instance.open();
    }

    maxDate = moment();

    constructor(
        public syncService: SyncDatePickerService,
        public ls: AppLocalizationService
    ) {
    }

    apply(event) {
        if (event.previousValue && event.value)
            this.syncService.setMaxVisibleDate(event.value);
    }
}
