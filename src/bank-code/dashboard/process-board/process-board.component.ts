/** Core imports */
import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Third party imports */
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '../../../shared/common/session/app-session.service';
import { BankCodeService } from '../../../app/shared/common/bank-code/bank-code.service';

@Component({
    selector: 'process-board',
    templateUrl: 'process-board.component.html',
    styleUrls: ['process-board.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessBoardComponent {
    steps = [
        {
            name: 'Create Your Account',
            completed$: of(true)
        },
        {
            name: 'Crack Your Own BANKCODE',
            completed$: of(!!this.appSession.user.bankCode)
        },
        {
            name: 'Crach A Contact\'s BANKCODE',
            completed$: this.bankCodeService.getClientsBankCodesTotalCount().pipe(
                map(Boolean)
            )
        },
        {
            name: 'Complete The Basic Training',
            completed$: of(false)
        },
        {
            name: 'TAKE IT TO THE BANK!®',
            completed$: of(false)
        }
    ];
    constructor(
        private appSession: AppSessionService,
        private bankCodeService: BankCodeService,
        public ls: AppLocalizationService
    ) {}
}