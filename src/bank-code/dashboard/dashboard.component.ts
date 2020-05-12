import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.component.html',
    styleUrls: ['dashboard.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
    constructor(public ls: AppLocalizationService) {}
}