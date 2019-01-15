import { Component } from '@angular/core';
import { Category } from '@shared/service-proxies/service-proxies';

import { kebabCase, lowerCase, startCase } from 'lodash';

@Component({
    selector: 'navigation',
    templateUrl: './navigation.component.html',
    styleUrls: [ './navigation.component.less' ]
})
export class NavigationComponent {
    links = [
        Category.CreditScore,
        // Category.CreditRepair,
        Category.CreditMonitoring,
        Category.DebtConsolidation
    ].map(category => kebabCase(category));

    getLinkName(name: string): string {
        return startCase(lowerCase(name));
    }
}
