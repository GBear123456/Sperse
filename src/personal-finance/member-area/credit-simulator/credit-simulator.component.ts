import {Component, OnInit, Injector} from '@angular/core';
import {appModuleAnimation} from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { Router } from '@angular/router';
import { AppConsts } from '@shared/AppConsts';
import { finalize } from 'rxjs/operators';

import { CreditSimulatorServiceProxy, ScoreSimulatorDto, ScoreSimulatorInfoDto, ScoreSimulatorInfoDtoAccessStatus } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'app-credit-calculator',
    templateUrl: './credit-simulator.component.html',
    styleUrls: ['./credit-simulator.component.less'],
    animations: [appModuleAnimation()],
    providers: [CreditSimulatorServiceProxy]
})
export class CreditSimulatorComponent extends AppComponentBase implements OnInit {
    simulatorInfo: ScoreSimulatorInfoDto;
    actualCreditScore: ScoreSimulatorInfoDto = new ScoreSimulatorInfoDto();
    score: ScoreSimulatorDto = new ScoreSimulatorDto();
    calculatedCreditScore: number;
    historyItems = [];
    scoreSimulatorInfoDtoAccessStatus = ScoreSimulatorInfoDtoAccessStatus;

    constructor(
        injector: Injector,
        private _simulateScoreService: CreditSimulatorServiceProxy,
        private _router: Router
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CreditReportLocalizationSourceName;
    }

    ngOnInit() {
        abp.ui.setBusy();
        this._simulateScoreService.getScoreSimulatorInfo()
            .pipe(finalize(() => { abp.ui.clearBusy(); }))
            .subscribe(result => {
                this.simulatorInfo = result;

                if (result.accessStatus == ScoreSimulatorInfoDtoAccessStatus.Ok) {
                    this.actualCreditScore = result;
                }
            });
    }

    simulateScore(request): void {
        this.clearModelBeforeSubmit();
        this._simulateScoreService
            .simulateScore(request)
            .subscribe(result => {
                this.calculatedCreditScore = result;
                this.historyItems.push({
                    currentScore: this.actualCreditScore.initialScore,
                    simulatedScore: this.calculatedCreditScore,
                    progress: (((this.calculatedCreditScore / this.actualCreditScore.initialScore) * 100) - 100).toFixed(1),
                    request: this.getHistoryLog()
                });
            });
    }

    clearModelBeforeSubmit() {
        this.foreachScore((prop, value) => {
            if (typeof value === 'number' && value == 0) {
                this.score[prop] = undefined;
            }
        });
    }

    getNewScore($event) {
        this.score = $event;
        this.simulateScore(this.score);
    }

    getHistoryLog() {
        let historyLog = [];

        this.foreachScore((prop, value) => {
            let formattedValue;
            if (typeof value === 'number') {
                if ((prop == 'onTimePayment') || (prop == 'oneAccountPastDue') || (prop == 'allAccountsPastDue') || (prop == 'payOffAllCreditCards') || (prop == 'applyForCreditCard')) {
                    formattedValue = this.capitalize(value);
                } else {
                    formattedValue = (value / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
                }
            } else {
                formattedValue = this.capitalize(value);
            }
            historyLog.push({ key: prop, val: formattedValue });
        });
        
        return historyLog;
    }

    foreachScore(action: (prop: string, value: any) => void) {
        for (var k in this.score) {
            let scoreValue = this.score[k];
            if (typeof scoreValue !== 'function' && typeof scoreValue != 'undefined') {
                action(k, scoreValue);
            }
        }
    }
}
