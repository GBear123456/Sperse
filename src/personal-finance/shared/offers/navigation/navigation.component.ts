import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'navigation',
    templateUrl: './navigation.component.html',
    styleUrls: [ './navigation.component.less' ]
})
export class NavigationComponent {
    constructor(private ls: AppLocalizationService) {}
    links = [
        {
            name: this.ls.l('CreditScore_CreditScores'),
            url: 'credit-scores'
        },
        {
            name: this.ls.l('Offers_DebtConsolidation'),
            url: 'debt-consolidation'
        },
        {
            name: this.ls.l('Offers_IdTheftProtection'),
            url: 'id-theft-protection'
        }
    ];
}
