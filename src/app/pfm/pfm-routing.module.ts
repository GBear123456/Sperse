import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OffersComponent } from '@app/pfm/offers/offers.component';
import { OfferEditComponent } from '@app/pfm/offer-edit/offer-edit.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: 'offers', pathMatch: 'full' },
            {
                path: '',
                children: [
                    { path: 'offers', component: OffersComponent, data: { permission: '', reuse: true } },
                    { path: 'offers/:id', redirectTo: 'offers/:id/general' },
                    { path: 'offers/:id/:section', component: OfferEditComponent }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ],
    providers: [
    ]
})
export class PfmRoutingModule { }
