import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

//import { LoanComponent } from './loans/loans.component';
//import { CreditCardsComponent } from './credit-cards/credit-cards.component';
import { CreditReportComponent } from './credit-report/credit-report.component';
import { CreditWizardPageComponent } from './credit-report/wizard-form/wizard-page/wizard-page.component';
import { LandingComponent } from './landing.component';
import { OffersComponent } from '@root/personal-finance/shared/offers/offers.component';
import { OfferDetailsComponent } from '@root/personal-finance/shared/offers/offer-details/offer-details.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: LandingComponent,
                children: [
                    { path: '', component: CreditReportComponent },
                    { path: 'signup', component: CreditWizardPageComponent},
                    { path: 'offers', component: OffersComponent },
                    { path: 'offer/:id', component: OfferDetailsComponent }
                    // { path: 'credit-cards', component: CreditCardsComponent },
                    // { path: 'loans', component: LoanComponent }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class LandingRoutingModule {}
