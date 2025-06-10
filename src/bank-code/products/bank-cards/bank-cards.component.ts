import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'bank-cards',
    templateUrl: 'bank-cards.component.html',
    styleUrls: ['./bank-cards.component.less']
})
export class BankCardsComponent {
    constructor(public ls: AppLocalizationService) {}
}
