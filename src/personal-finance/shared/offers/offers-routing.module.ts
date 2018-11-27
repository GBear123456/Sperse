import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OffersComponent } from '@root/personal-finance/shared/offers/offers.component';
import { OfferDetailsComponent } from '@root/personal-finance/shared/offers/offer-details/offer-details.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: ':category/:id',
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
                redirectTo: 'credit-cards'
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class OffersRoutingModule { }
