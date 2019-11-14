import {AfterViewInit, Component} from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.component.html',
    styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent implements AfterViewInit {
    constructor(
        public ls: AppLocalizationService
    ) { }

    ngAfterViewInit() {}
}
