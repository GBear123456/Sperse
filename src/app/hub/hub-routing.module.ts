import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MarketplaceComponent } from './marketplace/marketplace.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: 'marketplace', pathMatch: 'full' },
            {
                path: '',
                children: [
                    { path: 'marketplace', component: MarketplaceComponent }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class HubRoutingModule {
}
