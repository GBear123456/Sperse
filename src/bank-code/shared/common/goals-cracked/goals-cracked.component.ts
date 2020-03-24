import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { GoalType } from '@app/shared/common/bank-code/goal-type.interface';

@Component({
    selector: 'bank-code-goals-cracked',
    templateUrl: './goals-cracked.component.html',
    styleUrls: [
        '../styles/card-title.less',
        './goals-cracked.component.less'
    ]
})
export class GoalsCrackedComponent {
    goalTypes: GoalType[] = this.bankCodeService.goalTypes;

    constructor(
        private bankCodeService: BankCodeService,
        public ls: AppLocalizationService
    ) {}

}
