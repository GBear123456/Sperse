import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-accounts-synch-status',
    templateUrl: './accounts-synch-status.component.html',
    styleUrls: ['./accounts-synch-status.component.less']
})
export class AccountsSynchStatusComponent {
    accountsSynchData = [
        {accName: 'Bank of America', progress: 100, isDone: true},
        {accName: 'Merrill Lynch', progress: 68, isDone: false},
        {accName: 'City Bank', progress: 23, isDone: false}
    ];
    constructor(public ls: AppLocalizationService) {}
}
