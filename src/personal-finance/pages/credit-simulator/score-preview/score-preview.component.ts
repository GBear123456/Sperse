import { Component, Input } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-score-preview',
    templateUrl: './score-preview.component.html',
    styleUrls: ['./score-preview.component.less']
})
export class ScorePreviewComponent {
    @Input() actualCreditScore;
    @Input() calculatedCreditScore;
    constructor(public ls: AppLocalizationService) {}

    getScoreColor(score: number) {
        if (score >= 750) return '#48dc8e';
        else if (score >= 650) return '#e8da51';
        else if (score >= 550) return '#f5a623';
        else return '#e0533b';
    }
}
