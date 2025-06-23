import { Component, Injector } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'storage-change-dialog',
    templateUrl: 'storage-change-dialog.component.html',
    styleUrls: ['storage-change-dialog.component.less']
})
export class StorageChangeDialog {
    constructor(
        public ls: AppLocalizationService
    ) {
    }
}
