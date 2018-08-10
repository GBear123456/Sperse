import {Component, AfterViewInit, Input, Injector} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';

@Component({
    selector: 'app-score-preview',
    templateUrl: './score-preview.component.html',
    styleUrls: ['./score-preview.component.less']
})
export class ScorePreviewComponent extends AppComponentBase implements AfterViewInit {
    @Input() actualCreditScore;
    @Input() calculatedCreditScore;

    constructor(injector: Injector) {
        super(injector);
    }

    ngAfterViewInit() {
    }

    getScoreColor(score: number) {
        if (score >= 750) return '#48dc8e';
        else if (score >= 650) return '#e8da51';
        else if (score >= 550) return '#f5a623';
        else return '#e0533b';
    }
}
