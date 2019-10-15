import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'bank-pass',
    templateUrl: 'bank-pass.component.html',
    styleUrls: ['./bank-pass.component.less']
})
export class BankPassComponent {
    constructor(public ls: AppLocalizationService) {}
}
