import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OffersComponent } from '@root/personal-finance/shared/offers/offers.component';
import { OfferDetailsComponent } from '@root/personal-finance/shared/offers/offer-details/offer-details.component';
import { CreditCardsComponent } from '@root/personal-finance/shared/offers/credit-cards/credit-cards.component';
import { CreditScoreComponent } from '@root/personal-finance/shared/offers/credit-score/credit-score.component';
import { kebabCase } from 'lodash';
import { Category } from '@shared/service-proxies/service-proxies';
import { CreditMonitoringComponent } from '@root/personal-finance/shared/offers/credit-monitoring/credit-monitoring.component';

const creditCardsCategories = [
    kebabCase(Category.CreditScore),
    kebabCase(Category.CreditRepair),
    kebabCase(Category.CreditMonitoring),
    kebabCase(Category.DebtConsolidation)
];

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: 'credit-cards/home',
                redirectTo: 'credit-cards/home/Best'
            },
            {
                path: 'credit-cards/home/:group',
                component: CreditCardsComponent
            },
            {
                path: creditCardsCategories[0],
                component: CreditScoreComponent
            },
            {
                path: creditCardsCategories[1],
                component: CreditScoreComponent
            },
            {
                path: creditCardsCategories[2],
                component: CreditMonitoringComponent
            },
            {
                path: creditCardsCategories[3],
                component: CreditScoreComponent
            },
            {
                path: ':category/:campaignId',
                component: OfferDetailsComponent,
                data: { reuse: true }
            },
            {
                path: ':category',
                component: OffersComponent,
                data: { reuse: true },
            },
            {
                path: '',
                redirectTo: '/personal-finance/home'
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class OffersRoutingModule { }
