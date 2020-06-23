import { Component, OnInit } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'application-status',
    templateUrl: './application-status.component.html',
    styleUrls: ['./application-status.component.less']
})
export class ApplicationStatusComponent implements OnInit {
    constructor(
        public ls: AppLocalizationService
    ) {
    }

    ngOnInit() {
    }
}
