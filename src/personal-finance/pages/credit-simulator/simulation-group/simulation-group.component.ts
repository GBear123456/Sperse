import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ScoreSimulatorDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '../../../../app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-simulation-group',
    templateUrl: './simulation-group.component.html',
    styleUrls: ['./simulation-group.component.less']
})
export class SimulationGroupComponent {
    @Input() score;
    @Input() actualCreditScore;
    @Output() newScore = new EventEmitter<number>();
    trueFalse = [
        { title: 'Yes', value: 'true' },
        { title: 'No', value: 'false' }
    ];
    pastDueDays = [
        { title: '30 days', value: 30 },
        { title: '60 days', value: 60 },
        { title: '90 days', value: 90 }
    ];

    constructor(
        public ls: AppLocalizationService
    ) {}

    changingBalance(event) {
        if (event.value !== this.actualCreditScore.outstandingBalance * 100 && event.value > this.actualCreditScore.outstandingBalance * 100) {
            this.score.increaseCreditBalance = event.value - this.actualCreditScore.outstandingBalance * 100;
            this.score.decreaseCreditBalance = undefined;
        } else if (event.value !== this.actualCreditScore.outstandingBalance * 100 && event.value < this.actualCreditScore.outstandingBalance * 100) {
            this.score.decreaseCreditBalance = Math.abs(event.value - this.actualCreditScore.outstandingBalance * 100);
            this.score.increaseCreditBalance = undefined;
        }
    }

    format(value) {
        return (value / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
    }

    monthFormat(value) {
        return value + ' month(s)';
    }

    resetField(e) {
    }

    updateScore() {
        this.newScore.emit(this.score);
    }

    resetAll() {
        this.score = new ScoreSimulatorDto();
    }

}
