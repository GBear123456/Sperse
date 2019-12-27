import {Component, OnInit} from '@angular/core';
import {AppLocalizationService} from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'bank-code-goals-cracked',
    templateUrl: './goals-cracked.component.html',
    styleUrls: ['./goals-cracked.component.less']
})
export class GoalsCrackedComponent implements OnInit {
    goalProgress = [
        { name: this.ls.l('Daily goal'), class: 'daily-goal', progress: 67 },
        { name: this.ls.l('Weekly goal'), class: 'weekly-goal', progress: 28 },
        { name: this.ls.l('Monthly goal'), class: 'monthly-goal', progress: 88 },
        { name: this.ls.l('Quarterly goal'), class: 'quarterly-goal', progress: 56 },
        { name: this.ls.l('Annual goal'), class: 'annual-goal', progress: 34 }
    ];

    constructor(
        public ls: AppLocalizationService
    ) {
    }

    ngOnInit() {
    }

}
