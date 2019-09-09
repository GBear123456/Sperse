import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-score-factors',
    templateUrl: './score-factors.component.html',
    styleUrls: ['./score-factors.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScoreFactorsComponent {
    @Input() creditReport;

    constructor(
        public ls: AppLocalizationService
    ) {
    }
}
