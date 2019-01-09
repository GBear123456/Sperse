import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OffersComponent } from '@root/personal-finance/shared/offers/offers.component';
import { OfferDetailsComponent } from '@root/personal-finance/shared/offers/offer-details/offer-details.component';
import { CreditCardsComponent } from '@root/personal-finance/shared/offers/credit-cards/credit-cards.component';
import { CreditScoreComponent } from '@root/personal-finance/shared/offers/credit-score/credit-score.component';
import { kebabCase } from 'lodash';
import { Category } from '@shared/service-proxies/service-proxies';
import { CreditMonitoringComponent } from '@root/personal-finance/shared/offers/credit-monitoring/credit-monitoring.component';

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
                path: kebabCase(Category.CreditScore),
                component: CreditScoreComponent
            },
            {
                path: kebabCase(Category.CreditRepair),
                component: CreditScoreComponent
            },
            {
                path: kebabCase(Category.CreditMonitoring),
                component: CreditMonitoringComponent
            },
            {
                path: kebabCase(Category.DebtConsolidation),
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
