import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'complete',
    templateUrl: 'complete.component.html',
    styleUrls: ['complete.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompleteComponent {
    constructor(public ls: AppLocalizationService) {}
}