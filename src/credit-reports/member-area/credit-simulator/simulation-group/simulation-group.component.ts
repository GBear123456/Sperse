import {Component, OnInit, Input, Injector, Output, EventEmitter } from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';
import {ScoreSimulatorDto} from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'app-simulation-group',
    templateUrl: './simulation-group.component.html',
    styleUrls: ['./simulation-group.component.less']
})
export class SimulationGroupComponent extends AppComponentBase implements OnInit {
    @Input() score;
    @Input() actualCreditScore;
    @Output() newScore = new EventEmitter<number>();
    trueFalse = [
        {title: 'Yes', value: 'true'},
        {title: 'No', value: 'false'}
    ];
    pastDueDays = [
        {title: '30 days', value: 30},
        {title: '60 days', value: 60},
        {title: '90 days', value: 90}
    ];

    constructor(injector: Injector) {
        super(injector);
    }

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
        return (value / 100).toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 0});
    }

    monthFormat(value) {
        return value + ' month(s)';
    }

    resetField() {
    }

    updateScore() {
        this.newScore.emit(this.score);
    }

    ngOnInit() {}

    resetAll() {
        this.score = new ScoreSimulatorDto();
    }

}
