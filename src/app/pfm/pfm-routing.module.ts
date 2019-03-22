import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OffersComponent } from '@app/pfm/offers/offers.component';
import { OfferEditComponent } from '@app/pfm/offer-edit/offer-edit.component';
import { CloseComponentGuard } from '@app/shared/common/close-component.service/close-component-guard';
import { CloseComponentService } from '@app/shared/common/close-component.service/close-component.service';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: 'offers', pathMatch: 'full' },
            {
                path: '',
                children: [
                    { path: 'offers', component: OffersComponent, data: { permission: '', reuse: true } },
                    { path: 'offers/:id', redirectTo: 'offers/:id/general' },
                    { path: 'offers/:id/:section', component: OfferEditComponent, canDeactivate: [ CloseComponentGuard ] }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ],
    providers: [
        CloseComponentService,
        CloseComponentGuard
    ]
})
export class PfmRoutingModule { }
