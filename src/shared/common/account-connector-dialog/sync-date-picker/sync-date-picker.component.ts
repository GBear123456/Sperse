/** Core imports */
import {Component, Injector, ViewChild, HostListener} from '@angular/core';

/** Third party imports */
import { DxDateBoxComponent } from 'devextreme-angular/ui/date-box';
import * as moment from 'moment-timezone';

/** Application imports */
import { SyncDatePickerService } from './sync-date-picker.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';

@Component({
  selector: 'sync-date-picker',
  templateUrl: './sync-date-picker.component.html',
  styleUrls: ['./sync-date-picker.component.less']
})
export class SyncDatePickerComponent extends CFOComponentBase {
    @ViewChild(DxDateBoxComponent) dateBox: DxDateBoxComponent;
    maxDate = moment();
    @HostListener('click') onClick() {
        this.dateBox.instance.open();
    }

    constructor(
        injector: Injector,
        public syncService: SyncDatePickerService
    ) {
        super(injector);
    }

    apply(event) {
        if (event.previousValue && moment(event.value).diff(event.previousValue, 'days'))
            this.syncService.setMaxVisibleDate(event.value);
    }
}
