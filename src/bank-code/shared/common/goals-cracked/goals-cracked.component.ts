/** Core imports */
import { Component, Input } from '@angular/core';

/** Third party imports */
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

/** Application imports */
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
    @Input() showPercents = false;
    @Input() showNumbers = false;
    @Input() showAll = false;
    @Input() showStubsIfEmpty = false;
    goalTypes: GoalType[] = this.bankCodeService.goalTypes;

    constructor(
        public bankCodeService: BankCodeService,
        public ls: AppLocalizationService
    ) {}

    getPercent(currentNumber$: Observable<number>, number: number) {
        return this.bankCodeService.getPercent(currentNumber$, number).pipe(
            switchMap((percent: number) => !percent && this.showStubsIfEmpty
                /** To show stub data if empty */
                ? this.bankCodeService.getPercent(of(Math.floor(Math.random() * number) + 1), number)
                : of(percent)
            )
        );
    }
}
