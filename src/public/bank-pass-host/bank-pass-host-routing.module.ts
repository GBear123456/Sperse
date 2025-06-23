import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppComponent } from '@root/public/bank-pass-host/app.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: AppComponent,
                canActivate: [],
                canActivateChild: []
            }
        ])
    ],
    exports: [ RouterModule ],
    providers: []
})
export class BankPassHostRoutingModule {}
