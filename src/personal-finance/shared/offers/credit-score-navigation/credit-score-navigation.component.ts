import { Component } from '@angular/core';
import { Category } from '@shared/service-proxies/service-proxies';

import { kebabCase, lowerCase, startCase } from 'lodash';

@Component({
    selector: 'app-credit-score-navigation',
    templateUrl: './credit-score-navigation.component.html',
    styleUrls: [ './credit-score-navigation.component.less' ]
})
export class CreditScoreNavigationComponent {
    links = [
        Category.CreditScore,
        Category.CreditRepair,
        Category.CreditMonitoring,
        Category.DebtConsolidation
    ].map(category => kebabCase(category));

    getLinkName(name: string): string {
        return startCase(lowerCase(name));
    }
}
