import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.component.html',
    styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent {
    bankCodeLevel$: Observable<number> = this.bankCodeService.bankCodeLevel$;

    constructor(
        private bankCodeService: BankCodeService,
        public ls: AppLocalizationService
    ) {}
}
