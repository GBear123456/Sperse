import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-recommendations',
    templateUrl: './recommendations.component.html',
    styleUrls: ['./recommendations.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecommendationsComponent {
    @Input() creditReport;

    constructor(
        public ls: AppLocalizationService
    ) {
    }
}
