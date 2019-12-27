import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WhyTheyBuyHostComponent } from '@root/public/why-they-buy-host/why-they-buy-host.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: WhyTheyBuyHostComponent,
                canActivate: [],
                canActivateChild: []
            }
        ])
    ],
    exports: [ RouterModule ],
    providers: []
})
export class WhyTheyBuyHostRoutingModule {}
