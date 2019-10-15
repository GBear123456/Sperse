import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'bank-vault',
    templateUrl: 'bank-vault.component.html',
    styleUrls: ['./bank-vault.component.less']
})
export class BankVaultComponent {
    constructor(public ls: AppLocalizationService) {}
}
