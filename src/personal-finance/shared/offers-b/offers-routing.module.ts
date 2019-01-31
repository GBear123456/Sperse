import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OffersLayoutComponent } from '@root/personal-finance/shared/offers-b/offers-layout.component';
import { OfferDetailsComponent } from '@root/personal-finance/shared/offers-b/offer-details/offer-details.component';
import { CreditCardsComponent } from '@root/personal-finance/shared/offers-b/credit-cards/credit-cards.component';
import { CreditScoreComponent } from '@root/personal-finance/shared/offers-b/credit-score/credit-score.component';
import { CreditMonitoringComponent } from '@root/personal-finance/shared/offers-b/credit-monitoring/credit-monitoring.component';
import { BusinessLoansComponent } from '@root/personal-finance/shared/offers-b/business-loans/business-loans.component';
import { DebtConsolidationComponent } from '@root/personal-finance/shared/offers-b/debt-consolidation/debt-consolidation.component';

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
                path: 'credit-scores',
                component: CreditScoreComponent
            },
            {
                path: 'id-theft-protection',
                component: CreditMonitoringComponent
            },
            {
                path: 'debt-consolidation',
                component: DebtConsolidationComponent
            },
            {
                path: 'business-loans',
                component: BusinessLoansComponent
            },
            {
                path: ':category/:campaignId',
                component: OfferDetailsComponent,
                data: { reuse: true }
            },
            {
                path: ':category',
                component: OffersLayoutComponent,
                data: { reuse: false }
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
