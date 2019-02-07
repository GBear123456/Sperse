import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OffersComponent } from '@app/pfm/offers/offers.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: 'offers', pathMatch: 'full' },
            {
                path: '',
                children: [
                    { path: 'offers', component: OffersComponent, data: { permission: '' } }
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
